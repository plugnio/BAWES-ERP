import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const nameEn = process.env.ADMIN_NAME || 'System Administrator';

  try {
    // Create system permissions with bitfield powers of 2
    const permissions = [
      { code: 'system.manage', name: 'Manage Permissions' },
      { code: 'roles.manage', name: 'Manage Roles' },
      { code: 'users.manage', name: 'Manage Users' },
      { code: 'audit.read', name: 'View Audit Logs' },
    ];

    let nextBitfield = new Decimal(1); // Start with 2^0
    const createdPermissions = await Promise.all(
      permissions.map(async (perm) => {
        const result = await prisma.permission.upsert({
          where: { code: perm.code },
          update: {},
          create: {
            code: perm.code,
            name: perm.name,
            description: `System permission: ${perm.name}`,
            category: 'System',
            sortOrder: 0,
            isDeprecated: false,
            bitfield: nextBitfield,
          },
        });
        nextBitfield = nextBitfield.mul(2); // Next power of 2
        return result;
      }),
    );

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

    // Assign all permissions to super admin role
    await Promise.all(
      createdPermissions.map((perm) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: superAdminRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        }),
      ),
    );

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
