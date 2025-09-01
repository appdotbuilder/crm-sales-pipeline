import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type UpdateCompanyInput, type Company } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCompany = async (input: UpdateCompanyInput): Promise<Company> => {
  try {
    // Extract id and update fields
    const { id, ...updateFields } = input;

    // Build update object with only provided fields
    const updateData: Partial<typeof companiesTable.$inferInsert> = {
      updated_at: new Date()
    };

    // Add only the fields that were provided in the input
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.industry !== undefined) {
      updateData.industry = input.industry;
    }
    if (input.website !== undefined) {
      updateData.website = input.website;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    // Update company record
    const result = await db.update(companiesTable)
      .set(updateData)
      .where(eq(companiesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Company with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Company update failed:', error);
    throw error;
  }
};