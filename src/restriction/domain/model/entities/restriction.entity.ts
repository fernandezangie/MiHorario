import { Entity } from '@shared/domain/entity.base';

export type RestrictionType = 'MAX_HOURS_PER_WEEK' | 'MIN_REST_HOURS' | 'UNAVAILABILITY';

export class RestrictionEntity extends Entity<string> {
  private employeeId: string;
  private type: RestrictionType;
  private value: number; // Por ejemplo: 42 horas máximas, 12 horas de descanso mínimo, etc.
  private description: string;

  constructor(
    id: string,
    employeeId: string,
    type: RestrictionType,
    value: number,
    description: string,
  ) {
    super(id);
    this.employeeId = employeeId;
    this.type = type;
    this.value = value;
    this.description = description;
  }

  public getId(): string {
    return this.id;
  }

  public getEmployeeId(): string {
    return this.employeeId;
  }

  public getType(): RestrictionType {
    return this.type;
  }

  public getValue(): number {
    return this.value;
  }

  public getDescription(): string {
    return this.description;
  }
}