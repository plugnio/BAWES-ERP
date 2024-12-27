const { DatabaseHelper } = require('./helpers/database.helper');

// Increase timeout for all tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Ensure database tables exist
  await DatabaseHelper.ensureTablesExist();
});

// Global test cleanup
afterAll(async () => {
  await DatabaseHelper.resetDatabase();
  
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