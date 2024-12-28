import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';

// Force test environment
process.env.NODE_ENV = 'test';

export const TestConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env.test',
});

const log = (...args: any[]) => {
  if (process.env.DEBUG === 'true') {
    console.log(...args);
  }
};

const error = (...args: any[]) => {
  if (process.env.DEBUG === 'true') {
    console.error(...args);
  }
};

export const getTestPrismaService = async () => {
  // Create Prisma instance with test config
  const prisma = new PrismaService(new ConfigService());
  
  // Clean database before tests
  try {
    log('Starting database cleanup...');
    
    // Delete in correct order to handle foreign key constraints
    await prisma.$transaction(async (tx) => {
      const results = await Promise.all([
        tx.refreshToken.deleteMany(),
        tx.rolePermission.deleteMany(),
        tx.personRole.deleteMany(),
        tx.permission.deleteMany(),
        tx.role.deleteMany(),
        tx.email.deleteMany(),
        tx.person.deleteMany(),
      ]);

      log('Cleanup results:', {
        refreshTokens: results[0].count,
        rolePermissions: results[1].count,
        personRoles: results[2].count,
        permissions: results[3].count,
        roles: results[4].count,
        emails: results[5].count,
        persons: results[6].count,
      });
    });
    
    log('Database cleanup completed');
  } catch (err) {
    if (err.code === 'P2021') {
      // Table does not exist - this is fine during initial setup
      log('Some tables do not exist yet. This is expected during initial setup.');
    } else {
      error('Error during cleanup:', err);
      throw err;
    }
  }

  return prisma;
};

export const TEST_JWT_SECRET = 'test-secret';
export const TEST_REDIS_URL = 'redis://localhost:6379/1'; // Use different DB for tests 