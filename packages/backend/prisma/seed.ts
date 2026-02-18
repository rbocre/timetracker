import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@timetracker.ch' },
    update: {},
    create: {
      email: 'demo@timetracker.ch',
      password: hashedPassword,
      name: 'Demo User',
      locale: 'de',
    },
  });

  const client = await prisma.client.upsert({
    where: { id: 'seed-client-1' },
    update: {},
    create: {
      id: 'seed-client-1',
      name: 'Muster AG',
      company: 'Muster AG',
      email: 'info@muster.ch',
      address: 'Musterstrasse 1, 4500 Solothurn',
      userId: user.id,
    },
  });

  await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Website Redesign',
      description: 'Kompletter Redesign der Firmenwebsite',
      color: '#3B82F6',
      hourlyRate: 150,
      userId: user.id,
      clientId: client.id,
    },
  });

  await prisma.project.upsert({
    where: { id: 'seed-project-2' },
    update: {},
    create: {
      id: 'seed-project-2',
      name: 'API Integration',
      description: 'REST API fuer Mobile App',
      color: '#10B981',
      hourlyRate: 180,
      userId: user.id,
      clientId: client.id,
    },
  });

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
