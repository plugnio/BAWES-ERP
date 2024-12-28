import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Mock ConfigService with default test database URL
    const mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('postgresql://postgres:postgres@localhost:5432/bawes_erp_test?schema=public'),
    };

    const module = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock database connection methods
    jest.spyOn(service, '$connect').mockResolvedValue(undefined);
    jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);
  });

  afterEach(async () => {
    if (service) {
      await service.$disconnect();
    }
    jest.clearAllMocks();
  });

  it('should use test database URL in test environment', async () => {
    // Mock ConfigService to return test database URL
    const testDbUrl = 'postgresql://user:pass@localhost:5432/test_db';
    jest.spyOn(configService, 'getOrThrow').mockReturnValue(testDbUrl);

    // Create new instance to trigger constructor
    const testService = new PrismaService(configService);
    jest.spyOn(testService, '$connect').mockResolvedValue(undefined);
    jest.spyOn(testService, '$disconnect').mockResolvedValue(undefined);

    // Verify ConfigService was called with DATABASE_URL
    expect(configService.getOrThrow).toHaveBeenCalledWith('DATABASE_URL');

    // Clean up
    await testService.$disconnect();
  });

  it('should properly connect and disconnect from database', async () => {
    // Test connection
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalled();

    // Test disconnection
    await service.onModuleDestroy();
    expect(service.$disconnect).toHaveBeenCalled();
  });

  it('should throw error if DATABASE_URL is not configured', async () => {
    // Mock ConfigService to throw
    jest.spyOn(configService, 'getOrThrow').mockImplementation(() => {
      throw new Error('Config not found: DATABASE_URL');
    });

    // Verify service creation throws
    expect(() => new PrismaService(configService)).toThrow('Config not found: DATABASE_URL');
  });
}); 