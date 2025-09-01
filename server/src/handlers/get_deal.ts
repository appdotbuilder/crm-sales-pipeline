import { db } from '../db';
import { dealsTable } from '../db/schema';
import { type Deal } from '../schema';
import { eq } from 'drizzle-orm';

export const getDeal = async (id: number): Promise<Deal | null> => {
  try {
    const results = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const deal = results[0];
    return {
      ...deal,
      value: parseFloat(deal.value) // Convert numeric field back to number
    };
  } catch (error) {
    console.error('Deal retrieval failed:', error);
    throw error;
  }
};