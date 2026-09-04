import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { WebhookModule } from './webhook/webhook.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    // Configuration — global, validates env vars on startup
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config: Record<string, unknown>) => {
        const required = [
          'DATABASE_URL',
          'JWT_SECRET',
          'CLOUDINARY_CLOUD_NAME',
          'CLOUDINARY_API_KEY',
          'CLOUDINARY_API_SECRET',
          'FRONTEND_URL',
        ];
        for (const key of required) {
          if (!config[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
          }
        }
        return config;
      },
    }),

    // Rate limiting — applied per-route via decorators or globally
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,  // 1 minute window
        limit: 100,  // 100 requests per minute (general)
      },
    ]),

    // Global infrastructure modules
    PrismaModule,
    CloudinaryModule,
    WebhookModule,

    // Feature modules
    AuthModule,
    CategoriesModule,
  ],
})
export class AppModule {}
