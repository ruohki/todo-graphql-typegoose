import { WebApp } from "meteor/webapp";
import { Meteor } from "meteor/meteor";

import * as http from 'http';
import * as net from 'net';
import * as WebSocket from 'ws'

import mongoose from "mongoose";
import url from "url";

import { ApolloServer } from "apollo-server-express";
import { ExpressContext } from "apollo-server-express/dist/ApolloServer";
import { buildSchema } from "type-graphql";
import { PubSub as ApolloPubSub } from "apollo-server-express";

import { ObjectId } from "mongodb";
import { TypegooseMiddleware } from "./helper/typegooseMiddleware";
import { ObjectIdScalar } from "./helper/scalarObjectId";
//import { getUser } from "./helper/getUser";
//import { authChecker } from "./helper/authChecker";


import { SubscriptionServer } from "subscriptions-transport-ws";
import { execute, subscribe } from "graphql";
import { TodoResolver } from "./resolvers/todo";

export interface SubscriptionParams {
  authorization?: string
}

export interface GraphqlContext {
  userId?: string | null;
  user?: Meteor.User | null;
}

export const createMongoConnection = async (): Promise<typeof mongoose> => {
  const mongoUrl = process.env.MONGO_URL ?? "mongodb://localhost:3001/meteor";

  const mongo = await mongoose.connect(mongoUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  return mongo;
};

const createApolloPubSub = () => new ApolloPubSub();

export const createApolloServer = async () => {
  await createMongoConnection();

  const pubSub = createApolloPubSub();

  const schema = await buildSchema({
    resolvers: [TodoResolver],
    pubSub,
    /* authChecker, */
    scalarsMap: [{ type: ObjectId, scalar: ObjectIdScalar }],
    globalMiddlewares: [TypegooseMiddleware],
    validate: true,
  });

  const server = new ApolloServer({
    schema: schema,
    playground: true,
    context: async (context: ExpressContext): Promise<GraphqlContext> => {
      if (!context?.req?.headers?.authorization) return {};

      //const { authorization } = context.req.headers;
      const user = { _id: "HansWurst"} //await getUser(authorization);

      return user ? {
        user,
        userId: user?._id,
      } : {};
    },
  });

  const subscriptionServer = new SubscriptionServer({
    schema,
    execute,
    subscribe,
    onConnect: async (params: SubscriptionParams) => {
      if (params.authorization) {
        const user = { _id: "HansWurst"} //TODO: await getUser(params.authorization);
        return user ? {
          user,
          userId: user?._id,
        } : {};
      }
    }
  }, {
    noServer: true,
  });

  server.applyMiddleware({
    //@ts-expect-error this is compatible and stated in the docs of apollo-server-express to be compatible
    app: WebApp.connectHandlers,
    path: "/graphql",
  });

  WebApp.connectHandlers.use("/graphql", (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.method === "GET") res.end();
  });

  //@ts-expect-error we need to access the private field wich typescript does not like
  const wsServer: WebSocket.Server = subscriptionServer.wsServer;
  const upgradeHandler = (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    if (!req.url) return;
    const pathname = url.parse(req.url).pathname;

    if (!pathname) return
    if (pathname.startsWith("/graphql")) {
      wsServer.handleUpgrade(req, socket, head, (ws) => {
        wsServer.emit("connection", ws, req);
      });
    }
  };
  WebApp.httpServer.on("upgrade", upgradeHandler);
};