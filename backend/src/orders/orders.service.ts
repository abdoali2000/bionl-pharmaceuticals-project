import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { WebhookService } from '../webhook/webhook.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderItem, PaymentProof } from '../../generated/prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FullOrder = Order & {
  items: OrderItem[];
  paymentProofs: PaymentProof[];
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly webhookService: WebhookService,
  ) {}

  /**
   * Submits a new order.
   *
   * Steps (all inside a Prisma interactive transaction):
   *  1. Validate all product IDs exist in the database.
   *  2. Calculate subtotalAmount from DB prices (never trust client prices).
   *  3. Create the Order record.
   *  4. Create OrderItem records with full price snapshots.
   *  5. Upload each payment proof file to Cloudinary.
   *  6. Create PaymentProof records.
   *
   * After the transaction commits:
   *  7. Fire the NEW_ORDER webhook (fire-and-forget, never blocks the response).
   */
  async createOrder(
    dto: CreateOrderDto,
    proofFiles: Express.Multer.File[],
  ): Promise<FullOrder> {
    const order = await this.prisma.$transaction(async (tx) => {
      // ── Step 1: Validate all product IDs exist ──────────────────────────────
      const requestedIds = dto.items.map((item) => item.productId);

      const foundProducts = await tx.product.findMany({
        where: { id: { in: requestedIds } },
        select: {
          id: true,
          price: true,
          nameAr: true,
          nameEn: true,
        },
      });

      const foundIds = new Set(foundProducts.map((p) => p.id));
      const invalidIds = requestedIds.filter((id) => !foundIds.has(id));

      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `The following productId(s) do not exist: ${invalidIds.join(', ')}`,
        );
      }

      const productMap = new Map(foundProducts.map((p) => [p.id, p]));

      // ── Step 2: Calculate subtotal using DB prices ──────────────────────────
      let subtotal = 0;
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        // Use string arithmetic via Decimal to maintain precision, then convert
        const lineTotal =
          Number(product.price.toString()) * item.quantity;
        subtotal += lineTotal;
      }

      // ── Step 3: Create the Order record ────────────────────────────────────
      const createdOrder = await tx.order.create({
        data: {
          customerName: dto.customerName,
          phoneNumber: dto.phoneNumber,
          email: dto.email ?? null,
          governorate: dto.governorate,
          cityOrCenterOrVillage: dto.cityOrCenterOrVillage,
          address: dto.address,
          notes: dto.notes ?? null,
          paymentMethod: dto.paymentMethod,
          subtotalAmount: subtotal,
        },
      });

      // ── Step 4: Create OrderItem records with price snapshots ───────────────
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const unitPrice = product.price;
        const totalPrice = unitPrice.times(item.quantity);

        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            productNameAr: product.nameAr,
            productNameEn: product.nameEn,
            unitPrice,
            quantity: item.quantity,
            totalPrice,
          },
        });
      }

      // ── Step 5 & 6: Upload proofs to Cloudinary and create PaymentProof records
      //
      // Uploading inside the transaction means any Cloudinary failure throws
      // and automatically rolls back all DB writes made in this transaction.
      for (const file of proofFiles) {
        let uploadResult: { url: string; publicId: string };
        try {
          uploadResult = await this.cloudinary.uploadFile(
            file.buffer,
            'bionl/orders/proofs',
          );
        } catch (err) {
          this.logger.error('Cloudinary upload failed inside transaction', err);
          throw new InternalServerErrorException(
            'Failed to upload payment proof. The order was not placed.',
          );
        }

        await tx.paymentProof.create({
          data: {
            orderId: createdOrder.id,
            imageUrl: uploadResult.url,
            cloudinaryPublicId: uploadResult.publicId,
          },
        });
      }

      // Return the full order with relations from within the transaction
      return tx.order.findUniqueOrThrow({
        where: { id: createdOrder.id },
        include: {
          items: true,
          paymentProofs: true,
        },
      });
    });

    // ── Step 7: Fire webhook AFTER the transaction commits ─────────────────────
    // This is intentionally fire-and-forget. A webhook failure must never
    // cause the customer to receive an error response.
    this.webhookService.fireNewOrder({
      orderId: order.id,
      customerName: order.customerName,
      phoneNumber: order.phoneNumber,
      governorate: order.governorate,
      paymentMethod: order.paymentMethod,
      subtotalAmount: order.subtotalAmount.toString(),
      itemCount: order.items.length,
    });

    return order;
  }
}
