import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const nameEn = process.env.ADMIN_NAME || 'System Administrator';

  try {
    // Create super admin role
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with all permissions',
        isSystem: true,
        sortOrder: 0,
      },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 12);

    const adminPerson = await prisma.person.upsert({
      where: {
        id: 'admin', // Fixed ID for the system admin
      },
      update: {
        nameEn,
        passwordHash: hashedPassword,
        accountStatus: 'active',
      },
      create: {
        id: 'admin',
        nameEn,
        passwordHash: hashedPassword,
        accountStatus: 'active',
      },
    });

    // Create admin email
    await prisma.email.upsert({
      where: { email },
      update: {
        isPrimary: true,
        isVerified: true,
        personId: adminPerson.id,
      },
      create: {
        email,
        isPrimary: true,
        isVerified: true,
        personId: adminPerson.id,
      },
    });

    // Assign super admin role
    await prisma.personRole.upsert({
      where: {
        personId_roleId: {
          personId: adminPerson.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        personId: adminPerson.id,
        roleId: superAdminRole.id,
      },
    });

    console.log('Successfully created admin user with super admin permissions');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Please change the password after first login');
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
