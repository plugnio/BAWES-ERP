import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private prisma: PrismaService;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaService(new ConfigService());
  }

  public static getInstance(): DatabaseHelper {
    DatabaseHelper.instance = new DatabaseHelper();
    return DatabaseHelper.instance;
  }

  public async getPrismaService(): Promise<PrismaService> {
    if (!this.isConnected) {
      await this.prisma.$connect();
      this.isConnected = true;
    }
    return this.prisma;
  }

  public async cleanDatabase(): Promise<void> {
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

    try {
      log('Starting database cleanup...');

      // Delete in correct order to handle foreign key constraints
      await this.prisma.$transaction(async (tx) => {
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
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.prisma.$disconnect();
      this.isConnected = false;
    }
  }

  public static async cleanup(): Promise<void> {
    if (DatabaseHelper.instance) {
      await DatabaseHelper.instance.disconnect();
      DatabaseHelper.instance = null;
    }
  }
} 