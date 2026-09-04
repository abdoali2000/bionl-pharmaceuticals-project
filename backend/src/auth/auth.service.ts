import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
    res: Response,
  ): Promise<{ id: string; email: string; fullName: string }> {
    // Always return 401 (not 404) to prevent user enumeration
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ sub: admin.id, email: admin.email });

    const isProduction = this.config.get('NODE_ENV') === 'production';

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: COOKIE_MAX_AGE_MS,
    });

    this.logger.log(`Admin logged in: ${admin.email}`);

    return { id: admin.id, email: admin.email, fullName: admin.fullName };
  }

  logout(res: Response): void {
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }
}
