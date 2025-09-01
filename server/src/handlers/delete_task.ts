import { db } from '../db';
import { tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export async function deleteTask(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Delete the task from the database
    const result = await db
      .delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Return success status based on whether a row was affected
    return { success: true };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
}