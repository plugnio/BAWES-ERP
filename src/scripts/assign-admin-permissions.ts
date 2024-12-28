import { PrismaClient } from '@prisma/client';
import * as chalk from 'chalk';

const prisma = new PrismaClient();

async function assignAdminPermissions() {
  console.log(chalk.blue('\n🔧 Assigning Permissions to SUPER_ADMIN\n'));

  try {
    // Find SUPER_ADMIN role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      throw new Error(
        'SUPER_ADMIN role not found. Please run database migrations and seeds first.',
      );
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();

    if (allPermissions.length === 0) {
      throw new Error(
        'No permissions found. Please run permission discovery first.',
      );
    }

    console.log(chalk.gray(`Found ${allPermissions.length} permissions`));

    // Assign all permissions to SUPER_ADMIN
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id },
    });

    await prisma.rolePermission.createMany({
      data: allPermissions.map(permission => ({
        roleId: superAdminRole.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    console.log(
      chalk.green(
        `\n✅ Successfully assigned ${allPermissions.length} permissions to SUPER_ADMIN!\n`,
      ),
    );
  } catch (error) {
    console.error(chalk.red('\n❌ Error assigning permissions:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

assignAdminPermissions(); 