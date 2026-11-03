import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from '../../application/audit.service';
import { Roles } from '@shared/infrastructure/security/roles.decorator';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service'; // 👈 Asegúrate de ajustar la ruta si es necesario

@Controller('audit-logs')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly messageCatalogService: MessageCatalogService, // 👈 Inyectamos el catálogo
  ) {}

  @Roles('ADMIN')
  @Get()
  async listAuditLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;

    const complianceText = await this.messageCatalogService.getMessage(
      'LEY_VALUE',
      'es',
    );

    return {
      compliance: complianceText,
      total: this.auditService.findAll(parsedLimit).length,
      logs: this.auditService.findAll(parsedLimit),
    };
  }
}
