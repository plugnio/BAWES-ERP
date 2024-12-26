import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';

export const TestConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env.test',
});

export const getTestPrismaService = async () => {
  const prisma = new PrismaService();
  
  // Clean database before tests
  const modelNames = Reflect.ownKeys(prisma).filter(
    (key) => typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
  ) as string[];

  // Clear all tables
  await Promise.all(
    modelNames.map(async (modelName) => {
      if (prisma[modelName]?.deleteMany) {
        await prisma[modelName].deleteMany();
      }
    }),
  );

  return prisma;
};

export const TEST_JWT_SECRET = 'test-secret';
export const TEST_REDIS_URL = 'redis://localhost:6379/1'; // Use different DB for tests 