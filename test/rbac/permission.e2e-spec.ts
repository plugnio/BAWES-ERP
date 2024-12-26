import * as request from 'supertest';
import { TestSetup } from '../test-setup';
import { CreatePermissionDto } from '../../src/rbac/dto/create-permission.dto';

describe('Permission Controller (e2e)', () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    testSetup = await new TestSetup().init();
  });

  afterAll(async () => {
    await testSetup.close();
  });

  beforeEach(async () => {
    await testSetup.cleanDb();
  });

  describe('POST /permissions', () => {
    it('should create a new permission', async () => {
      // Arrange
      const createPermissionDto: CreatePermissionDto = {
        code: 'users.create',
        name: 'Create Users',
        category: 'users',
        description: 'Can create users',
      };

      // Act & Assert
      const response = await request(testSetup.app.getHttpServer())
        .post('/permissions')
        .send(createPermissionDto)
        .expect(201);

      expect(response.body).toMatchObject({
        code: createPermissionDto.code,
        name: createPermissionDto.name,
        category: createPermissionDto.category,
        description: createPermissionDto.description,
        bitfield: expect.any(String),
      });

      // Verify permission was created in database
      const createdPermission = await testSetup.prisma.permission.findUnique({
        where: { code: createPermissionDto.code },
      });
      expect(createdPermission).toBeDefined();
      expect(createdPermission.bitfield).toBe(response.body.bitfield);
    });

    it('should not create duplicate permission', async () => {
      // Arrange
      const createPermissionDto: CreatePermissionDto = {
        code: 'users.create',
        name: 'Create Users',
        category: 'users',
        description: 'Can create users',
      };

      // Create first permission
      await request(testSetup.app.getHttpServer())
        .post('/permissions')
        .send(createPermissionDto)
        .expect(201);

      // Act & Assert - Try to create duplicate
      await request(testSetup.app.getHttpServer())
        .post('/permissions')
        .send(createPermissionDto)
        .expect(400);
    });
  });

  describe('GET /permissions', () => {
    it('should return all permissions', async () => {
      // Arrange
      const permissions = [
        {
          code: 'users.create',
          name: 'Create Users',
          category: 'users',
          description: 'Can create users',
        },
        {
          code: 'users.update',
          name: 'Update Users',
          category: 'users',
          description: 'Can update users',
        },
      ];

      // Create test permissions
      for (const permission of permissions) {
        await testSetup.prisma.permission.create({
          data: {
            ...permission,
            bitfield: '1', // Dummy bitfield for test
          },
        });
      }

      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get('/permissions')
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(permissions.length);
      expect(response.body).toEqual(
        expect.arrayContaining(
          permissions.map((p) =>
            expect.objectContaining({
              code: p.code,
              name: p.name,
              category: p.category,
              description: p.description,
            }),
          ),
        ),
      );
    });
  });
}); 