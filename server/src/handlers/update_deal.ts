import { db } from '../db';
import { dealsTable } from '../db/schema';
import { type UpdateDealInput, type Deal } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDeal = async (input: UpdateDealInput): Promise<Deal> => {
  try {
    // Build update object only with provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.value !== undefined) updateData.value = input.value.toString(); // Convert to string for numeric column
    if (input.stage !== undefined) updateData.stage = input.stage;
    if (input.contact_id !== undefined) updateData.contact_id = input.contact_id;
    if (input.company_id !== undefined) updateData.company_id = input.company_id;
    if (input.expected_close_date !== undefined) updateData.expected_close_date = input.expected_close_date;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the deal record
    const result = await db.update(dealsTable)
      .set(updateData)
      .where(eq(dealsTable.id, input.id))
      .returning()
      .execute();

    // Check if deal exists
    if (result.length === 0) {
      throw new Error(`Deal with id ${input.id} not found`);
    }

    // Convert numeric field back to number before returning
    const deal = result[0];
    return {
      ...deal,
      value: parseFloat(deal.value) // Convert string back to number
    };
  } catch (error) {
    console.error('Deal update failed:', error);
    throw error;
  }
};