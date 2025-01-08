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

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
    discoveryService = moduleRef.get(PermissionDiscoveryService);
    authService = moduleRef.get(AuthService);
    roleService = moduleRef.get(RoleService);
    personRoleService = moduleRef.get(PersonRoleService);
    jwtService = moduleRef.get(JwtService);
    rbacCacheService = moduleRef.get(RbacCacheService);

    // Clean database
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.email.deleteMany(),
      prisma.personRole.deleteMany(),
      prisma.rolePermission.deleteMany(),
      prisma.role.deleteMany(),
      prisma.permission.deleteMany(),
      prisma.person.deleteMany(),
    ]);
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.email.deleteMany(),
      prisma.personRole.deleteMany(),
      prisma.rolePermission.deleteMany(),
      prisma.person.deleteMany(),
      prisma.permission.deleteMany(),
      prisma.role.deleteMany(),
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

      // Create limited user
      const newLimitedUser = await tx.person.create({
        data: {
          nameEn: 'Limited User',
          nameAr: 'مستخدم محدود',
          passwordHash: await bcrypt.hash('password', 10),
          accountStatus: 'active',
          emails: {
            create: {
              email: `limited-${Date.now()}@test.com`,
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
            in: ['people.read', 'people.list'],
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

    // Verify users exist with roles
    const adminWithRoles = await prisma.person.findUnique({
      where: { id: adminUser.id },
      include: { roles: true },
    });

    const limitedWithRoles = await prisma.person.findUnique({
      where: { id: limitedUser.id },
      include: { roles: true },
    });

    if (!adminWithRoles || !limitedWithRoles) {
      throw new Error('Users not found with roles');
    }

    const adminAuth = await (authService as any).generateTokens(adminWithRoles.id, mockReq);
    const limitedAuth = await (authService as any).generateTokens(limitedWithRoles.id, mockReq);

    adminToken = adminAuth.accessToken;
    limitedUserToken = limitedAuth.accessToken;
  });

  afterAll(async () => {
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.email.deleteMany(),
      prisma.personRole.deleteMany(),
      prisma.rolePermission.deleteMany(),
      prisma.person.deleteMany(),
      prisma.permission.deleteMany(),
      prisma.role.deleteMany(),
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
      // First request to populate cache
      const firstResponse = await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Second request should hit cache
      const secondResponse = await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

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