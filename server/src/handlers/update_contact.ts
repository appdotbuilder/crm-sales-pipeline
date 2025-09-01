import { db } from '../db';
import { contactsTable, companiesTable } from '../db/schema';
import { type UpdateContactInput, type Contact } from '../schema';
import { eq } from 'drizzle-orm';

export const updateContact = async (input: UpdateContactInput): Promise<Contact> => {
  try {
    // Verify the contact exists
    const existingContact = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, input.id))
      .execute();

    if (existingContact.length === 0) {
      throw new Error(`Contact with id ${input.id} not found`);
    }

    // If company_id is provided, verify the company exists
    if (input.company_id !== undefined && input.company_id !== null) {
      const company = await db.select()
        .from(companiesTable)
        .where(eq(companiesTable.id, input.company_id))
        .execute();

      if (company.length === 0) {
        throw new Error(`Company with id ${input.company_id} not found`);
      }
    }

    // Prepare update data, only including defined fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.first_name !== undefined) {
      updateData.first_name = input.first_name;
    }
    if (input.last_name !== undefined) {
      updateData.last_name = input.last_name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.job_title !== undefined) {
      updateData.job_title = input.job_title;
    }
    if (input.company_id !== undefined) {
      updateData.company_id = input.company_id;
    }

    // Update contact record
    const result = await db.update(contactsTable)
      .set(updateData)
      .where(eq(contactsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact update failed:', error);
    throw error;
  }
};