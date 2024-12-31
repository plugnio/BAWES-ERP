import * as dotenv from 'dotenv';
import * as path from 'path';
import { DatabaseHelper } from './helpers/database.helper';
import { Logger } from '@nestjs/common';

// Load test environment before anything else
const envPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });

// Verify we're in test environment
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests must run with NODE_ENV=test');
}

// Silence NestJS logger during tests
Logger.overrideLogger([]);

// Increase timeout for all tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Clean database before all tests
  await DatabaseHelper.getInstance().cleanDatabase();
});

// Global test cleanup
afterAll(async () => {
  // Clean database after all tests
  await DatabaseHelper.getInstance().cleanDatabase();
  
  // Disconnect from database
  await DatabaseHelper.cleanup();
  
  // Use real timers
  jest.useRealTimers();
  
  // Clear all mocks and timers
  jest.resetModules();
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Allow time for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
  jest.clearAllTimers();
});

// Cleanup after each test
afterEach(async () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
}); 