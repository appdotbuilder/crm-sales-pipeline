import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactsTable, companiesTable } from '../db/schema';
import { type CreateContactInput } from '../schema';
import { createContact } from '../handlers/create_contact';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateContactInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  job_title: 'Software Engineer',
  company_id: null
};

// Test input with minimal fields
const minimalInput: CreateContactInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: null,
  phone: null,
  job_title: null,
  company_id: null
};

describe('createContact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact with all fields', async () => {
    const result = await createContact(testInput);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1-555-0123');
    expect(result.job_title).toEqual('Software Engineer');
    expect(result.company_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a contact with minimal fields', async () => {
    const result = await createContact(minimalInput);

    // Basic field validation
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.job_title).toBeNull();
    expect(result.company_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save contact to database', async () => {
    const result = await createContact(testInput);

    // Query using proper drizzle syntax
    const contacts = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, result.id))
      .execute();

    expect(contacts).toHaveLength(1);
    expect(contacts[0].first_name).toEqual('John');
    expect(contacts[0].last_name).toEqual('Doe');
    expect(contacts[0].email).toEqual('john.doe@example.com');
    expect(contacts[0].phone).toEqual('+1-555-0123');
    expect(contacts[0].job_title).toEqual('Software Engineer');
    expect(contacts[0].company_id).toBeNull();
    expect(contacts[0].created_at).toBeInstanceOf(Date);
    expect(contacts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create contact with valid company_id', async () => {
    // First create a company
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    const inputWithCompany: CreateContactInput = {
      ...testInput,
      company_id: company[0].id
    };

    const result = await createContact(inputWithCompany);

    expect(result.company_id).toEqual(company[0].id);
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
  });

  it('should throw error when company_id does not exist', async () => {
    const inputWithInvalidCompany: CreateContactInput = {
      ...testInput,
      company_id: 999 // Non-existent company ID
    };

    await expect(createContact(inputWithInvalidCompany))
      .rejects.toThrow(/Company with id 999 does not exist/i);
  });

  it('should handle null company_id correctly', async () => {
    const inputWithNullCompany: CreateContactInput = {
      ...testInput,
      company_id: null
    };

    const result = await createContact(inputWithNullCompany);

    expect(result.company_id).toBeNull();
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    
    // Verify in database
    const contacts = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, result.id))
      .execute();

    expect(contacts[0].company_id).toBeNull();
  });

  it('should create multiple contacts successfully', async () => {
    const result1 = await createContact(testInput);
    const result2 = await createContact(minimalInput);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.first_name).toEqual('John');
    expect(result2.first_name).toEqual('Jane');

    // Verify both exist in database
    const allContacts = await db.select()
      .from(contactsTable)
      .execute();

    expect(allContacts).toHaveLength(2);
  });
});