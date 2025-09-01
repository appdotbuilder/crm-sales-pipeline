import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type Contact } from '../schema';
import { eq } from 'drizzle-orm';

export const getContact = async (id: number): Promise<Contact | null> => {
  try {
    const result = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get contact:', error);
    throw error;
  }
};