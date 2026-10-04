import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PROOF_FILE_FILTER } from './utils/proof-file-filter';

// ---------------------------------------------------------------------------
// Multer configuration for payment proof uploads
// Accepts up to 10 files, 5 MB each, JPEG / PNG / PDF only.
// ---------------------------------------------------------------------------

const PAYMENT_PROOF_INTERCEPTOR = FilesInterceptor('paymentProofs', 10, {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: PROOF_FILE_FILTER,
});

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /api/orders
   *
   * Public endpoint — no authentication required.
   * Content-Type: multipart/form-data
   *
   * Form fields:
   *   - Standard text fields from CreateOrderDto
   *   - items  : JSON string representing OrderItemInputDto[]
   *   - paymentProofs : one or more image/PDF files (1–10, max 5 MB each)
   *
   * Returns 201 with the full created order on success.
   */
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(PAYMENT_PROOF_INTERCEPTOR)
  async createOrder(
    @Body() dto: CreateOrderDto,
    @UploadedFiles() proofFiles: Express.Multer.File[],
  ) {
    if (!proofFiles || proofFiles.length === 0) {
      throw new BadRequestException(
        'At least one payment proof file is required in the "paymentProofs" field.',
      );
    }

    const order = await this.ordersService.createOrder(dto, proofFiles);

    return {
      message: 'Order submitted successfully',
      data: order,
      meta: null,
    };
  }
}
