import { Entity } from '@shared/domain/entity.base';

export class ShiftEntity extends Entity<string> {
  private employeeId: string;
  private jobId: string;
  private startTime: Date;
  private endTime: Date;

  constructor(
    id: string,
    employeeId: string,
    jobId: string,
    startTime: Date,
    endTime: Date,
  ) {
    super(id);
    this.employeeId = employeeId;
    this.jobId = jobId;
    this.validateDates(startTime, endTime);
    this.startTime = startTime;
    this.endTime = endTime;
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

  public getJobId(): string {
    return this.jobId;
  }

  public getStartTime(): Date {
    return this.startTime;
  }

  public getEndTime(): Date {
    return this.endTime;
  }
}