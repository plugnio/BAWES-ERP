import { DatabaseHelper } from './helpers/database.helper';

module.exports = async () => {
  try {
    console.log('Running test teardown...');
    
    // Clean up database connections
    await DatabaseHelper.cleanup();
    
    // Add a small delay to ensure all connections are properly closed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Test teardown completed successfully');
  } catch (error) {
    console.error('Test teardown failed:', error);
    process.exit(1);
  }
}; 