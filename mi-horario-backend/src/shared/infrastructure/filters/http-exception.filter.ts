import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CreateRestrictionUseCase } from '@restriction/application/use-cases/create-restriction.use-case';
import { FindRestrictionsByEmployeeUseCase } from '@restriction/application/use-cases/find-restrictions-by-employee.use-case';
import { CreateRestrictionDto } from '@restriction/application/dtos/create-restriction.dto';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message-catalog.service'; // <-- Importa el servicio

@Controller('restriction')
export class RestrictionController {
  constructor(
    private readonly createRestrictionUseCase: CreateRestrictionUseCase,
    private readonly findRestrictionsByEmployeeUseCase: FindRestrictionsByEmployeeUseCase,
    private readonly messageCatalogService: MessageCatalogService, // <-- Inyecta el catálogo
  ) {}

  @Post()
  async create(@Body() dto: CreateRestrictionDto) {
    await this.createRestrictionUseCase.execute(dto);

    // Obtenemos el mensaje de éxito dinámicamente desde Redis
    const successMessage = await this.messageCatalogService.getMessage(
      'RESTRICTION_CREATED_SUCCESS',
      'es',
    );

    return {
      statusCode: 201,
      message: successMessage,
    };
  }

  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string) {
    return await this.findRestrictionsByEmployeeUseCase.execute(employeeId);
  }
}
