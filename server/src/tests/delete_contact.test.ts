import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactsTable, companiesTable } from '../db/schema';
import { type DeleteInput, type CreateContactInput } from '../schema';
import { deleteContact } from '../handlers/delete_contact';
import { eq } from 'drizzle-orm';

// Test input for creating a contact to delete
const testContactInput: CreateContactInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  job_title: 'Software Engineer',
  company_id: null
};

// Test input for creating a contact with company
const testContactWithCompanyInput: CreateContactInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@acme.com',
  phone: '555-5678',
  job_title: 'Product Manager',
  company_id: 1 // Will be created in tests
};

describe('deleteContact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing contact', async () => {
    // Create a contact first
    const createResult = await db.insert(contactsTable)
      .values(testContactInput)
      .returning()
      .execute();

    const contactId = createResult[0].id;

    // Delete the contact
    const deleteInput: DeleteInput = { id: contactId };
    const result = await deleteContact(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify contact no longer exists in database
    const contacts = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, contactId))
      .execute();

    expect(contacts).toHaveLength(0);
  });

  it('should delete contact with company association', async () => {
    // Create a company first
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Acme Corp',
        industry: 'Technology',
        website: 'https://acme.com',
        phone: '555-0000',
        email: 'info@acme.com',
        address: '123 Business St'
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create a contact with company association
    const contactWithCompany = {
      ...testContactWithCompanyInput,
      company_id: companyId
    };

    const createResult = await db.insert(contactsTable)
      .values(contactWithCompany)
      .returning()
      .execute();

    const contactId = createResult[0].id;

    // Delete the contact
    const deleteInput: DeleteInput = { id: contactId };
    const result = await deleteContact(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify contact no longer exists in database
    const contacts = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, contactId))
      .execute();

    expect(contacts).toHaveLength(0);

    // Verify company still exists (contact deletion shouldn't affect company)
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .execute();

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toEqual('Acme Corp');
  });

  it('should return success even when contact does not exist', async () => {
    // Try to delete a non-existent contact
    const deleteInput: DeleteInput = { id: 99999 };
    const result = await deleteContact(deleteInput);

    // Should still return success (idempotent operation)
    expect(result.success).toBe(true);
  });

  it('should handle multiple sequential deletions', async () => {
    // Create multiple contacts
    const contact1Result = await db.insert(contactsTable)
      .values({
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        phone: '555-1111',
        job_title: 'Designer',
        company_id: null
      })
      .returning()
      .execute();

    const contact2Result = await db.insert(contactsTable)
      .values({
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob@example.com',
        phone: '555-2222',
        job_title: 'Developer',
        company_id: null
      })
      .returning()
      .execute();

    const contact1Id = contact1Result[0].id;
    const contact2Id = contact2Result[0].id;

    // Delete first contact
    const deleteResult1 = await deleteContact({ id: contact1Id });
    expect(deleteResult1.success).toBe(true);

    // Delete second contact
    const deleteResult2 = await deleteContact({ id: contact2Id });
    expect(deleteResult2.success).toBe(true);

    // Verify both contacts are deleted
    const remainingContacts = await db.select()
      .from(contactsTable)
      .execute();

    expect(remainingContacts).toHaveLength(0);
  });

  it('should preserve data integrity after deletion', async () => {
    // Create a company and two contacts
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Tech Solutions',
        industry: 'Software',
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    const contact1Result = await db.insert(contactsTable)
      .values({
        first_name: 'Carol',
        last_name: 'Davis',
        email: 'carol@techsolutions.com',
        phone: '555-3333',
        job_title: 'CTO',
        company_id: companyId
      })
      .returning()
      .execute();

    const contact2Result = await db.insert(contactsTable)
      .values({
        first_name: 'David',
        last_name: 'Brown',
        email: 'david@techsolutions.com',
        phone: '555-4444',
        job_title: 'CEO',
        company_id: companyId
      })
      .returning()
      .execute();

    const contact1Id = contact1Result[0].id;
    const contact2Id = contact2Result[0].id;

    // Delete one contact
    const result = await deleteContact({ id: contact1Id });
    expect(result.success).toBe(true);

    // Verify only one contact was deleted
    const remainingContacts = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.company_id, companyId))
      .execute();

    expect(remainingContacts).toHaveLength(1);
    expect(remainingContacts[0].id).toEqual(contact2Id);
    expect(remainingContacts[0].first_name).toEqual('David');

    // Verify company is still intact
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .execute();

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toEqual('Tech Solutions');
  });
});