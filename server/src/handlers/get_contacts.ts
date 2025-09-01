import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type Contact } from '../schema';

export const getContacts = async (): Promise<Contact[]> => {
  try {
    const results = await db.select()
      .from(contactsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    throw error;
  }
};