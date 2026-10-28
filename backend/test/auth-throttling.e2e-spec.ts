import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('Auth login throttling', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'default', ttl: 60_000, limit: 100 },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
              id: 'admin-1',
              email: 'admin@example.com',
              fullName: 'Test Admin',
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows ten login attempts and rejects the eleventh from the same client', async () => {
    const client = request(app.getHttpServer());
    const now = Date.now();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);

    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await client
          .post('/auth/login')
          .send({ email: 'admin@example.com', password: 'incorrect-password' })
          .expect(200);
      }

      await client
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'incorrect-password' })
        .expect(429);

      nowSpy.mockReturnValue(now + 15 * 60 * 1000 + 1);
      await client
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'incorrect-password' })
        .expect(200);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('does not throttle an unrelated route after login attempts', async () => {
    await request(app.getHttpServer()).get('/auth/not-a-route').expect(404);
  });
});
