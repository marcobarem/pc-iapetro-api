export class User {
  constructor(
    public readonly _id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly cpf: string,
    public readonly phone: string = '',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
