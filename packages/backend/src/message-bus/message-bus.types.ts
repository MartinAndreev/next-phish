export interface ICommandHandler<TData, TResult> {
  execute(data: TData): Promise<TResult>;
}

export interface IQueryHandler<TData, TResult> {
  execute(data: TData): Promise<TResult>;
}
