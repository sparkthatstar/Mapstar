/**
 * Seed script — populates the database with:
 *  1. Regulated FeeConfig (single anchor row)
 *  2. Administrator User row from ADMIN_EMAIL / ADMIN_PASSWORD environment variables
 *
 * Idempotent on re-runs.
 * Run: bun run scripts/seed.ts
 */
import { db } from '../src/lib/db'
import { DEFAULT_FEES } from '../src/lib/fees'
import { hashPassword } from '../src/lib/user-auth'

async function main() {
  console.log('Seeding FeeConfig...')
  await db.feeConfig.upsert({
    where: { id: 'fee_config_default' },
    create: {
      id: 'fee_config_default',
      ...DEFAULT_FEES,
    },
    update: {},
  })
  console.log('FeeConfig ready.')

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || 'Administrator'

  if (adminEmail && adminPassword) {
    console.log(`Upserting Admin User: ${adminEmail}...`)
    const passwordHash = hashPassword(adminPassword)

    await db.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        fullName: adminName,
        phone: '08000000000',
        role: 'ADMIN',
        ninVerified: true,
        bvnVerified: true,
        passwordHash,
      },
      update: {
        role: 'ADMIN',
        ninVerified: true,
        bvnVerified: true,
        passwordHash,
      },
    })
    console.log(`Admin user (${adminEmail}) seeded successfully with scrypt hash.`)
  } else {
    console.warn(
      'ADMIN_EMAIL and/or ADMIN_PASSWORD environment variables not provided. Admin user not created.'
    )
  }

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seed script error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
