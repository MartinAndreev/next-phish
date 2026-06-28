export abstract class Factory<TCreateInput, TModel> {
  constructor(protected createFn: (data: TCreateInput) => Promise<TModel>) {}

  abstract getShape(): TCreateInput;

  async createOne(overrides?: Partial<TCreateInput>): Promise<TModel> {
    const shape = this.getShape();
    const data = { ...shape, ...overrides } as TCreateInput;
    return this.createFn(data);
  }

  async createMany(
    count: number,
    overrides?: Partial<TCreateInput>,
  ): Promise<TModel[]> {
    return Promise.all(
      Array.from({ length: count }, () => this.createOne(overrides)),
    );
  }
}
