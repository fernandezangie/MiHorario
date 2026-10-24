import { Entity } from '@shared/domain/entity.base';

export class JobEntity extends Entity<string> {
  constructor(
    id: string,
    private readonly title: string,
    private readonly description: string,
  ) {
    super(id);
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string {
    return this.description;
  }
}