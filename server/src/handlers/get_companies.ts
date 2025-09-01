import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type Company } from '../schema';

export const getCompanies = async (): Promise<Company[]> => {
  try {
    const results = await db.select()
      .from(companiesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    throw error;
  }
};