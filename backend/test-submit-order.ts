/**
 * Manual integration test for POST /api/orders (EP-05-01).
 *
 * Run with:
 *   npx ts-node --project tsconfig.seed.json --files test-submit-order.ts
 *
 * Requires the NestJS dev server to be running on http://localhost:3000.
 */

import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Minimal valid 1×1 transparent PNG (base64-encoded).
// A real PNG binary is required so Cloudinary accepts it as an image.
// ---------------------------------------------------------------------------
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const PROOF_FILE_PATH = path.join(__dirname, 'test-proof.png');
const API_URL = 'http://localhost:3000/api/orders';

async function main(): Promise<void> {
  // ── Instantiate Prisma using the PrismaPg driver adapter (Prisma 7 pattern) ─
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? '',
  });
  const prisma = new PrismaClient({ adapter } as never);

  try {
    // ── Step 1: Fetch a real product from the database ─────────────────────────
    console.log('\n[1] Fetching a product from the database...');
    const product = await prisma.product.findFirst({
      select: { id: true, nameEn: true, price: true },
    });

    if (!product) {
      console.error('[ABORT] No products found in the database. Seed some products first.');
      process.exit(1);
    }

    console.log(
      `    Found product: "${product.nameEn}" (id: ${product.id}, price: ${product.price})`,
    );

    // ── Step 2: Write a minimal valid PNG to disk ──────────────────────────────
    console.log('\n[2] Creating temporary test-proof.png...');
    const pngBuffer = Buffer.from(TINY_PNG_BASE64, 'base64');
    fs.writeFileSync(PROOF_FILE_PATH, pngBuffer);
    console.log(`    Written ${pngBuffer.length} bytes → ${PROOF_FILE_PATH}`);

    // ── Step 3: Build multipart/form-data using Node 18+ native FormData ───────
    console.log('\n[3] Building multipart/form-data payload...');

    const formData = new FormData();
    formData.append('customerName', 'Test Automation User');
    formData.append('phoneNumber', '01012345678');
    formData.append('governorate', 'Cairo');
    formData.append('cityOrCenterOrVillage', 'Nasr City');
    formData.append('address', '123 Automation St');
    formData.append('paymentMethod', 'INSTAPAY');
    formData.append(
      'items',
      JSON.stringify([{ productId: product.id, quantity: 2 }]),
    );

    // Attach the PNG as a Blob — native FormData requires Blob, not a stream
    const fileBuffer = fs.readFileSync(PROOF_FILE_PATH);
    const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('paymentProofs', fileBlob, 'test-proof.png');

    console.log(`    Payload ready. Sending POST to ${API_URL}...`);

    // ── Step 4: POST the request ───────────────────────────────────────────────
    console.log('\n[4] Sending request (may take a few seconds for Cloudinary)...\n');

    const response = await axios.post(API_URL, formData, {
      validateStatus: () => true,  // capture all status codes without throwing
      timeout: 30_000,             // 30 s — Cloudinary can be slow on free plan
    });

    // ── Step 5: Display results ────────────────────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`HTTP Status  : ${response.status}`);
    console.log('Response Body:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (response.status === 201) {
      const order = response.data?.data;
      console.log('\n✅  TEST PASSED');
      console.log(`   Order ID        : ${order?.id}`);
      console.log(`   Subtotal Amount : ${order?.subtotalAmount}`);
      console.log(`   Items           : ${order?.items?.length}`);
      console.log(`   Payment Proofs  : ${order?.paymentProofs?.length}`);
      if (order?.paymentProofs?.[0]) {
        console.log(`   Cloudinary URL  : ${order.paymentProofs[0].imageUrl}`);
      }
    } else {
      console.log('\n❌  UNEXPECTED STATUS — see response body above.');
    }

  } finally {
    // ── Cleanup ────────────────────────────────────────────────────────────────
    if (fs.existsSync(PROOF_FILE_PATH)) {
      fs.unlinkSync(PROOF_FILE_PATH);
      console.log('\n[Cleanup] test-proof.png deleted.');
    }
    await (prisma as any).$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
