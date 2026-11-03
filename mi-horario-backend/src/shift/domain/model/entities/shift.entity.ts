import { Entity } from '@shared/domain/entity.base';

export class ShiftEntity extends Entity<string> {
  private employeeId: string;
  private startTime: Date | null;
  private endTime: Date | null;
  private acknowledged: boolean;
  private isRest: boolean;
  private zone: string | null;
  private job: string | null;

  constructor(
    id: string,
    employeeId: string,
    startTime: Date | null,
    endTime: Date | null,
    acknowledged: boolean = false,
    isRest: boolean = false,
    zone: string | null = null,
    job: string | null = null,
  ) {
    super(id);
    this.employeeId = employeeId;

    if (!isRest && startTime && endTime) {
      this.validateDates(startTime, endTime);
    }

    this.startTime = startTime;
    this.endTime = endTime;
    this.acknowledged = acknowledged;
    this.isRest = isRest;
    this.zone = zone;
    this.job = job;
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

  public getZone(): string | null {
    return this.zone;
  }

  public getJob(): string | null {
    return this.job;
  }

  public acknowledge(): void {
    this.acknowledged = true;
  }

  public updateDetails(
    startTime: Date | null,
    endTime: Date | null,
    isRest: boolean,
    zone?: string | null,
    job?: string | null,
  ): void {
    if (!isRest && startTime && endTime) {
      this.validateDates(startTime, endTime);
    }
    this.startTime = startTime;
    this.endTime = endTime;
    this.isRest = isRest;

    if (zone !== undefined) {
      this.zone = zone;
    }
    if (job !== undefined) {
      this.job = job;
    }
  }
}
