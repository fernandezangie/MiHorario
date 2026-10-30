import { Controller, Get, Param } from '@nestjs/common';
import { MessageCatalogService } from './message-catalog.service'; // o ajusta tu ruta de importación si es distinta

@Controller('messages') // <-- ¡Asegúrate de que esta línea esté presente y bien escrita!
export class MessageTestController {
  constructor(private readonly messageCatalogService: MessageCatalogService) {}

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
