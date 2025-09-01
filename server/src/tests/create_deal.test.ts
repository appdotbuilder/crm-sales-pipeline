import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dealsTable, companiesTable, contactsTable } from '../db/schema';
import { type CreateDealInput } from '../schema';
import { createDeal } from '../handlers/create_deal';
import { eq } from 'drizzle-orm';

describe('createDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let contactId: number;

  // Create prerequisite data before each test
  beforeEach(async () => {
    // Create a company first
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        email: 'test@company.com'
      })
      .returning()
      .execute();
    companyId = companyResult[0].id;

    // Create a contact
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@company.com',
        company_id: companyId
      })
      .returning()
      .execute();
    contactId = contactResult[0].id;
  });

  it('should create a deal with all required fields', async () => {
    const testInput: CreateDealInput = {
      title: 'Enterprise Software Deal',
      description: 'Large enterprise software contract',
      value: 50000.50,
      stage: 'Qualified',
      contact_id: contactId,
      company_id: companyId,
      expected_close_date: new Date('2024-12-31')
    };

    const result = await createDeal(testInput);

    // Basic field validation
    expect(result.title).toEqual('Enterprise Software Deal');
    expect(result.description).toEqual('Large enterprise software contract');
    expect(result.value).toEqual(50000.50);
    expect(typeof result.value).toEqual('number'); // Verify numeric conversion
    expect(result.stage).toEqual('Qualified');
    expect(result.contact_id).toEqual(contactId);
    expect(result.company_id).toEqual(companyId);
    expect(result.expected_close_date).toEqual(new Date('2024-12-31'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a deal with minimal fields (nullable fields as null)', async () => {
    const testInput: CreateDealInput = {
      title: 'Simple Deal',
      description: null,
      value: 1000,
      stage: 'New Lead',
      contact_id: contactId,
      company_id: companyId,
      expected_close_date: null
    };

    const result = await createDeal(testInput);

    expect(result.title).toEqual('Simple Deal');
    expect(result.description).toBeNull();
    expect(result.value).toEqual(1000);
    expect(result.stage).toEqual('New Lead');
    expect(result.contact_id).toEqual(contactId);
    expect(result.company_id).toEqual(companyId);
    expect(result.expected_close_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save deal to database correctly', async () => {
    const testInput: CreateDealInput = {
      title: 'Database Test Deal',
      description: 'Testing database persistence',
      value: 25000.75,
      stage: 'Proposal Sent',
      contact_id: contactId,
      company_id: companyId,
      expected_close_date: new Date('2024-06-15')
    };

    const result = await createDeal(testInput);

    // Query database to verify the deal was saved
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, result.id))
      .execute();

    expect(deals).toHaveLength(1);
    const savedDeal = deals[0];
    expect(savedDeal.title).toEqual('Database Test Deal');
    expect(savedDeal.description).toEqual('Testing database persistence');
    expect(parseFloat(savedDeal.value)).toEqual(25000.75); // Check numeric conversion in DB
    expect(savedDeal.stage).toEqual('Proposal Sent');
    expect(savedDeal.contact_id).toEqual(contactId);
    expect(savedDeal.company_id).toEqual(companyId);
    expect(savedDeal.expected_close_date).toEqual(new Date('2024-06-15'));
    expect(savedDeal.created_at).toBeInstanceOf(Date);
    expect(savedDeal.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different deal stages correctly', async () => {
    const stages = ['New Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'] as const;
    
    for (const stage of stages) {
      const testInput: CreateDealInput = {
        title: `Deal in ${stage} stage`,
        description: `Testing ${stage} stage`,
        value: 10000,
        stage: stage,
        contact_id: contactId,
        company_id: companyId,
        expected_close_date: null
      };

      const result = await createDeal(testInput);
      expect(result.stage).toEqual(stage);
    }
  });

  it('should handle large decimal values correctly', async () => {
    const testInput: CreateDealInput = {
      title: 'Large Value Deal',
      description: 'Testing large numeric values',
      value: 999999.99,
      stage: 'Won',
      contact_id: contactId,
      company_id: companyId,
      expected_close_date: null
    };

    const result = await createDeal(testInput);

    expect(result.value).toEqual(999999.99);
    expect(typeof result.value).toEqual('number');
    
    // Verify in database
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, result.id))
      .execute();
    
    expect(parseFloat(deals[0].value)).toEqual(999999.99);
  });

  it('should throw error for invalid foreign key references', async () => {
    const testInput: CreateDealInput = {
      title: 'Invalid Deal',
      description: 'Deal with invalid foreign keys',
      value: 5000,
      stage: 'New Lead',
      contact_id: 99999, // Non-existent contact
      company_id: 99999, // Non-existent company
      expected_close_date: null
    };

    await expect(createDeal(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});