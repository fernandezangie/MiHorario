import { Controller, Get, Param } from '@nestjs/common';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message-catalog.service';

@Controller('messages')
export class AppController {
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
