import { Meteor } from 'meteor/meteor';
import { createApolloServer, createMongoConnection } from './graphql';

Meteor.startup(async () => {
  await createMongoConnection();
  await createApolloServer();

  console.log("All started up...")
})