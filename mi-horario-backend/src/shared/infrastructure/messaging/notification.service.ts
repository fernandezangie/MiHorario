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
    variables: Record<string, string | number> = {},
  ): Promise<boolean> {
    try {
      // 1. Obtener la plantilla desde el catálogo/Redis
      let templateContent =
        await this.messageCatalogService.getMessageTemplate(templateCode);

      this.logger.debug(`[DEBUG TURNO] Código de plantilla: ${templateCode}`);
      this.logger.debug(
        `[DEBUG TURNO] Plantilla obtenida de Redis: "${templateContent}"`,
      );
      this.logger.debug(`[DEBUG VARIABLES RECIBIDAS]`, variables);

      // 2. Control si la plantilla llega vacía o nula
      if (!templateContent || templateContent.trim() === '') {
        this.logger.warn(
          `[EMAIL PASARELA] La plantilla '${templateCode}' no devolvió contenido. Usando fallback con el asunto o variable de mensaje.`,
        );
        // Fallback: asegurar conversión a string para evitar errores de tipo si viene un número
        templateContent = String(
          variables.mensaje ?? variables.message ?? subject,
        );
      }

      // 3. Reemplazo de variables (Soporta sintaxis {key} y {{key}})
      if (variables && typeof variables === 'object') {
        for (const [key, value] of Object.entries(variables)) {
          const replacement =
            value !== undefined && value !== null ? String(value) : '';
          // Expresión regular que coincide con {key} o {{key}}
          const regex = new RegExp(`\\{\\{?${key}\\}?\\}`, 'g');
          templateContent = templateContent.replace(regex, replacement);
        }
      }

      this.logger.debug(`[DEBUG HTML FINAL] "${templateContent}"`);

      // 4. Envío del correo con la estructura HTML esperada
      await this.mailerService.sendMail({
        to: recipientEmail,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2b6cb0;">Notificación de MiHorario</h2>
            <p style="font-size: 16px; line-height: 1.5; font-weight: 500; white-space: pre-line;">${templateContent}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
            <small style="color: #888;">Este es un mensaje automático, por favor no responder.</small>
          </div>
        `,
      });

      this.logger.log(
        `[EMAIL PASARE_LA] Correo enviado exitosamente a: ${recipientEmail}`,
      );

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
