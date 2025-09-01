import { db } from '../db';
import { dealsTable } from '../db/schema';
import { type CreateDealInput, type Deal } from '../schema';

export const createDeal = async (input: CreateDealInput): Promise<Deal> => {
  try {
    // Insert deal record
    const result = await db.insert(dealsTable)
      .values({
        title: input.title,
        description: input.description,
        value: input.value.toString(), // Convert number to string for numeric column
        stage: input.stage,
        contact_id: input.contact_id,
        company_id: input.company_id,
        expected_close_date: input.expected_close_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const deal = result[0];
    return {
      ...deal,
      value: parseFloat(deal.value) // Convert string back to number
    };
  } catch (error) {
    console.error('Deal creation failed:', error);
    throw error;
  }
};