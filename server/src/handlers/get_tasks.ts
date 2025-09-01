import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';

export const getTasks = async (): Promise<Task[]> => {
  try {
    // Fetch all tasks from the database
    const result = await db.select()
      .from(tasksTable)
      .execute();

    // Convert the results to match the Task schema
    return result.map(task => ({
      ...task,
      // No numeric conversions needed for tasks table
    }));
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};