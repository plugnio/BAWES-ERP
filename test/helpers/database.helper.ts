import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RbacCacheService } from '../../src/rbac/services/rbac-cache.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private prisma: PrismaService;
  private debugMode: boolean;

  private constructor() {
    // Explicitly load test environment
    const envPath = path.resolve(process.cwd(), '.env.test');
    dotenv.config({ path: envPath });
    
    const configService = new ConfigService();
    // Verify we're using test database
    const dbUrl = configService.get('DATABASE_URL');
    if (!dbUrl.includes('_test')) {
      throw new Error('Test database URL must contain "_test" to ensure we are not using production database');
    }
    
    this.prisma = new PrismaService(configService);
    this.debugMode = configService.get('DEBUG')?.toLowerCase() === 'true';
  }

  public static getInstance(): DatabaseHelper {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
    }
    return DatabaseHelper.instance;
  }

  public getPrismaService(): PrismaService {
    return this.prisma;
  }

  /**
   * Clean database and optionally clear RBAC cache
   */
  public async cleanAll(rbacCache?: RbacCacheService): Promise<void> {
    const log = (...args: any[]) => {
      if (this.debugMode) {
        console.log(...args);
      }
    };

    // Clear RBAC cache first if available
    if (rbacCache) {
      log('Clearing RBAC cache...');
      const roles = await this.prisma.role.findMany();
      await Promise.all(
        roles.map(role => rbacCache.clearPermissionCache(role.id))
      );
      log('RBAC cache cleared');
    }

    await this.cleanDatabase();
  }

  public async cleanDatabase(): Promise<void> {
    const log = (...args: any[]) => {
      if (this.debugMode) {
        console.log(...args);
      }
    };

    const error = (...args: any[]) => {
      if (this.debugMode) {
        console.error(...args);
      }
    };

    try {
      // Disable foreign key checks
      await this.prisma.$executeRaw`SET session_replication_role = 'replica';`;

      // Truncate tables in sequence
      await this.prisma.$executeRaw`TRUNCATE TABLE "refresh_token" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "email" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "phone" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "account_balances" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "account" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "bank" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "country" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "person_role" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "role_permission" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "person" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "role" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "permission" CASCADE;`;

      // Re-enable foreign key checks
      await this.prisma.$executeRaw`SET session_replication_role = 'origin';`;

    } catch (err) {
      if (err.code === 'P2021') {
        // Table does not exist - this is fine during initial setup
        log('Some tables do not exist yet. This is expected during initial setup.');
      } else {
        error('Error during cleanup:', err);
        throw err;
      }
    }
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  public static async cleanup(): Promise<void> {
    if (DatabaseHelper.instance) {
      await DatabaseHelper.instance.disconnect();
      DatabaseHelper.instance = null;
    }
  }
} 