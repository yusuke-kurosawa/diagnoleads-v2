#!/usr/bin/env tsx
import { db } from '@/lib/db/client';
import { accounts, organizationMembers, organizations, users } from '@/lib/db/schema';
/**
 * Seed the database with initial data
 * Usage: npm run db:seed
 */
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';

async function createUser(
  email: string,
  password: string,
  name: string,
  orgName: string,
  orgSlug: string
) {
  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    console.log(`⚠️ User ${email} already exists, updating password...`);

    // Update or create account with password
    const existingAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, existingUser.id),
    });

    const hashedPassword = await hashPassword(password);

    if (existingAccount) {
      await db
        .update(accounts)
        .set({ password: hashedPassword })
        .where(eq(accounts.id, existingAccount.id));
    } else {
      await db.insert(accounts).values({
        userId: existingUser.id,
        accountId: existingUser.id,
        providerId: 'credential',
        password: hashedPassword,
      });
    }

    console.log(`✅ Updated ${email} password`);
    return;
  }

  // Check if organization already exists
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!org) {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: orgName,
        slug: orgSlug,
        settings: {},
      })
      .returning();
    org = newOrg;
    console.log(`✅ Created organization: ${orgName}`);
  }

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email,
      name,
      emailVerified: true,
    })
    .returning();

  console.log(`✅ Created user: ${email}`);

  // Create credential account with password
  const hashedPassword = await hashPassword(password);
  await db.insert(accounts).values({
    userId: user.id,
    accountId: user.id,
    providerId: 'credential',
    password: hashedPassword,
  });

  console.log(`✅ Created credential account for ${email}`);

  // Create membership
  await db.insert(organizationMembers).values({
    organizationId: org.id,
    userId: user.id,
    role: 'owner',
  });

  console.log(`✅ Created organization membership for ${email}`);
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Test users to create
  const testUsers = [
    {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      orgName: 'Test Organization',
      orgSlug: 'test-org',
    },
    {
      email: 'demo@diagnoleads.com',
      password: 'demo1234',
      name: 'Demo User',
      orgName: 'Demo Organization',
      orgSlug: 'demo-org',
    },
  ];

  try {
    for (const user of testUsers) {
      await createUser(user.email, user.password, user.name, user.orgName, user.orgSlug);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nAvailable test credentials:');
    for (const user of testUsers) {
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
