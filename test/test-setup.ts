import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { getTestPrismaService, TestConfigModule } from './test-config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { PermissionDiscoveryService } from '../src/rbac/services/permission-discovery.service';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { CacheModule } from '@nestjs/cache-manager';
import { Request } from 'express';
import { roles } from '../prisma/data/production/rbac';

interface TestRole {
  name: string;
  description: string;
  isSystem: boolean;
  sortOrder: number;
  permissions: string[] | '*';
}

export class TestSetup {
  app: INestApplication;
  prisma: PrismaService;
  private permissionDiscovery: PermissionDiscoveryService;
  private authService: AuthService;

  async init() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        CacheModule.register({
          isGlobal: true,
          store: 'memory',
          ttl: 300, // 5 minutes
        }),
      ],
    })
    .overrideProvider('REDIS_CLIENT')
    .useValue(null)
    .compile();

    this.app = moduleRef.createNestApplication();
    this.app.useGlobalPipes(new ValidationPipe());
    await this.app.init();

    // Get prisma service
    this.prisma = moduleRef.get<PrismaService>(PrismaService);

    // Get permission discovery service
    this.permissionDiscovery = moduleRef.get<PermissionDiscoveryService>(PermissionDiscoveryService);

    // Get auth service
    this.authService = moduleRef.get<AuthService>(AuthService);

    // Clean up database
    await this.cleanDatabase();

    return this;
  }

  async cleanDatabase() {
    // Clean database
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany(),
      this.prisma.email.deleteMany(),
      this.prisma.personRole.deleteMany(),
      this.prisma.rolePermission.deleteMany(),
      this.prisma.role.deleteMany(),
      this.prisma.permission.deleteMany(),
      this.prisma.person.deleteMany(),
    ]);
  }

  async setupPermissions() {
    // Clean up database first
    await this.cleanDatabase();

    // Sync permissions first
    await this.permissionDiscovery.syncPermissions();

    // Wait for permissions to be synced
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create test users and roles in a transaction
    const { adminUser, testUser, superAdminRole, testRole } = await this.prisma.$transaction(async (tx) => {
      // Create test admin user first
      const adminUser = await tx.person.create({
        data: {
          nameEn: 'Admin User',
          nameAr: 'مدير النظام',
          passwordHash: await bcrypt.hash('password123', 10),
          accountStatus: 'active',
          emails: {
            create: {
              email: `admin-${Date.now()}@test.com`,
              isPrimary: true,
              isVerified: true,
            },
          },
        },
        include: {
          emails: true,
        },
      });

      // Create test user with limited permissions
      const testUser = await tx.person.create({
        data: {
          nameEn: 'Test User',
          nameAr: 'مستخدم تجريبي',
          passwordHash: await bcrypt.hash('password123', 10),
          accountStatus: 'active',
          emails: {
            create: {
              email: `test-${Date.now()}@test.com`,
              isPrimary: true,
              isVerified: true,
            },
          },
        },
        include: {
          emails: true,
        },
      });

      // Create SUPER_ADMIN role
      const superAdminRole = await tx.role.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {
          description: 'Super Administrator with all permissions',
          isSystem: true,
          sortOrder: 0,
        },
        create: {
          name: 'SUPER_ADMIN',
          description: 'Super Administrator with all permissions',
          isSystem: true,
          sortOrder: 0,
        },
      });

      // Create test role with limited permissions
      const testRole = await tx.role.upsert({
        where: { name: 'TEST_ROLE' },
        update: {
          description: 'Test role with limited permissions',
          isSystem: false,
          sortOrder: 1,
        },
        create: {
          name: 'TEST_ROLE',
          description: 'Test role with limited permissions',
          isSystem: false,
          sortOrder: 1,
        },
      });

      return { adminUser, testUser, superAdminRole, testRole };
    });

    // Get all permissions
    const allPermissions = await this.prisma.permission.findMany();

    // Create role permissions one by one to avoid race conditions
    for (const permission of allPermissions) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Assign specific permissions to test role
    const testPermissions = await this.prisma.permission.findMany({
      where: {
        code: {
          in: ['people.read', 'people.list'],
        },
      },
    });

    // Create role permissions one by one to avoid race conditions
    for (const permission of testPermissions) {
      await this.prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: testRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: testRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Assign roles to users in a transaction
    await this.prisma.$transaction([
      this.prisma.personRole.create({
        data: {
          personId: adminUser.id,
          roleId: superAdminRole.id,
        },
      }),
      this.prisma.personRole.create({
        data: {
          personId: testUser.id,
          roleId: testRole.id,
        },
      }),
    ]);

    // Generate tokens for both users
    const mockReq = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      cookies: {},
      res: {
        cookie: jest.fn(),
      },
    } as unknown as Request;

    const adminAuth = await (this.authService as any).generateTokens(adminUser.id, mockReq);
    const testAuth = await (this.authService as any).generateTokens(testUser.id, mockReq);

    return {
      superAdminRole,
      testRole,
      permissions: allPermissions,
      adminUser,
      testUser,
      adminToken: adminAuth.accessToken,
      testToken: testAuth.accessToken,
    };
  }

  async cleanDb() {
    await this.cleanDatabase();
  }

  async close() {
    // Clear all timers
    jest.useRealTimers();
    
    // Close database connection
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
    
    // Close NestJS app
    if (this.app) {
      await this.app.close();
    }
    
    // Reset any mocks and clear timers
    jest.resetModules();
    jest.clearAllMocks();
    jest.clearAllTimers();
  }
}

export async function setupPermissions(prisma: PrismaService, discoveryService: PermissionDiscoveryService) {
  // Clean up existing data
  await prisma.refreshToken.deleteMany();
  await prisma.email.deleteMany();
  await prisma.personRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.person.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  // Wait for cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  // Rediscover permissions
  await discoveryService.onModuleInit();

  // Wait for permissions to be synced
  await new Promise(resolve => setTimeout(resolve, 100));

  // Import and recreate system roles
  const testRoles = roles as TestRole[];
  for (const role of testRoles) {
    // Create role
    console.log('Creating role:', role.name);
    const createdRole = await prisma.role.create({
      data: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        sortOrder: role.sortOrder,
      },
    });
    console.log('Created role:', createdRole);

    // Wait for role to be created
    await new Promise(resolve => setTimeout(resolve, 100));

    // For SUPER_ADMIN, assign all permissions
    if (role.name === 'SUPER_ADMIN') {
      console.log('Assigning all permissions to SUPER_ADMIN');
      const allPermissions = await prisma.permission.findMany();
      
      // Create role permissions one by one to avoid race conditions
      for (const permission of allPermissions) {
        try {
          await prisma.rolePermission.create({
            data: {
              roleId: createdRole.id,
              permissionId: permission.id,
            },
          });
        } catch (error) {
          // If the role permission already exists, skip it
          if (error.code === 'P2002') {
            console.log(`Role permission already exists for ${role.name} and ${permission.code}`);
            continue;
          }
          throw error;
        }
      }
    }
    // For other roles, assign specific permissions
    else if (role.permissions !== '*' && Array.isArray(role.permissions)) {
      console.log('Assigning specific permissions to', role.name);
      const rolePermissions = await prisma.permission.findMany({
        where: {
          code: {
            in: role.permissions,
          },
        },
      });

      // Create role permissions one by one to avoid race conditions
      for (const permission of rolePermissions) {
        try {
          await prisma.rolePermission.create({
            data: {
              roleId: createdRole.id,
              permissionId: permission.id,
            },
          });
        } catch (error) {
          // If the role permission already exists, skip it
          if (error.code === 'P2002') {
            console.log(`Role permission already exists for ${role.name} and ${permission.code}`);
            continue;
          }
          throw error;
        }
      }
    }

    // Wait for permissions to be assigned
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return prisma.permission.findMany();
} 