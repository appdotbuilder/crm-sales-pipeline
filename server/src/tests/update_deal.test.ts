import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, contactsTable, dealsTable } from '../db/schema';
import { type UpdateDealInput, type CreateCompanyInput, type CreateContactInput } from '../schema';
import { updateDeal } from '../handlers/update_deal';
import { eq } from 'drizzle-orm';

// Test data
const testCompany: CreateCompanyInput = {
  name: 'Tech Corp',
  industry: 'Technology',
  website: 'https://techcorp.com',
  phone: '+1-555-0100',
  email: 'contact@techcorp.com',
  address: '123 Tech Street'
};

const testContact: CreateContactInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@techcorp.com',
  phone: '+1-555-0101',
  job_title: 'CTO',
  company_id: 1 // Will be set after creating company
};

const testDeal = {
  title: 'Original Deal',
  description: 'Original description',
  value: 50000,
  stage: 'Qualified' as const,
  contact_id: 1, // Will be set after creating contact
  company_id: 1, // Will be set after creating company
  expected_close_date: new Date('2024-12-31')
};

describe('updateDeal', () => {
  let companyId: number;
  let contactId: number;
  let dealId: number;

  beforeEach(async () => {
    await createDB();

    // Create company first
    const companyResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    companyId = companyResult[0].id;

    // Create contact
    const contactResult = await db.insert(contactsTable)
      .values({ ...testContact, company_id: companyId })
      .returning()
      .execute();
    contactId = contactResult[0].id;

    // Create deal
    const dealResult = await db.insert(dealsTable)
      .values({
        ...testDeal,
        contact_id: contactId,
        company_id: companyId,
        value: testDeal.value.toString() // Convert to string for DB
      })
      .returning()
      .execute();
    dealId = dealResult[0].id;
  });

  afterEach(resetDB);

  it('should update deal with all fields', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      title: 'Updated Deal Title',
      description: 'Updated description',
      value: 75000,
      stage: 'Negotiation',
      contact_id: contactId,
      company_id: companyId,
      expected_close_date: new Date('2025-01-15')
    };

    const result = await updateDeal(updateInput);

    expect(result.id).toEqual(dealId);
    expect(result.title).toEqual('Updated Deal Title');
    expect(result.description).toEqual('Updated description');
    expect(result.value).toEqual(75000);
    expect(typeof result.value).toEqual('number');
    expect(result.stage).toEqual('Negotiation');
    expect(result.contact_id).toEqual(contactId);
    expect(result.company_id).toEqual(companyId);
    expect(result.expected_close_date).toEqual(new Date('2025-01-15'));
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update deal with partial fields', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      title: 'Partially Updated Deal',
      value: 60000
    };

    const result = await updateDeal(updateInput);

    expect(result.id).toEqual(dealId);
    expect(result.title).toEqual('Partially Updated Deal');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.value).toEqual(60000);
    expect(typeof result.value).toEqual('number');
    expect(result.stage).toEqual('Qualified'); // Unchanged
    expect(result.contact_id).toEqual(contactId); // Unchanged
    expect(result.company_id).toEqual(companyId); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update deal with null values', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      description: null,
      expected_close_date: null
    };

    const result = await updateDeal(updateInput);

    expect(result.id).toEqual(dealId);
    expect(result.title).toEqual('Original Deal'); // Unchanged
    expect(result.description).toBeNull();
    expect(result.expected_close_date).toBeNull();
    expect(result.value).toEqual(50000); // Unchanged
    expect(result.stage).toEqual('Qualified'); // Unchanged
  });

  it('should update deal stage', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      stage: 'Won'
    };

    const result = await updateDeal(updateInput);

    expect(result.id).toEqual(dealId);
    expect(result.stage).toEqual('Won');
    expect(result.title).toEqual('Original Deal'); // Other fields unchanged
    expect(result.value).toEqual(50000);
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      title: 'Database Test Deal',
      value: 80000,
      stage: 'Won'
    };

    await updateDeal(updateInput);

    // Verify changes were saved to database
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, dealId))
      .execute();

    expect(deals).toHaveLength(1);
    expect(deals[0].title).toEqual('Database Test Deal');
    expect(parseFloat(deals[0].value)).toEqual(80000);
    expect(deals[0].stage).toEqual('Won');
    expect(deals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when deal does not exist', async () => {
    const updateInput: UpdateDealInput = {
      id: 99999, // Non-existent ID
      title: 'Non-existent Deal'
    };

    await expect(updateDeal(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle zero value updates', async () => {
    const updateInput: UpdateDealInput = {
      id: dealId,
      value: 0
    };

    const result = await updateDeal(updateInput);

    expect(result.value).toEqual(0);
    expect(typeof result.value).toEqual('number');
  });

  it('should update only the updated_at timestamp when no other fields change', async () => {
    const originalDeal = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, dealId))
      .execute();

    const originalUpdatedAt = originalDeal[0].updated_at;

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateDealInput = {
      id: dealId
    };

    const result = await updateDeal(updateInput);

    expect(result.title).toEqual('Original Deal'); // No change
    expect(result.value).toEqual(50000); // No change
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});