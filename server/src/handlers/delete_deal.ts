import { db } from '../db';
import { dealsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteDeal(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Delete the deal record
    const result = await db.delete(dealsTable)
      .where(eq(dealsTable.id, input.id))
      .execute();

    // Check if any rows were affected (i.e., if the deal existed and was deleted)
    const success = result.rowCount !== null && result.rowCount !== undefined && result.rowCount > 0;
    
    return { success };
  } catch (error) {
    console.error('Deal deletion failed:', error);
    throw error;
  }
}