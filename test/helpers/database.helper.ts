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
    const models = Reflect.ownKeys(this.prisma).filter(
      key => typeof this.prisma[key] === 'object' && this.prisma[key].deleteMany
    );

    await this.prisma.$transaction(
      models.map(model => this.prisma[model].deleteMany())
    );
  }

  public async disconnect() {
    await this.prisma.$disconnect();
  }
} 