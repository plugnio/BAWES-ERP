import { DatabaseHelper } from './helpers/database.helper';

export default async (): Promise<void> => {
  // Get the database helper instance
  const dbHelper = DatabaseHelper.getInstance();

  // Disconnect from the database
  await dbHelper.disconnect();
}; 