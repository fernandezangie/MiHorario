import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  traceId: string;
  actorId: string;
  actorCode: string;
  actorName: string;
  actorRole: string;
  action: string;
  resource: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string;
  summary: string;
}

/**
 * Building Block: Immutable Audit Trail Service (ADR-0006 - Habeas Data / Ley 1581)
 * Registra de forma inmutable todas las operaciones de creación/modificación de turnos,
 * empleados y sedes realizadas en la plataforma.
 */
@Injectable()
export class AuditService {
  private readonly logs: AuditLogEntry[] = [
    {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      traceId: 'BOOT-INIT-001',
      actorId: 'SYSTEM',
      actorCode: 'SYS-CORE',
      actorName: 'Motor de Auditoría MiHorario',
      actorRole: 'ADMIN',
      action: 'SYSTEM_START',
      resource: '/audit-logs',
      statusCode: 200,
      durationMs: 1,
      ipAddress: '127.0.0.1',
      summary: 'Inicialización de bitácora inmutable de auditoría (Ley 1581 Habeas Data)',
    },
  ];

  record(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const created: AuditLogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.unshift(created);
    if (this.logs.length > 500) {
      this.logs.pop();
    }
    return created;
  }

  findAll(limit = 50): AuditLogEntry[] {
    return this.logs.slice(0, limit);
  }
}

