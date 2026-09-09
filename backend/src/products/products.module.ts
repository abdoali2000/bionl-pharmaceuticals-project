import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  // No exports needed — ProductsService is only consumed inside this module for now.
  // EP-05 (Orders) uses the public /products endpoint, not the service directly.
})
export class ProductsModule {}
