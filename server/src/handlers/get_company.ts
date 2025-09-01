import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type Company } from '../schema';
import { eq } from 'drizzle-orm';

export const getCompany = async (id: number): Promise<Company | null> => {
  try {
    const result = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Company retrieval failed:', error);
    throw error;
  }
};