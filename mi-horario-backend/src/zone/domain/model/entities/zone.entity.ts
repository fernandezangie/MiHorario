import { Entity } from '@shared/domain/entity.base';

export class ZoneEntity extends Entity<string> {
  private name: string;
  private description: string;
  private location: string;

  constructor(
    id: string,
    name: string,
    description: string,
    location: string,
  ) {
    super(id);
    this.name = name;
    this.description = description;
    this.location = location;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getLocation(): string {
    return this.location;
  }
}