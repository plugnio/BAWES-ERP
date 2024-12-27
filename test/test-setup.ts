import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { getTestPrismaService, TestConfigModule } from './test-config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { PermissionDiscoveryService } from '../src/rbac/services/permission-discovery.service';

export class TestSetup {
  app: INestApplication;
  prisma: PrismaService;
  private permissionDiscovery: PermissionDiscoveryService;

  async init() {
    const moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, AppModule],
    }).compile();

    this.app = moduleRef.createNestApplication();
    
    // Global middleware and pipes
    this.app.use(cookieParser());
    this.app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    await this.app.init();
    
    // Get test prisma instance
    this.prisma = await getTestPrismaService();
    
    // Get permission discovery service
    this.permissionDiscovery = moduleRef.get<PermissionDiscoveryService>(PermissionDiscoveryService);
    
    return this;
  }

  async close() {
    // Close database connection
    await this.prisma.$disconnect();
    
    // Close Redis connections if used
    const redisService = this.app.get('REDIS_CLIENT', { strict: false });
    if (redisService) {
      await redisService.quit();
    }
    
    // Close NestJS app
    if (this.app) {
      await this.app.close();
    }
    
    // Reset any mocks
    jest.resetModules();
    jest.clearAllMocks();
  }

  async cleanDb() {
    // Ensure connection is active
    if (!this.prisma) {
      this.prisma = await getTestPrismaService();
    }
    
    // Clean database tables
    const models = Reflect.ownKeys(this.prisma).filter(
      key => typeof this.prisma[key] === 'object' && this.prisma[key].deleteMany
    );
    
    await this.prisma.$transaction(
      models.map(model => this.prisma[model].deleteMany())
    );
  }

  async setupPermissions() {
    // Access private method for testing
    await (this.permissionDiscovery as any).syncPermissions();
  }
} 