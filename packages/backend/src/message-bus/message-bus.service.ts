import type { PrismaClient } from "@next-phish/database";
import type { ICommandHandler, IQueryHandler } from "./message-bus.types";

export class MessageBus {
  constructor(private readonly db: PrismaClient) {}

  async dispatch<TData, TResult>(
    handler: ICommandHandler<TData, TResult>,
    data: TData,
  ): Promise<TResult> {
    return this.db.$transaction(() => handler.execute(data));
  }

  async query<TData, TResult>(
    handler: IQueryHandler<TData, TResult>,
    data: TData,
  ): Promise<TResult> {
    return handler.execute(data);
  }
}
