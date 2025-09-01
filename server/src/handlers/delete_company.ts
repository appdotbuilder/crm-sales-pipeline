import { db } from '../db';
import { companiesTable, contactsTable, dealsTable, tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export async function deleteCompany(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, check if the company exists
    const existingCompany = await db.select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.id, input.id))
      .execute();

    if (existingCompany.length === 0) {
      throw new Error(`Company with id ${input.id} not found`);
    }

    // Delete related records in correct order to maintain referential integrity
    // 1. Delete tasks related to the company
    await db.delete(tasksTable)
      .where(eq(tasksTable.company_id, input.id))
      .execute();

    // 2. Delete deals related to the company
    await db.delete(dealsTable)
      .where(eq(dealsTable.company_id, input.id))
      .execute();

    // 3. Update contacts to remove company reference (set company_id to null)
    await db.update(contactsTable)
      .set({ company_id: null })
      .where(eq(contactsTable.company_id, input.id))
      .execute();

    // 4. Finally, delete the company
    await db.delete(companiesTable)
      .where(eq(companiesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Company deletion failed:', error);
    throw error;
  }
}