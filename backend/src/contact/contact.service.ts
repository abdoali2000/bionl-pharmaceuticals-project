import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { GetContactMessagesQueryDto } from './dto/get-contact-messages-query.dto';
import { ContactMessage } from '../../generated/prisma/client';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  async create(createDto: CreateContactMessageDto): Promise<ContactMessage> {
    const message = await this.prisma.contactMessage.create({
      data: {
        ...createDto,
        isRead: false,
      },
    });

    // Fire webhook asynchronously without blocking the response
    this.webhookService.fireNewContactMessage({
      messageId: message.id,
      fullName: message.fullName,
      phoneNumber: message.phoneNumber,
      email: message.email,
      subject: message.subject,
    });

    return message;
  }



  async findAll(query: GetContactMessagesQueryDto) {
    const { isRead } = query;
    const filter = isRead !== undefined ? { isRead } : {};

    const [messages, unreadCount, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactMessage.count({
        where: { isRead: false },
      }),
      this.prisma.contactMessage.count({
        where: filter,
      }),
    ]);

    return {
      messages,
      meta: {
        total,
        unreadCount, // absolute unread count across the whole DB
      },
    };
  }

  async findOneAndMarkRead(id: string): Promise<ContactMessage | null> {
    const existing = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    
    if (!existing) {
      // Just returning null, the controller will handle NotFoundException
      return null;
    }

    if (existing.isRead) {
      return existing;
    }

    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
