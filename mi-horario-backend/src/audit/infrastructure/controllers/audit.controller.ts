import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from '../../application/audit.service';
import { Roles } from '@shared/infrastructure/security/roles.decorator';

/**
 * Building Block: Audit Trail Controller (ADR-0006)
 * Permite a los Supervisores/Auditores consultar el historial inmutable de cambios.
 */
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Roles('ADMIN')
  @Get()
  listAuditLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return {
      compliance: 'Ley 1581 de 2012 (Habeas Data) - ADR-0006',
      total: this.auditService.findAll(parsedLimit).length,
      logs: this.auditService.findAll(parsedLimit),
    };
  }
}

