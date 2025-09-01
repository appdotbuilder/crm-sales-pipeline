import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactsTable, companiesTable } from '../db/schema';
import { getContact } from '../handlers/get_contact';

describe('getContact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent contact', async () => {
    const result = await getContact(999);
    expect(result).toBeNull();
  });

  it('should return contact by id', async () => {
    // Create a contact first
    const insertResult = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        job_title: 'Manager',
        company_id: null
      })
      .returning()
      .execute();

    const createdContact = insertResult[0];
    const result = await getContact(createdContact.id);

    // Verify all fields are returned correctly
    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdContact.id);
    expect(result?.first_name).toEqual('John');
    expect(result?.last_name).toEqual('Doe');
    expect(result?.email).toEqual('john@example.com');
    expect(result?.phone).toEqual('+1234567890');
    expect(result?.job_title).toEqual('Manager');
    expect(result?.company_id).toBeNull();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return contact with company_id when associated with a company', async () => {
    // Create a company first
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Tech Corp',
        industry: 'Technology',
        website: 'https://techcorp.com',
        phone: '+1987654321',
        email: 'info@techcorp.com',
        address: '123 Tech Street'
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create a contact associated with the company
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@techcorp.com',
        phone: '+1555123456',
        job_title: 'Developer',
        company_id: company.id
      })
      .returning()
      .execute();

    const createdContact = contactResult[0];
    const result = await getContact(createdContact.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdContact.id);
    expect(result?.first_name).toEqual('Jane');
    expect(result?.last_name).toEqual('Smith');
    expect(result?.email).toEqual('jane@techcorp.com');
    expect(result?.phone).toEqual('+1555123456');
    expect(result?.job_title).toEqual('Developer');
    expect(result?.company_id).toEqual(company.id);
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return contact with minimal required fields only', async () => {
    // Create contact with only required fields (first_name, last_name)
    const insertResult = await db.insert(contactsTable)
      .values({
        first_name: 'Min',
        last_name: 'Fields',
        email: null,
        phone: null,
        job_title: null,
        company_id: null
      })
      .returning()
      .execute();

    const createdContact = insertResult[0];
    const result = await getContact(createdContact.id);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(createdContact.id);
    expect(result?.first_name).toEqual('Min');
    expect(result?.last_name).toEqual('Fields');
    expect(result?.email).toBeNull();
    expect(result?.phone).toBeNull();
    expect(result?.job_title).toBeNull();
    expect(result?.company_id).toBeNull();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });
});