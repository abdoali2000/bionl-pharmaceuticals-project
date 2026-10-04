import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { PROOF_FILE_FILTER } from './utils/proof-file-filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  /**
   * GET /api/admin/orders
   *
   * Admin only — requires a valid JWT cookie.
   * Accepts optional query params: customerName, phoneNumber, governorate,
   * paymentMethod, dateFrom, dateTo.
   * Returns all matching orders ordered newest-first with nested items and proofs.
   */
  @Get('admin/orders')
  @UseGuards(JwtAuthGuard)
  async findAllOrders(@Query() query: GetOrdersQueryDto) {
    const result = await this.ordersService.findAllOrders(query);
    return {
      message: 'Orders retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * GET /api/admin/orders/:id
   *
   * Admin only — requires a valid JWT cookie.
   * Returns a single order by UUID with nested items and paymentProofs.
   * Responds with 404 if the ID does not exist.
   */
  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard)
  async findOneOrder(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.ordersService.findOneOrder(id);
    return {
      message: 'Order retrieved successfully',
      data: order,
      meta: null,
    };
  }
}
