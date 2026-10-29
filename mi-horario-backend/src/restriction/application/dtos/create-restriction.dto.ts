import { RestrictionType } from '@restriction/domain/model/entities/restriction.entity';

export class CreateRestrictionDto {
  employeeId: string;
  type: RestrictionType;
  value: number;
  description: string;
}