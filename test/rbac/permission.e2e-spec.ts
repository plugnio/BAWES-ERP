import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PermissionDiscoveryService } from '../../src/rbac/services/permission-discovery.service';
import { AuthService } from '../../src/auth/auth.service';
import { RoleService } from '../../src/rbac/services/role.service';
import { PersonRoleService } from '../../src/rbac/services/person-role.service';
import { JwtService } from '@nestjs/jwt';
import { RbacCacheService } from '../../src/rbac/services/rbac-cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { ConfigModule } from '@nestjs/config';
import { TestController } from './test.controller';

describe('Permission (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let discoveryService: PermissionDiscoveryService;
  let authService: AuthService;
  let roleService: RoleService;
  let personRoleService: PersonRoleService;
  let jwtService: JwtService;
  let rbacCacheService: RbacCacheService;

  let adminUser: any;
  let limitedUser: any;
  let testRole: any;
  let adminToken: string;
  let limitedUserToken: string;
  let permissions: any[];

  beforeAll(async () => {
    // Set debug mode for permission discovery
    process.env.DEBUG = 'true';

    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule,
        CacheModule.register({
          isGlobal: true,
          store: 'memory',
          ttl: 300, // 5 minutes
        }),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ DEBUG: true })],
        }),
      ],
      controllers: [TestController],
    })
    .overrideProvider('REDIS_CLIENT')
    .useValue(null)
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
    discoveryService = moduleRef.get(PermissionDiscoveryService);
    authService = moduleRef.get(AuthService);
    roleService = moduleRef.get(RoleService);
    personRoleService = moduleRef.get(PersonRoleService);
    jwtService = moduleRef.get(JwtService);
    rbacCacheService = moduleRef.get(RbacCacheService);

    // Wait for permission discovery to complete
    await discoveryService.onModuleInit();
    permissions = await prisma.permission.findMany();

    // Clean database
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.personRole.deleteMany(),
      prisma.rolePermission.deleteMany(),
      prisma.role.deleteMany(),
      prisma.permission.deleteMany(),
      prisma.email.deleteMany(),
      prisma.person.deleteMany(),
    ]);
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.personRole.deleteMany(),
      prisma.rolePermission.deleteMany(),
      prisma.role.deleteMany(),
      prisma.permission.deleteMany(),
      prisma.email.deleteMany(),
      prisma.person.deleteMany(),
    ]);

    // Rediscover permissions for each test
    await discoveryService.onModuleInit();
    permissions = await prisma.permission.findMany();

    // Create users and roles in a transaction
    const { adminUser: newAdminUser, limitedUser: newLimitedUser, superAdminRole, testRole: newTestRole } = await prisma.$transaction(async (tx) => {
      // Create admin user first
      const newAdminUser = await tx.person.create({
        data: {
          nameEn: 'Admin User',
          nameAr: 'مدير النظام',
          passwordHash: await bcrypt.hash('password', 10),
          accountStatus: 'active',
          emails: {
            create: {
              email: `admin-${Date.now()}-${Math.random().toString(36).substring(2)}@test.com`,
              isPrimary: true,
              isVerified: true,
            },
          },
        },
        include: {
          emails: true,
        },
      });

      // Create limited user
      const newLimitedUser = await tx.person.create({
        data: {
          nameEn: 'Limited User',
          nameAr: 'مستخدم محدود',
          passwordHash: await bcrypt.hash('password', 10),
          accountStatus: 'active',
          emails: {
            create: {
              email: `limited-${Date.now()}-${Math.random().toString(36).substring(2)}@test.com`,
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

      // Create test role
      const newTestRole = await tx.role.upsert({
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

      return { adminUser: newAdminUser, limitedUser: newLimitedUser, superAdminRole, testRole: newTestRole };
    });

    // Update references
    adminUser = newAdminUser;
    limitedUser = newLimitedUser;
    testRole = newTestRole;

    // Assign permissions in a transaction
    await prisma.$transaction(async (tx) => {
      // Assign all permissions to SUPER_ADMIN
      const allPermissions = await tx.permission.findMany();
      await tx.rolePermission.createMany({
        data: allPermissions.map(permission => ({
          roleId: superAdminRole.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });

      // Assign specific permissions to test role
      const testPermissions = await tx.permission.findMany({
        where: {
          code: {
            in: ['test.read', 'test.write'],
          },
        },
      });

      await tx.rolePermission.createMany({
        data: testPermissions.map(permission => ({
          roleId: testRole.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });

      // Assign roles to users
      await tx.personRole.createMany({
        data: [
          {
            personId: adminUser.id,
            roleId: superAdminRole.id,
          },
          {
            personId: limitedUser.id,
            roleId: testRole.id,
          },
        ],
      });
    });

    // Generate tokens
    const mockReq = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      cookies: {},
      res: {
        cookie: jest.fn(),
      },
    } as unknown as Request;

    // Generate tokens in a transaction
    await prisma.$transaction(async (tx) => {
      // Clean up any existing refresh tokens
      await tx.refreshToken.deleteMany({
        where: {
          personId: {
            in: [adminUser.id, limitedUser.id],
          },
        },
      });

      // Get users with roles for token generation
      const [adminWithRoles, limitedWithRoles] = await Promise.all([
        tx.person.findUnique({
          where: { id: adminUser.id },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            emails: {
              where: { isPrimary: true },
            },
          },
        }),
        tx.person.findUnique({
          where: { id: limitedUser.id },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            emails: {
              where: { isPrimary: true },
            },
          },
        }),
      ]);

      if (!adminWithRoles || !limitedWithRoles) {
        throw new Error('Users not found with roles');
      }

      // Generate tokens for admin
      const adminAuth = await authService.validateLogin(
        adminWithRoles.emails[0].email,
        'password',
        mockReq,
        tx,
      );

      // Generate tokens for limited user
      const limitedAuth = await authService.validateLogin(
        limitedWithRoles.emails[0].email,
        'password',
        mockReq,
        tx,
      );

      adminToken = adminAuth.accessToken;
      limitedUserToken = limitedAuth.accessToken;
    });
  });

  afterAll(async () => {
    // Clean up in correct order to avoid deadlocks
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.personRole.deleteMany(),
      prisma.rolePermission.deleteMany(),
      prisma.email.deleteMany(),
      prisma.person.deleteMany(),
      prisma.role.deleteMany(),
      prisma.permission.deleteMany(),
    ]);
    await app.close();
  });

  describe('Permission Management', () => {
    it('should allow admin to view all permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
      expect(response.body.roles).toBeDefined();
      expect(Array.isArray(response.body.roles)).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalPermissions).toBeGreaterThan(0);
      expect(response.body.stats.totalRoles).toBeGreaterThan(0);
    });

    it('should deny access to permissions for unauthenticated users', async () => {
      await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .expect(401);
    });

    it('should deny access to permissions for users without proper permissions', async () => {
      await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .set('Authorization', `Bearer ${limitedUserToken}`)
        .expect(403);
    });

    it('should properly cache permission responses', async () => {
      // First request should hit database
      const firstResponse = await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Second request should hit cache
      const secondResponse = await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify structure and non-empty arrays
      expect(firstResponse.body.categories).toBeDefined();
      expect(Array.isArray(firstResponse.body.categories)).toBe(true);
      expect(firstResponse.body.categories.length).toBeGreaterThan(0);
      expect(firstResponse.body.roles).toBeDefined();
      expect(Array.isArray(firstResponse.body.roles)).toBe(true);
      expect(firstResponse.body.roles.length).toBeGreaterThan(0);
      expect(firstResponse.body.stats).toBeDefined();
      expect(firstResponse.body.stats.totalPermissions).toBeGreaterThan(0);
      expect(firstResponse.body.stats.totalRoles).toBeGreaterThan(0);

      // Verify both responses are identical
      expect(firstResponse.body).toEqual(secondResponse.body);
    });

    it('should handle invalid tokens correctly', async () => {
      await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
}); 