import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService wraps PrismaClient via composition.
 * Prisma 7 uses the driver adapter pattern — PrismaClient requires a database
 * adapter (PrismaPg) instead of the legacy binary query engine.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: PrismaClient;

  // ── Model delegates (mirrors PrismaClient's public API) ───────────────────
  readonly admin: PrismaClient['admin'];
  readonly product: PrismaClient['product'];
  readonly productImage: PrismaClient['productImage'];
  readonly category: PrismaClient['category'];
  readonly productCategory: PrismaClient['productCategory'];
  readonly order: PrismaClient['order'];
  readonly orderItem: PrismaClient['orderItem'];
  readonly paymentProof: PrismaClient['paymentProof'];
  readonly offer: PrismaClient['offer'];
  readonly contactMessage: PrismaClient['contactMessage'];

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const adapter = new PrismaPg({ connectionString });
    this.client = new PrismaClient({ adapter } as never);

    // Bind delegates so services use `this.prisma.product.findMany()` etc.
    this.admin = this.client.admin;
    this.product = this.client.product;
    this.productImage = this.client.productImage;
    this.category = this.client.category;
    this.productCategory = this.client.productCategory;
    this.order = this.client.order;
    this.orderItem = this.client.orderItem;
    this.paymentProof = this.client.paymentProof;
    this.offer = this.client.offer;
    this.contactMessage = this.client.contactMessage;
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.client.$connect();
    this.logger.log('Database connected ✓');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  /** Expose $transaction for multi-step atomic operations */
  get $transaction(): PrismaClient['$transaction'] {
    return this.client.$transaction.bind(this.client);
  }
}
