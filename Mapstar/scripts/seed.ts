/**
 * Seed script — populates the dev DB with FeeConfig (single row)
 * so the admin panel can read/write against a real database.
 *
 * Run: bun run scripts/seed.ts
 */
import { db } from '../src/lib/db'
import { DEFAULT_FEES } from '../src/lib/fees'

async function main() {
  console.log('Seeding FeeConfig...')

  const existing = await db.feeConfig.findFirst()
  if (existing) {
    console.log('FeeConfig already exists, skipping.')
  } else {
    await db.feeConfig.create({
      data: {
        id: 'fee_config_default',
        ...DEFAULT_FEES,
      } as any,
    })
    console.log('FeeConfig seeded.')
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
