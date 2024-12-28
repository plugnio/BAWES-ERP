import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private prisma: PrismaService;
  private debugMode: boolean;

  private constructor() {
    // Create ConfigService with environment variables
    const configService = new ConfigService();
    this.prisma = new PrismaService(configService);
    this.debugMode = process.env.DEBUG === 'true';
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

  private log(...args: any[]) {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  public async cleanDatabase() {
    this.log('Starting database cleanup...');

    // Delete in correct order to handle foreign key constraints
    const results = await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany(),
      this.prisma.email.deleteMany(),
      this.prisma.personRole.deleteMany(),
      this.prisma.rolePermission.deleteMany(),
      this.prisma.permission.deleteMany(),
      this.prisma.role.deleteMany(),
      this.prisma.person.deleteMany(),
    ]);

    this.log('Cleanup results:', {
      refreshTokens: results[0].count,
      emails: results[1].count,
      personRoles: results[2].count,
      rolePermissions: results[3].count,
      permissions: results[4].count,
      roles: results[5].count,
      persons: results[6].count,
    });

    this.log('Database cleanup completed');
  }

  public async disconnect() {
    await this.prisma.$disconnect();
  }
} 