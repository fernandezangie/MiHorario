import { Controller, Get, Param } from '@nestjs/common';
import { MessageCatalogService } from './message-catalog.service';

@Controller('messaging')
export class MessageTestController {
  constructor(private readonly messageCatalogService: MessageCatalogService) {}

  @Get('test/:code')
  async testMessage(@Param('code') code: string) {
    const message = await this.messageCatalogService.getMessageTemplate(code);
    return {
      success: true,
      queriedCode: code,
      resolvedMessage: message,
    };
  }
}