import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export class DatabaseHelper {
  private static instance: DatabaseHelper;
  private prisma: PrismaService;

  private constructor() {
    // Create ConfigService with test configuration
    const configService = new ConfigService({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/bawes_erp_test?schema=public',
    });

    this.prisma = new PrismaService(configService);
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

  public async cleanDatabase() {
    console.log('Starting database cleanup...');

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

    console.log('Cleanup results:', {
      refreshTokens: results[0].count,
      emails: results[1].count,
      personRoles: results[2].count,
      rolePermissions: results[3].count,
      permissions: results[4].count,
      roles: results[5].count,
      persons: results[6].count,
    });

    console.log('Database cleanup completed');
  }

  public async disconnect() {
    await this.prisma.$disconnect();
  }
} 