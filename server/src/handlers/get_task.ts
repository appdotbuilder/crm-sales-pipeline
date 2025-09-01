import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTask(id: number): Promise<Task | null> {
  try {
    // Query task by ID
    const results = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, id))
      .execute();

    // Return null if no task found
    if (results.length === 0) {
      return null;
    }

    const task = results[0];
    
    // Return task with proper type conversions
    return {
      ...task,
      // No numeric columns in tasks table that need conversion
      // All fields are already in correct format
    };
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
}