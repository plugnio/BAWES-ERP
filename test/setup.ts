import { DatabaseHelper } from './helpers/database.helper';

module.exports = async () => {
  // Initialize database helper instance
  // This ensures the database connection is ready before any tests start
  DatabaseHelper.getInstance();
}; 