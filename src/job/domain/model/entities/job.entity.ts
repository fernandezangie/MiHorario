import { Entity } from '@shared/domain/entity.base';

export class JobEntity extends Entity<string> {
  private title: string;
  private description: string;

  constructor(id: string, title: string, description: string) {
    super(id);
    this.title = title;
    this.description = description;
  }

  // Usamos 'this.id' que es provisto por la clase base Entity
  public getId(): string {
    return this.id;
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string {
    return this.description;
  }

  public updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new Error('El título del puesto no puede estar vacío.');
    }
    this.title = newTitle;
  }
}