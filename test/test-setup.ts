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
    await this.prisma.$disconnect();
    await this.app.close();
  }

  async cleanDb() {
    this.prisma = await getTestPrismaService();
  }

  async setupPermissions() {
    // Access private method for testing
    await (this.permissionDiscovery as any).syncPermissions();
  }
} 