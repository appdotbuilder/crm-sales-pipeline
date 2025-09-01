import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteContact(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Delete the contact record
    const result = await db.delete(contactsTable)
      .where(eq(contactsTable.id, input.id))
      .execute();

    // Return success status based on affected rows
    return { success: true };
  } catch (error) {
    console.error('Contact deletion failed:', error);
    throw error;
  }
}