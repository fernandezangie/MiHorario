import { Entity } from '@shared/domain/entity.base';

export class ShiftEntity extends Entity<string> {
  private employeeId: string;
  private startTime: Date | null;
  private endTime: Date | null;
  private acknowledged: boolean;
  private isRest: boolean; // 👈 Propiedad para días libres

  constructor(
    id: string,
    employeeId: string,
    startTime: Date | null,
    endTime: Date | null,
    acknowledged: boolean = false,
    isRest: boolean = false, // 👈 Por defecto en false
  ) {
    super(id);
    this.employeeId = employeeId;

    // Solo validamos fechas si no es un día libre y existen ambos valores
    if (!isRest && startTime && endTime) {
      this.validateDates(startTime, endTime);
    }

    this.startTime = startTime;
    this.endTime = endTime;
    this.acknowledged = acknowledged;
    this.isRest = isRest;
  }

  private validateDates(start: Date, end: Date): void {
    if (start >= end) {
      throw new Error('DATE_ERROR');
    }
  }

  public getId(): string {
    return this.id;
  }

  public getEmployeeId(): string {
    return this.employeeId;
  }

  public getStartTime(): Date | null {
    return this.startTime;
  }

  public getEndTime(): Date | null {
    return this.endTime;
  }

  public isAcknowledged(): boolean {
    return this.acknowledged;
  }

  public getIsRest(): boolean {
    return this.isRest;
  }

  // Métodos de dominio para modificar el estado de forma segura
  public acknowledge(): void {
    this.acknowledged = true;
  }

  public updateDetails(
    startTime: Date | null,
    endTime: Date | null,
    isRest: boolean,
  ): void {
    if (!isRest && startTime && endTime) {
      this.validateDates(startTime, endTime);
    }
    this.startTime = startTime;
    this.endTime = endTime;
    this.isRest = isRest;
  }
}
