import * as request from 'supertest';
import { TestSetup } from '../test-setup';

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
    // Discover and create permissions from code
    await testSetup.setupPermissions();
  });

  describe('GET /permissions', () => {
    it('should return all permissions discovered from code', async () => {
      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get('/permissions')
        .expect(200);

      // Assert
      expect(response.body.length).toBeGreaterThan(0);
      // Each permission should have required fields
      response.body.forEach(permission => {
        expect(permission).toMatchObject({
          code: expect.any(String),
          name: expect.any(String),
          category: expect.any(String),
          description: expect.any(String),
          bitfield: expect.any(String),
        });
        // Verify permission format
        expect(permission.code).toMatch(/^[a-z]+\.[a-z]+$/);
        // Verify bitfield is power of 2
        const bitfield = BigInt(permission.bitfield);
        expect(bitfield & (bitfield - BigInt(1))).toBe(BigInt(0));
      });
    });
  });

  describe('Permission Discovery', () => {
    it('should automatically assign unique power-of-2 bitfields', async () => {
      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get('/permissions')
        .expect(200);

      // Assert
      const bitfields = response.body.map(p => BigInt(p.bitfield));
      
      // Check all bitfields are unique
      const uniqueBitfields = new Set(bitfields);
      expect(uniqueBitfields.size).toBe(bitfields.length);
      
      // Check all bitfields are powers of 2
      bitfields.forEach(bitfield => {
        expect(bitfield & (bitfield - BigInt(1))).toBe(BigInt(0));
      });
      
      // Check bitfields are in ascending order
      const sortedBitfields = [...bitfields].sort((a, b) => 
        a < b ? -1 : a > b ? 1 : 0
      );
      expect(bitfields).toEqual(sortedBitfields);
    });

    it('should group permissions by category', async () => {
      // Act
      const response = await request(testSetup.app.getHttpServer())
        .get('/permissions')
        .expect(200);

      // Group permissions by category
      const categories = response.body.reduce((acc, permission) => {
        acc[permission.category] = acc[permission.category] || [];
        acc[permission.category].push(permission);
        return acc;
      }, {});

      // Assert
      Object.entries(categories).forEach(([category, permissions]: [string, any[]]) => {
        // Category should be lowercase
        expect(category).toMatch(/^[a-z]+$/);
        // Each category should have at least one permission
        expect(permissions.length).toBeGreaterThan(0);
        // All permissions in category should have matching category
        permissions.forEach(permission => {
          expect(permission.category).toBe(category);
          expect(permission.code.startsWith(category + '.')).toBe(true);
        });
      });
    });
  });
}); 