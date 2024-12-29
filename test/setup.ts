import { DatabaseHelper } from './helpers/database.helper';

module.exports = async () => {
  try {
    console.log('Setting up test environment...');
    
    // Initialize database helper for tests
    DatabaseHelper.getInstance();
    
    console.log('Test setup completed successfully');
  } catch (error) {
    console.error('Test setup failed:', error);
    process.exit(1);
  }
}; 