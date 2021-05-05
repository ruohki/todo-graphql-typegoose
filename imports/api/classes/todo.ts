import { ObjectType, Field } from 'type-graphql'
import { prop as Property,   modelOptions as Options, getModelForClass } from '@typegoose/typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { ObjectIdScalar } from '../graphql/helper/scalarObjectId';


@Options({
  schemaOptions: { versionKey: false },
  options: { automaticName: false, customName: "todos" }
})
@ObjectType()
export class Todo {
  @Field(() => ObjectIdScalar)
  _id?: string;

  @Property()
  @Field()
  title?: string

  @Property()
  @Field()
  createdAt?: Date

  @Property()
  @Field()
  resolved?: boolean

  public static async addTodo(this: ModelType<Todo>, title: string): Promise<string> {
    const todo = await Todos.create({ 
      createdAt: new Date(),
      title: title,
      resolved: false
    })

    return todo._id;
  }
}

export const Todos = getModelForClass(Todo);