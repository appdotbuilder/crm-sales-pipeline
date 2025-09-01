import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, contactsTable, dealsTable } from '../db/schema';
import { getDeals } from '../handlers/get_deals';

describe('getDeals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no deals exist', async () => {
    const result = await getDeals();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch all deals from database', async () => {
    // Create prerequisite data first
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '123-456-7890',
        email: 'test@company.com',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const [contact] = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: '555-1234',
        job_title: 'Manager',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create test deals
    const testDeals = [
      {
        title: 'First Deal',
        description: 'First test deal',
        value: '10000.50',
        stage: 'New Lead' as const,
        contact_id: contact.id,
        company_id: company.id,
        expected_close_date: new Date('2024-12-31')
      },
      {
        title: 'Second Deal',
        description: 'Second test deal',
        value: '25000.75',
        stage: 'Qualified' as const,
        contact_id: contact.id,
        company_id: company.id,
        expected_close_date: null
      }
    ];

    await db.insert(dealsTable)
      .values(testDeals)
      .execute();

    const result = await getDeals();

    // Verify results
    expect(result).toHaveLength(2);
    expect(Array.isArray(result)).toBe(true);

    // Check first deal
    const firstDeal = result.find(d => d.title === 'First Deal');
    expect(firstDeal).toBeDefined();
    expect(firstDeal!.title).toEqual('First Deal');
    expect(firstDeal!.description).toEqual('First test deal');
    expect(firstDeal!.value).toEqual(10000.50);
    expect(typeof firstDeal!.value).toEqual('number');
    expect(firstDeal!.stage).toEqual('New Lead');
    expect(firstDeal!.contact_id).toEqual(contact.id);
    expect(firstDeal!.company_id).toEqual(company.id);
    expect(firstDeal!.expected_close_date).toBeInstanceOf(Date);
    expect(firstDeal!.id).toBeDefined();
    expect(firstDeal!.created_at).toBeInstanceOf(Date);
    expect(firstDeal!.updated_at).toBeInstanceOf(Date);

    // Check second deal
    const secondDeal = result.find(d => d.title === 'Second Deal');
    expect(secondDeal).toBeDefined();
    expect(secondDeal!.title).toEqual('Second Deal');
    expect(secondDeal!.description).toEqual('Second test deal');
    expect(secondDeal!.value).toEqual(25000.75);
    expect(typeof secondDeal!.value).toEqual('number');
    expect(secondDeal!.stage).toEqual('Qualified');
    expect(secondDeal!.contact_id).toEqual(contact.id);
    expect(secondDeal!.company_id).toEqual(company.id);
    expect(secondDeal!.expected_close_date).toBeNull();
  });

  it('should handle deals with different stages', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const [contact] = await db.insert(contactsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create deals with all possible stages
    const dealStages = ['New Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'] as const;
    const testDeals = dealStages.map((stage, index) => ({
      title: `Deal ${index + 1}`,
      description: `Deal in ${stage} stage`,
      value: `${(index + 1) * 1000}.00`,
      stage,
      contact_id: contact.id,
      company_id: company.id,
      expected_close_date: null
    }));

    await db.insert(dealsTable)
      .values(testDeals)
      .execute();

    const result = await getDeals();

    expect(result).toHaveLength(6);

    // Verify all stages are present
    dealStages.forEach(stage => {
      const dealWithStage = result.find(d => d.stage === stage);
      expect(dealWithStage).toBeDefined();
      expect(dealWithStage!.stage).toEqual(stage);
      expect(typeof dealWithStage!.value).toEqual('number');
    });
  });

  it('should handle numeric value conversion correctly', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Company'
      })
      .returning()
      .execute();

    const [contact] = await db.insert(contactsTable)
      .values({
        first_name: 'Test',
        last_name: 'User',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create deal with specific numeric value
    await db.insert(dealsTable)
      .values({
        title: 'Numeric Test Deal',
        description: 'Testing numeric conversion',
        value: '12345.67',
        stage: 'New Lead',
        contact_id: contact.id,
        company_id: company.id,
        expected_close_date: null
      })
      .execute();

    const result = await getDeals();

    expect(result).toHaveLength(1);
    expect(result[0].value).toEqual(12345.67);
    expect(typeof result[0].value).toEqual('number');
    expect(result[0].value).not.toEqual('12345.67'); // Should not be string
  });
});