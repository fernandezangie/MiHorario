import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MessageCatalogService } from './message.catalog.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly messageCatalogService: MessageCatalogService,
    private readonly mailerService: MailerService,
  ) {}

  async sendEmailNotification(
    templateCode: string,
    recipientEmail: string,
    subject: string,
    variables: Record<string, string>,
  ): Promise<boolean> {
    try {
      // 1. Obtener la plantilla (desde Redis o fallback)
      let templateContent =
        await this.messageCatalogService.getMessageTemplate(templateCode);

      for (const [key, value] of Object.entries(variables)) {
        templateContent = templateContent
          .split(`{${key}}`)
          .join(String(value ?? ''));
      }

      const info = await this.mailerService.sendMail({
        to: recipientEmail,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2b6cb0;">Notificación de MiHorario</h2>
            <p style="font-size: 16px; line-height: 1.5;">${templateContent}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
            <small style="color: #888;">Este es un mensaje automático, por favor no responder.</small>
          </div>
        `,
      });

      this.logger.log(
        `[EMAIL PASARELA] Correo enviado exitosamente a: ${recipientEmail}`,
      );

      try {
        const nodemailer = require('nodemailer');
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`[EMAIL PASARELA] Vista previa: ${previewUrl}`);
        }
      } catch {
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `[EMAIL PASARELA] Error enviando correo a ${recipientEmail}: ${message}`,
        stack,
      );
      return false;
    }
  }
}