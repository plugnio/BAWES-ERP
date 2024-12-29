import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private prisma: PrismaService;
  private debugMode: boolean;

  private constructor() {
    this.prisma = new PrismaService(new ConfigService());
    const configService = new ConfigService();
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
      log('Starting database cleanup...');

      // Delete in correct order to handle foreign key constraints
      await this.prisma.$transaction(async (tx) => {
        // First delete all dependent tables
        await tx.refreshToken.deleteMany();
        await tx.rolePermission.deleteMany();
        await tx.personRole.deleteMany();
        await tx.email.deleteMany();

        // Then delete parent tables
        await tx.permission.deleteMany();
        await tx.role.deleteMany();
        await tx.person.deleteMany();

        log('Database cleanup completed');
      });
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