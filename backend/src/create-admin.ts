import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    const email = 'admin@bionl.com';
    const plainPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // مسح أي أدمن قديم أو تحديثه
    await prisma.admin.deleteMany({});

    await prisma.admin.create({
        data: {
            email,
            passwordHash: hashedPassword,
            fullName: 'System Admin', // ضفنا الحقل الإجباري
        },
    });

    console.log('✅ New Admin Created Successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${plainPassword}`);

    await app.close();
}

bootstrap();