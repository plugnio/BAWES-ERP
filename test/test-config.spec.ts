import { ConfigService } from '@nestjs/config';
import { TestConfigModule, getTestPrismaService } from './test-config';
import { PrismaService } from '../src/prisma/prisma.service';
import { Test } from '@nestjs/testing';

describe('TestConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('TestConfigModule', () => {
    it('should load test environment configuration', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [TestConfigModule],
      }).compile();

      const config = moduleRef.get<ConfigService>(ConfigService);
      expect(config.get('NODE_ENV')).toBe('test');
    });
  });

  describe('getTestPrismaService', () => {
    let prisma: PrismaService;

    beforeEach(async () => {
      // Get a clean Prisma instance before each test
      prisma = await getTestPrismaService();
    });

    afterEach(async () => {
      // Clean up and disconnect after each test
      if (prisma) {
        await prisma.$disconnect();
      }
    });

    it('should create PrismaService with test configuration', async () => {
      expect(prisma).toBeInstanceOf(PrismaService);
    });

    it('should clean database tables before returning service', async () => {
      // Create test data
      await prisma.person.create({
        data: {
          nameEn: 'Test Person',
          accountStatus: 'active',
          passwordHash: 'test-hash', // Required field
        },
      });

      // Get new instance (should clean tables)
      const newPrisma = await getTestPrismaService();

      try {
        // Verify tables are empty
        const count = await newPrisma.person.count();
        expect(count).toBe(0);
      } finally {
        // Clean up
        await newPrisma.$disconnect();
      }
    });
  });
}); 