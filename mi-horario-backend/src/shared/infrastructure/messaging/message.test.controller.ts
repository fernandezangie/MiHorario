import { Controller, Get, Param } from '@nestjs/common';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Controller('messages')
export class MessageTestController {
  constructor(private readonly messageCatalogService: MessageCatalogService) {}

  // Debe ir ANTES de ':code', si no lo captura esa ruta
  @Get()
  async getAll(): Promise<Record<string, string>> {
    return this.messageCatalogService.getAllMessages('es');
  }

  @Get(':code')
  async getTestMessage(@Param('code') code: string) {
    const resolvedMessage = await this.messageCatalogService.getMessage(
      code,
      'es',
      { id: '99' },
    );

    return {
      success: true,
      requestedCode: code,
      resolvedMessage,
    };
  }
}
