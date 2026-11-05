import { Injectable, Logger } from '@nestjs/common';
import { BrevoMailService } from './brevo.mail.service';
import { MessageCatalogService } from './message.catalog.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly messageCatalogService: MessageCatalogService,
    private readonly mailService: BrevoMailService,
  ) {}

  async sendEmailNotification(
    templateCode: string,
    recipientEmail: string,
    subject: string,
    variables: Record<string, string | number> = {},
  ): Promise<boolean> {
    try {
      let templateContent =
        await this.messageCatalogService.getMessageTemplate(templateCode);

      this.logger.debug(`[DEBUG TURNO] Código de plantilla: ${templateCode}`);

      if (!templateContent || templateContent.trim() === '') {
        this.logger.warn(
          `[EMAIL] La plantilla '${templateCode}' no devolvió contenido. Usando fallback.`,
        );
        templateContent = String(
          variables.mensaje ?? variables.message ?? subject,
        );
      }

      if (variables && typeof variables === 'object') {
        for (const [key, value] of Object.entries(variables)) {
          const replacement =
            value !== undefined && value !== null ? String(value) : '';
          const regex = new RegExp(`\\{\\{?${key}\\}?\\}`, 'g');
          templateContent = templateContent.replace(regex, replacement);
        }
      }

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2b6cb0;">Notificación de MiHorario</h2>
          <p style="font-size: 16px; line-height: 1.5; font-weight: 500; white-space: pre-line;">${templateContent}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
          <small style="color: #888;">Este es un mensaje automático, por favor no responder.</small>
        </div>
      `;

      await this.mailService.send(recipientEmail, subject, html);

      this.logger.log(
        `[EMAIL] Correo enviado exitosamente a: ${recipientEmail}`,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[EMAIL] Error enviando correo a ${recipientEmail}: ${message}`,
      );
      return false;
    }
  }
}
