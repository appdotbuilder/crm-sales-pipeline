import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactsTable, companiesTable } from '../db/schema';
import { getContacts } from '../handlers/get_contacts';

describe('getContacts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no contacts exist', async () => {
    const result = await getContacts();

    expect(result).toEqual([]);
  });

  it('should return all contacts', async () => {
    // Create a company first for foreign key reference
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '555-0123',
        email: 'contact@test.com',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create test contacts
    await db.insert(contactsTable)
      .values([
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@test.com',
          phone: '555-0001',
          job_title: 'Software Engineer',
          company_id: companyId
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@test.com',
          phone: '555-0002',
          job_title: 'Product Manager',
          company_id: companyId
        },
        {
          first_name: 'Bob',
          last_name: 'Johnson',
          email: null,
          phone: null,
          job_title: null,
          company_id: null
        }
      ])
      .execute();

    const result = await getContacts();

    expect(result).toHaveLength(3);
    
    // Verify first contact
    const johnContact = result.find(c => c.first_name === 'John');
    expect(johnContact).toBeDefined();
    expect(johnContact!.last_name).toEqual('Doe');
    expect(johnContact!.email).toEqual('john.doe@test.com');
    expect(johnContact!.phone).toEqual('555-0001');
    expect(johnContact!.job_title).toEqual('Software Engineer');
    expect(johnContact!.company_id).toEqual(companyId);
    expect(johnContact!.id).toBeDefined();
    expect(johnContact!.created_at).toBeInstanceOf(Date);
    expect(johnContact!.updated_at).toBeInstanceOf(Date);

    // Verify second contact
    const janeContact = result.find(c => c.first_name === 'Jane');
    expect(janeContact).toBeDefined();
    expect(janeContact!.last_name).toEqual('Smith');
    expect(janeContact!.email).toEqual('jane.smith@test.com');
    expect(janeContact!.phone).toEqual('555-0002');
    expect(janeContact!.job_title).toEqual('Product Manager');
    expect(janeContact!.company_id).toEqual(companyId);

    // Verify third contact with null values
    const bobContact = result.find(c => c.first_name === 'Bob');
    expect(bobContact).toBeDefined();
    expect(bobContact!.last_name).toEqual('Johnson');
    expect(bobContact!.email).toBeNull();
    expect(bobContact!.phone).toBeNull();
    expect(bobContact!.job_title).toBeNull();
    expect(bobContact!.company_id).toBeNull();
  });

  it('should return contacts in creation order', async () => {
    // Create test contacts in specific order
    await db.insert(contactsTable)
      .values([
        {
          first_name: 'Alice',
          last_name: 'Anderson',
          email: 'alice@test.com',
          phone: null,
          job_title: null,
          company_id: null
        },
        {
          first_name: 'Charlie',
          last_name: 'Clark',
          email: 'charlie@test.com',
          phone: null,
          job_title: null,
          company_id: null
        },
        {
          first_name: 'Bob',
          last_name: 'Brown',
          email: 'bob@test.com',
          phone: null,
          job_title: null,
          company_id: null
        }
      ])
      .execute();

    const result = await getContacts();

    expect(result).toHaveLength(3);
    
    // Verify that contacts are returned in ID order (creation order)
    expect(result[0].first_name).toEqual('Alice');
    expect(result[1].first_name).toEqual('Charlie');
    expect(result[2].first_name).toEqual('Bob');
    
    // Verify IDs are in ascending order
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });

  it('should handle contacts with various field combinations', async () => {
    // Test contact with minimal data
    await db.insert(contactsTable)
      .values({
        first_name: 'Min',
        last_name: 'Minimal',
        email: null,
        phone: null,
        job_title: null,
        company_id: null
      })
      .execute();

    const result = await getContacts();

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toEqual('Min');
    expect(result[0].last_name).toEqual('Minimal');
    expect(result[0].email).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].job_title).toBeNull();
    expect(result[0].company_id).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});