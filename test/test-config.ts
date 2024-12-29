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
  // Add a small delay to ensure all connections are properly closed
  await new Promise(resolve => setTimeout(resolve, 100));
}, 500); // Set timeout to 500ms to ensure cleanup completes

// Add global error handler for unhandled promises
beforeAll(() => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
});

export const TEST_JWT_SECRET = 'test-secret';

// Construct Redis URL from environment variables
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = process.env.REDIS_DB || '0';

export const TEST_REDIS_URL = `redis://${REDIS_PASSWORD ? `${REDIS_PASSWORD}@` : ''}${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`; 