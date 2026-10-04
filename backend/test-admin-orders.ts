/**
 * Integration test for EP-05-02 admin order endpoints.
 *
 * Strategy: pull a real admin ID from the database, sign a short-lived JWT
 * using the same JWT_SECRET the NestJS app uses, then attach it as the
 * access_token cookie on every admin request.
 *
 * Run with:
 *   npx ts-node --project tsconfig.seed.json --files test-admin-orders.ts
 *
 * Requires the NestJS dev server to be running on http://localhost:3000.
 */

import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as jwt from 'jsonwebtoken';
import axios, { AxiosResponse } from 'axios';

const BASE = 'http://localhost:3000/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function printStep(n: number, label: string): void {
  console.log(`\n${'─'.repeat(62)}`);
  console.log(`[Step ${n}] ${label}`);
  console.log('─'.repeat(62));
}

function summarise(res: AxiosResponse): void {
  console.log(`  HTTP Status : ${res.status}`);
  const body = res.data as Record<string, unknown>;
  const data = body.data;
  const meta = body.meta as Record<string, unknown> | null;

  if (Array.isArray(data)) {
    console.log(`  data.length : ${data.length}`);
  } else if (data && typeof data === 'object') {
    console.log(`  data.id     : ${(data as Record<string, unknown>)['id'] ?? '(none)'}`);
  }
  if (meta) {
    console.log(`  meta        : ${JSON.stringify(meta)}`);
  }
}

function pass(msg: string): void { console.log(`  ✅ PASS — ${msg}`); }
function fail(msg: string): void { console.log(`  ❌ FAIL — ${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // ── Prisma client (Prisma 7 adapter pattern) ──────────────────────────────
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
  const prisma  = new PrismaClient({ adapter } as never);

  try {
    // ── Step 1: Fetch a real admin ID and mint a JWT ───────────────────────────
    printStep(1, 'Fetch admin from DB + mint JWT using JWT_SECRET');

    const admin = await prisma.admin.findFirst({
      select: { id: true, email: true },
    });

    if (!admin) {
      fail('No admin found in the database. Run: npm run db:seed');
      process.exit(1);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      fail('JWT_SECRET is not set in .env');
      process.exit(1);
    }

    // Payload matches what JwtStrategy validates: { sub, email }
    const token = jwt.sign(
      { sub: admin.id, email: admin.email },
      jwtSecret,
      { expiresIn: '5m' },
    );

    // The NestJS JwtStrategy reads the cookie named 'access_token'
    const cookie = `access_token=${token}`;
    pass(`JWT minted for admin: ${admin.email} (id: ${admin.id})`);

    // ── Step 2: GET /admin/orders — list all orders ────────────────────────────
    printStep(2, 'GET /api/admin/orders (no filters)');

    const listRes = await axios.get(`${BASE}/admin/orders`, {
      headers: { Cookie: cookie },
      validateStatus: () => true,
    });

    summarise(listRes);

    if (listRes.status !== 200) {
      fail(`Expected 200, got ${listRes.status}`);
      console.log(JSON.stringify(listRes.data, null, 2));
      process.exit(1);
    }

    const body      = listRes.data as Record<string, unknown>;
    const orders    = body.data as Record<string, unknown>[];
    const totalMeta = (body.meta as Record<string, unknown>)?.['total'];
    pass(`Orders list returned. meta.total = ${totalMeta}`);

    // ── Step 3: Extract first order ID ────────────────────────────────────────
    printStep(3, 'Extract first order ID from list');

    if (!orders || orders.length === 0) {
      fail('Order list is empty — submit an order first (run test-submit-order.ts).');
      process.exit(1);
    }

    const firstOrderId = orders[0]['id'] as string;
    pass(`First order ID: ${firstOrderId}`);

    // ── Step 4: GET /admin/orders?customerName=Test — partial filter ───────────
    printStep(4, 'GET /api/admin/orders?customerName=Test (partial, case-insensitive)');

    const filterRes = await axios.get(`${BASE}/admin/orders`, {
      params: { customerName: 'Test' },
      headers: { Cookie: cookie },
      validateStatus: () => true,
    });

    summarise(filterRes);

    if (filterRes.status === 200) {
      const filtered = (filterRes.data as Record<string, unknown>).data as unknown[];
      const filteredTotal = ((filterRes.data as Record<string, unknown>).meta as Record<string, unknown>)?.['total'];
      console.log(`  Matched records : ${filteredTotal}`);
      pass(`customerName=Test filter returned ${filtered.length} order(s).`);
    } else {
      fail(`Expected 200, got ${filterRes.status}`);
      console.log(JSON.stringify(filterRes.data, null, 2));
    }

    // ── Step 5: GET /admin/orders/:id — single order detail ───────────────────
    printStep(5, `GET /api/admin/orders/${firstOrderId}`);

    const detailRes = await axios.get(`${BASE}/admin/orders/${firstOrderId}`, {
      headers: { Cookie: cookie },
      validateStatus: () => true,
    });

    summarise(detailRes);

    if (detailRes.status === 200) {
      const order         = (detailRes.data as Record<string, unknown>).data as Record<string, unknown>;
      const items         = order['items'] as unknown[];
      const paymentProofs = order['paymentProofs'] as unknown[];

      console.log(`  items count         : ${items?.length ?? 'MISSING'}`);
      console.log(`  paymentProofs count : ${paymentProofs?.length ?? 'MISSING'}`);

      if (Array.isArray(items) && Array.isArray(paymentProofs)) {
        pass('Both items[] and paymentProofs[] present in detail response.');
      } else {
        fail('items or paymentProofs missing from order detail response.');
      }
    } else {
      fail(`Expected 200, got ${detailRes.status}`);
      console.log(JSON.stringify(detailRes.data, null, 2));
    }

    // ── Step 6: Verify 401 for unauthenticated request ────────────────────────
    printStep(6, 'Verify 401 for unauthenticated request (no cookie)');

    const unauthRes = await axios.get(`${BASE}/admin/orders`, {
      validateStatus: () => true,
    });

    console.log(`  HTTP Status : ${unauthRes.status}`);
    if (unauthRes.status === 401) {
      pass('Unauthenticated request correctly rejected with 401.');
    } else {
      fail(`Expected 401, got ${unauthRes.status}.`);
    }

  } finally {
    await (prisma as any).$disconnect();
  }

  console.log(`\n${'═'.repeat(62)}`);
  console.log('EP-05-02 acceptance criteria test complete.');
  console.log('═'.repeat(62));
}

main().catch((err: unknown) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
