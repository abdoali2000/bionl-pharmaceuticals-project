import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Fires a webhook to the given URL asynchronously (non-blocking).
   * Errors are caught and logged — a webhook failure must NEVER cause
   * the calling request to fail.
   */
  fireAndForget(url: string | undefined, payload: WebhookPayload): void {
    if (!url) {
      this.logger.warn(`Webhook URL not configured — skipping event: ${payload.event}`);
      return;
    }

    // Intentionally not awaited — fire and forget
    axios
      .post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      })
      .then(() => {
        this.logger.log(`Webhook fired successfully: ${payload.event}`);
      })
      .catch((error: Error) => {
        this.logger.error(
          `Webhook failed for event ${payload.event}: ${error.message}`,
        );
      });
  }

  fireNewOrder(data: {
    orderId: string;
    customerName: string;
    phoneNumber: string;
    governorate: string;
    paymentMethod: string;
    subtotalAmount: string;
    itemCount: number;
  }): void {
    this.fireAndForget(this.config.get('N8N_ORDER_WEBHOOK_URL'), {
      event: 'NEW_ORDER',
      timestamp: new Date().toISOString(),
      data,
    });
  }

  fireNewContactMessage(data: {
    messageId: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    subject: string;
  }): void {
    this.fireAndForget(this.config.get('N8N_CONTACT_WEBHOOK_URL'), {
      event: 'NEW_CONTACT_MESSAGE',
      timestamp: new Date().toISOString(),
      data,
    });
  }
}
