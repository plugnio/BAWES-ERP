import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { DatabaseHelper } from './helpers/database.helper';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
  ],
})
export class TestConfigModule {}

export async function getTestPrismaService(): Promise<PrismaService> {
  // Get the database helper instance
  const dbHelper = DatabaseHelper.getInstance();

  // Clean the database
  await dbHelper.cleanDatabase();

  // Return the Prisma service
  return dbHelper.getPrismaService();
}

// Add global teardown
afterAll(async () => {
  await DatabaseHelper.cleanup();
});

export const TEST_JWT_SECRET = 'test-secret';
export const TEST_REDIS_URL = 'redis://localhost:6379/1'; // Use different DB for tests 