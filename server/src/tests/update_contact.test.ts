import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactsTable, companiesTable } from '../db/schema';
import { type UpdateContactInput } from '../schema';
import { updateContact } from '../handlers/update_contact';
import { eq } from 'drizzle-orm';

describe('updateContact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a contact with all fields', async () => {
    // Create a company first
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Tech',
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    // Create a contact
    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        job_title: 'Developer',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateContactInput = {
      id: contact[0].id,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '098-765-4321',
      job_title: 'Senior Developer',
      company_id: company[0].id
    };

    const result = await updateContact(updateInput);

    expect(result.id).toEqual(contact[0].id);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('098-765-4321');
    expect(result.job_title).toEqual('Senior Developer');
    expect(result.company_id).toEqual(company[0].id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update only specified fields', async () => {
    // Create a contact
    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        job_title: 'Developer',
        company_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateContactInput = {
      id: contact[0].id,
      first_name: 'Jane',
      email: 'jane@example.com'
    };

    const result = await updateContact(updateInput);

    // Updated fields
    expect(result.first_name).toEqual('Jane');
    expect(result.email).toEqual('jane@example.com');
    
    // Unchanged fields
    expect(result.last_name).toEqual('Doe');
    expect(result.phone).toEqual('123-456-7890');
    expect(result.job_title).toEqual('Developer');
    expect(result.company_id).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update contact with nullable fields set to null', async () => {
    // Create a contact with values
    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        job_title: 'Developer',
        company_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateContactInput = {
      id: contact[0].id,
      email: null,
      phone: null,
      job_title: null,
      company_id: null
    };

    const result = await updateContact(updateInput);

    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.job_title).toBeNull();
    expect(result.company_id).toBeNull();
    // Non-nullable fields should remain unchanged
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
  });

  it('should update contact company association', async () => {
    // Create two companies
    const company1 = await db.insert(companiesTable)
      .values({
        name: 'Company 1',
        industry: null,
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    const company2 = await db.insert(companiesTable)
      .values({
        name: 'Company 2',
        industry: null,
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    // Create a contact associated with company1
    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: null,
        phone: null,
        job_title: null,
        company_id: company1[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateContactInput = {
      id: contact[0].id,
      company_id: company2[0].id
    };

    const result = await updateContact(updateInput);

    expect(result.company_id).toEqual(company2[0].id);
    expect(result.first_name).toEqual('John'); // Other fields unchanged
    expect(result.last_name).toEqual('Doe');
  });

  it('should save updated contact to database', async () => {
    // Create a contact
    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: null,
        job_title: null,
        company_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateContactInput = {
      id: contact[0].id,
      first_name: 'Updated John',
      last_name: 'Updated Doe'
    };

    await updateContact(updateInput);

    // Query database directly to verify changes
    const updatedContact = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, contact[0].id))
      .execute();

    expect(updatedContact).toHaveLength(1);
    expect(updatedContact[0].first_name).toEqual('Updated John');
    expect(updatedContact[0].last_name).toEqual('Updated Doe');
    expect(updatedContact[0].email).toEqual('john@example.com'); // Unchanged
    expect(updatedContact[0].updated_at.getTime()).toBeGreaterThan(updatedContact[0].created_at.getTime());
  });

  it('should throw error when contact does not exist', async () => {
    const updateInput: UpdateContactInput = {
      id: 99999, // Non-existent contact
      first_name: 'Jane'
    };

    await expect(updateContact(updateInput)).rejects.toThrow(/Contact with id 99999 not found/i);
  });

  it('should throw error when company does not exist', async () => {
    // Create a contact
    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: null,
        phone: null,
        job_title: null,
        company_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateContactInput = {
      id: contact[0].id,
      company_id: 99999 // Non-existent company
    };

    await expect(updateContact(updateInput)).rejects.toThrow(/Company with id 99999 not found/i);
  });

  it('should handle minimal update input', async () => {
    // Create a contact
    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: null,
        phone: null,
        job_title: null,
        company_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateContactInput = {
      id: contact[0].id
    };

    const result = await updateContact(updateInput);

    // All original data should remain unchanged
    expect(result.id).toEqual(contact[0].id);
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.job_title).toBeNull();
    expect(result.company_id).toBeNull();
    // Only updated_at should change
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });
});