import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as prompts from 'prompts';
import * as chalk from 'chalk';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log(chalk.blue('\n🔧 Admin Account Setup\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'email',
      message: 'Enter admin email:',
      validate: value => value.includes('@') ? true : 'Please enter a valid email'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter admin password:',
      validate: value => value.length >= 8 ? true : 'Password must be at least 8 characters'
    },
    {
      type: 'text',
      name: 'nameEn',
      message: 'Enter admin name:',
      validate: value => value.length > 0 ? true : 'Name is required'
    }
  ]);

  if (!response.email || !response.password || !response.nameEn) {
    console.log(chalk.red('\n❌ Setup cancelled\n'));
    process.exit(0);
  }

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash(response.password, 12);

    const adminPerson = await prisma.person.upsert({
      where: { id: 'admin' },
      update: {
        nameEn: response.nameEn,
        passwordHash: hashedPassword,
        accountStatus: 'active',
      },
      create: {
        id: 'admin',
        nameEn: response.nameEn,
        passwordHash: hashedPassword,
        accountStatus: 'active',
      },
    });

    // Create admin email
    await prisma.email.upsert({
      where: { email: response.email },
      update: {
        isPrimary: true,
        isVerified: true,
        personId: adminPerson.id,
      },
      create: {
        email: response.email,
        isPrimary: true,
        isVerified: true,
        personId: adminPerson.id,
      },
    });

    // Assign super admin role (which should already exist from seeds)
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });

    if (!superAdminRole) {
      throw new Error('SUPER_ADMIN role not found. Please run database migrations and seeds first.');
    }

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

    console.log(chalk.green('\n✅ Successfully created admin user!\n'));
    console.log('Email:', chalk.cyan(response.email));
    console.log('Password:', chalk.cyan(response.password));
    console.log(chalk.yellow('\n⚠️  Please change the password after first login\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Error creating admin:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
