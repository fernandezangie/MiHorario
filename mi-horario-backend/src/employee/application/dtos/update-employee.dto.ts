import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}