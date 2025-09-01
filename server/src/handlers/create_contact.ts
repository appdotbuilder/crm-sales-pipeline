import { db } from '../db';
import { contactsTable, companiesTable } from '../db/schema';
import { type CreateContactInput, type Contact } from '../schema';
import { eq } from 'drizzle-orm';

export const createContact = async (input: CreateContactInput): Promise<Contact> => {
  try {
    // Validate that company exists if company_id is provided
    if (input.company_id !== null) {
      const company = await db.select()
        .from(companiesTable)
        .where(eq(companiesTable.id, input.company_id))
        .execute();
      
      if (company.length === 0) {
        throw new Error(`Company with id ${input.company_id} does not exist`);
      }
    }

    // Insert contact record
    const result = await db.insert(contactsTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        job_title: input.job_title,
        company_id: input.company_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact creation failed:', error);
    throw error;
  }
};