import { Entity } from '@shared/domain/entity.base';

export class EmployeeEntity extends Entity<string> {
  constructor(
    id: string,
    private readonly name: string,
    private readonly email: string,
  ) {
    super(id);
  }

  public getName(): string {
    return this.name;
  }

  public getEmail(): string {
    return this.email;
  }
}