#!/usr/bin/env tsx
/**
 * Seed the database with initial data
 * Usage: npm run db:seed
 */
import { db } from '@/lib/db/client';
import { organizations, users, organizationMembers } from '@/lib/db/schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo organization
    const [org] = await db
      .insert(organizations)
      .values({
        name: 'Demo Organization',
        slug: 'demo-org',
        settings: {},
      })
      .returning();

    console.log('✅ Created demo organization:', org.name);

    // Create demo user
    const [user] = await db
      .insert(users)
      .values({
        email: 'demo@diagnoleads.com',
        name: 'Demo User',
        emailVerified: true,
      })
      .returning();

    console.log('✅ Created demo user:', user.email);

    // Create membership
    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: user.id,
      role: 'owner',
    });

    console.log('✅ Created organization membership');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nDemo credentials:');
    console.log('  Email: demo@diagnoleads.com');
    console.log('  (Set password via BetterAuth)');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
