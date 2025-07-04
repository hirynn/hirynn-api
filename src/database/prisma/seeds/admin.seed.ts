import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL ?? 'testadmin@example.com';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'Password@123';

  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log('⚠️ Super admin already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
      permissions: ['ALL'],
      isActive: true,
    },
  });

  console.log('✅ Super admin created successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect(); 
  });
