import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MessageCatalogService } from './message-catalog.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly messageCatalogService: MessageCatalogService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Envía una notificación por correo electrónico resolviendo la plantilla dinámica desde el caché.
   */
  async sendEmailNotification(
    templateCode: string,
    recipientEmail: string,
    subject: string,
    variables: Record<string, string>,
  ): Promise<boolean> {
    try {
      // 1. Obtener la plantilla (desde Redis o fallback)
      let templateContent = await this.messageCatalogService.getMessageTemplate(templateCode);

      // 2. Reemplazar variables dinámicas ({employeeName}, {date}, etc.)
      for (const [key, value] of Object.entries(variables)) {
        templateContent = templateContent.replace(new RegExp(`{${key}}`, 'g'), value);
      }

      // 3. Enviar el correo electrónico a través de Nodemailer
      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2b6cb0;">Notificación de MiHorario</h2>
            <p style="font-size: 16px; line-height: 1.5;">${templateContent}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
            <small style="color: #888;">Este es un mensaje automático, por favor no responder.</small>
          </div>
        `,
      });

      this.logger.log(`[EMAIL PASARELA] Correo enviado exitosamente a: ${recipientEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`[EMAIL PASARELA] Error enviando correo a ${recipientEmail}`, error);
      return false;
    }
  }
}