import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PermissionDiscoveryService } from '../src/rbac/services/permission-discovery.service';
import { AuthService } from '../src/auth/auth.service';
import { RoleService } from '../src/rbac/services/role.service';
import { PersonRoleService } from '../src/rbac/services/person-role.service';
import { Role, Permission } from '@prisma/client';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Decimal } from 'decimal.js';

describe('Permission Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let discoveryService: PermissionDiscoveryService;
  let authService: AuthService;
  let roleService: RoleService;
  let personRoleService: PersonRoleService;
  let jwtService: JwtService;
  let adminToken: string;
  let limitedUserToken: string;
  let testRole: Role;
  let permissions: Permission[];

  beforeAll(async () => {
    // Create test module with real implementations
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Get service instances
    prisma = moduleRef.get(PrismaService);
    discoveryService = moduleRef.get(PermissionDiscoveryService);
    authService = moduleRef.get(AuthService);
    roleService = moduleRef.get(RoleService);
    personRoleService = moduleRef.get(PersonRoleService);
    jwtService = moduleRef.get(JwtService);

    // Clean database
    await prisma.refreshToken.deleteMany();
    await prisma.email.deleteMany();
    await prisma.personRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.person.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    // Import test RBAC data
    const { roles } = await import('../prisma/data/test/rbac');

    // Discover and sync permissions first
    await discoveryService.onModuleInit();
    permissions = await prisma.permission.findMany();

    // Create system roles
    for (const role of roles) {
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

      // For SUPER_ADMIN, assign all permissions
      if (role.name === 'SUPER_ADMIN') {
        console.log('Assigning all permissions to SUPER_ADMIN');
        const allPermissions = await prisma.permission.findMany();
        await prisma.rolePermission.createMany({
          data: allPermissions.map(permission => ({
            roleId: createdRole.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }
      // For other roles, assign specific permissions
      else if (role.permissions !== '*' && role.permissions?.length) {
        console.log('Assigning specific permissions to', role.name);
        const rolePermissions = await prisma.permission.findMany({
          where: {
            code: {
              in: role.permissions as string[],
            },
          },
        });

        await prisma.rolePermission.createMany({
          data: rolePermissions.map(permission => ({
            roleId: createdRole.id,
            permissionId: permission.id,
          })),
        });
      }
    }

    // Get all permissions for use in tests
    permissions = await prisma.permission.findMany();

    // Check if roles were created
    const allRoles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    console.log('All roles:', allRoles);
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.refreshToken.deleteMany();
    await prisma.email.deleteMany();
    await prisma.personRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.person.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    // Rediscover permissions for each test
    await discoveryService.onModuleInit();
    permissions = await prisma.permission.findMany();

    // Import and recreate system roles
    const { roles } = await import('../prisma/data/test/rbac');
    for (const role of roles) {
      const createdRole = await prisma.role.create({
        data: {
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          sortOrder: role.sortOrder,
        },
      });

      // For SUPER_ADMIN, assign all permissions
      if (role.name === 'SUPER_ADMIN') {
        await prisma.rolePermission.createMany({
          data: permissions.map(permission => ({
            roleId: createdRole.id,
            permissionId: permission.id,
          })),
        });
      }
      // For other roles, assign specific permissions
      else if (role.permissions !== '*' && role.permissions?.length) {
        const rolePermissions = await prisma.permission.findMany({
          where: {
            code: {
              in: role.permissions as string[],
            },
          },
        });

        await prisma.rolePermission.createMany({
          data: rolePermissions.map(permission => ({
            roleId: createdRole.id,
            permissionId: permission.id,
          })),
        });
      }
    }

    // Create test users and roles before each test
    const adminUser = await prisma.person.create({
      data: {
        emails: {
          create: {
            email: 'admin@test.com',
            isPrimary: true,
            isVerified: true,
          }
        },
        passwordHash: await bcrypt.hash('password', 10),
        accountStatus: 'active',
      },
    });

    const limitedUser = await prisma.person.create({
      data: {
        emails: {
          create: {
            email: 'limited@test.com',
            isPrimary: true,
            isVerified: true,
          }
        },
        passwordHash: await bcrypt.hash('password', 10),
        accountStatus: 'active',
      },
    });

    // Create role with specific permissions
    const role = await roleService.createRole({
      name: 'TestRole',
      description: 'Test role with limited permissions',
      permissions: [
        permissions.find(p => p.code === 'people.read')?.code,
        permissions.find(p => p.code === 'roles.read')?.code,
      ].filter((code): code is string => code !== undefined),
    });

    if (!role) {
      throw new Error('Failed to create test role');
    }
    testRole = role;

    // Assign roles
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      throw new Error('SUPER_ADMIN role not found');
    }

    await personRoleService.assignRole(adminUser.id, superAdminRole.id);
    await personRoleService.assignRole(limitedUser.id, testRole.id);

    // Get tokens
    const adminAuth = await authService.validateLogin(
      'admin@test.com',
      'password',
      {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        cookies: {},
        res: {
          cookie: jest.fn(),
        },
      } as unknown as Request,
    );
    adminToken = adminAuth.accessToken;

    const limitedAuth = await authService.validateLogin(
      'limited@test.com',
      'password',
      {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        cookies: {},
        res: {
          cookie: jest.fn(),
        },
      } as unknown as Request,
    );
    limitedUserToken = limitedAuth.accessToken;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.email.deleteMany();
    await prisma.personRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.person.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await app.close();
  });

  describe('Permission Enforcement', () => {
    it('should allow super admin access to all endpoints', async () => {
      // Test various protected endpoints
      await request(app.getHttpServer())
        .get('/people')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'NewRole' })
        .expect(201);

      await request(app.getHttpServer())
        .get('/permissions/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should allow limited user access only to permitted endpoints', async () => {
      // Should allow access to endpoints with matching permissions
      await request(app.getHttpServer())
        .get('/people')
        .set('Authorization', `Bearer ${limitedUserToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${limitedUserToken}`)
        .expect(200);

      // Should deny access to endpoints without permissions
      await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${limitedUserToken}`)
        .send({ name: 'NewRole' })
        .expect(403);
    });

    it('should deny access to unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/people')
        .expect(401);
    });

    it('should deny access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/people')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle permission changes in real-time', async () => {
      // Initial access should be granted
      await request(app.getHttpServer())
        .get('/people')
        .set('Authorization', `Bearer ${limitedUserToken}`)
        .expect(200);

      // Remove permission
      await roleService.toggleRolePermission(testRole.id, 'people.read', false);

      // Get new token
      const newAuth = await authService.validateLogin(
        'limited@test.com',
        'password',
        {
          ip: '127.0.0.1',
          headers: { 'user-agent': 'test-agent' },
          cookies: {},
          res: {
            cookie: jest.fn(),
          },
        } as unknown as Request,
      );

      // Access should now be denied
      await request(app.getHttpServer())
        .get('/people')
        .set('Authorization', `Bearer ${newAuth.accessToken}`)
        .expect(403);
    });

    it('should respect public endpoints', async () => {
      await request(app.getHttpServer())
        .get('/')
        .expect(200);
    });
  });

  describe('Permission Discovery', () => {
    it('should correctly discover and sync all permissions', async () => {
      // Sync permissions
      await discoveryService.onModuleInit();
      const syncedPermissions = await prisma.permission.findMany();
      
      // Verify essential permissions exist
      expect(syncedPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'people.read' }),
          expect.objectContaining({ code: 'people.create' }),
          expect.objectContaining({ code: 'roles.read' }),
          expect.objectContaining({ code: 'roles.create' }),
        ])
      );
    });

    it('should assign correct permission bits', async () => {
      const permissions = await prisma.permission.findMany();
      
      // Verify each permission has unique power-of-2 bitfield
      const bits = permissions.map(p => p.bitfield);
      const uniqueBits = new Set(bits);
      expect(uniqueBits.size).toBe(permissions.length);
      
      // Verify all bits are powers of 2
      bits.forEach(bit => {
        expect(Number(bit) & (Number(bit) - 1)).toBe(0);
      });
    });
  });

  describe('JWT Token Permissions', () => {
    it('should include correct permission bits in JWT payload', async () => {
      // Get token for limited user
      const { accessToken } = await authService.validateLogin(
        'limited@test.com',
        'password',
        {
          ip: '127.0.0.1',
          headers: { 'user-agent': 'test-agent' },
          cookies: {},
          res: {
            cookie: jest.fn(),
          },
        } as unknown as Request,
      );

      // Decode token and verify permissions
      const decoded = jwtService.verify(accessToken);
      expect(decoded).toHaveProperty('permissionBits');
      
      // Should have combined bitfield of assigned permissions
      const expectedBits = permissions
        .filter(p => p.code === 'people.read' || p.code === 'roles.read')
        .reduce((acc, p) => acc.add(new Decimal(p.bitfield)), new Decimal(0))
        .toString();

      expect(decoded.permissionBits).toBe(expectedBits);
    });
  });
}); 