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
});

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
}); 