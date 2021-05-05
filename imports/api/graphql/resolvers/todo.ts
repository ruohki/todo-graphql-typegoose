import { DocumentType } from "@typegoose/typegoose";
import { Resolver, Query, Arg, Mutation } from "type-graphql";
import { Todo, Todos } from "../../classes/todo";

@Resolver(() => Todo)
export class TodoResolver {
  @Query(() => Todo, { nullable: true })
  async GetTodo(@Arg("id") id: string): Promise<DocumentType<Todo> | null> {
    return Todos.findById(id);
  }

  @Mutation(() => String)
  async AddTodo(@Arg("title") title: string): Promise<string> {


    const todo = Todos.create({
      
    })

    return Todos.addTodo(title);
  }
}