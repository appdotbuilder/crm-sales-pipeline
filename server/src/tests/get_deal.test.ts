import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, contactsTable, dealsTable } from '../db/schema';
import { getDeal } from '../handlers/get_deal';

describe('getDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a deal when it exists', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '123-456-7890',
        email: 'contact@test.com',
        address: '123 Test St'
      })
      .returning()
      .execute();
    
    const companyId = companyResult[0].id;

    // Create prerequisite contact
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '555-0123',
        job_title: 'Manager',
        company_id: companyId
      })
      .returning()
      .execute();

    const contactId = contactResult[0].id;

    // Create test deal
    const dealResult = await db.insert(dealsTable)
      .values({
        title: 'Big Software Deal',
        description: 'Enterprise software implementation',
        value: '50000.00',
        stage: 'Qualified',
        contact_id: contactId,
        company_id: companyId,
        expected_close_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const dealId = dealResult[0].id;

    // Test the handler
    const result = await getDeal(dealId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(dealId);
    expect(result!.title).toEqual('Big Software Deal');
    expect(result!.description).toEqual('Enterprise software implementation');
    expect(result!.value).toEqual(50000);
    expect(typeof result!.value).toEqual('number');
    expect(result!.stage).toEqual('Qualified');
    expect(result!.contact_id).toEqual(contactId);
    expect(result!.company_id).toEqual(companyId);
    expect(result!.expected_close_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when deal does not exist', async () => {
    const result = await getDeal(999);
    expect(result).toBeNull();
  });

  it('should handle different deal stages correctly', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
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

    const companyId = companyResult[0].id;

    // Create prerequisite contact
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: null,
        phone: null,
        job_title: null,
        company_id: companyId
      })
      .returning()
      .execute();

    const contactId = contactResult[0].id;

    // Test different deal stages
    const stages = ['New Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'] as const;
    
    for (const stage of stages) {
      const dealResult = await db.insert(dealsTable)
        .values({
          title: `Deal in ${stage}`,
          description: null,
          value: '1000.50',
          stage: stage,
          contact_id: contactId,
          company_id: companyId,
          expected_close_date: null
        })
        .returning()
        .execute();

      const deal = await getDeal(dealResult[0].id);
      
      expect(deal).not.toBeNull();
      expect(deal!.stage).toEqual(stage);
      expect(deal!.title).toEqual(`Deal in ${stage}`);
      expect(deal!.value).toEqual(1000.5);
      expect(typeof deal!.value).toEqual('number');
    }
  });

  it('should handle deals with null optional fields', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Minimal Company',
        industry: null,
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create prerequisite contact
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'Minimal',
        last_name: 'Contact',
        email: null,
        phone: null,
        job_title: null,
        company_id: companyId
      })
      .returning()
      .execute();

    const contactId = contactResult[0].id;

    // Create deal with minimal fields
    const dealResult = await db.insert(dealsTable)
      .values({
        title: 'Minimal Deal',
        description: null,
        value: '0.01',
        stage: 'New Lead',
        contact_id: contactId,
        company_id: companyId,
        expected_close_date: null
      })
      .returning()
      .execute();

    const deal = await getDeal(dealResult[0].id);

    expect(deal).not.toBeNull();
    expect(deal!.title).toEqual('Minimal Deal');
    expect(deal!.description).toBeNull();
    expect(deal!.value).toEqual(0.01);
    expect(deal!.expected_close_date).toBeNull();
  });

  it('should handle large monetary values correctly', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Enterprise Corp',
        industry: 'Finance',
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create prerequisite contact
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'Big',
        last_name: 'Client',
        email: null,
        phone: null,
        job_title: null,
        company_id: companyId
      })
      .returning()
      .execute();

    const contactId = contactResult[0].id;

    // Test with large monetary value
    const dealResult = await db.insert(dealsTable)
      .values({
        title: 'Enterprise Deal',
        description: 'Large enterprise contract',
        value: '9999999.99',
        stage: 'Won',
        contact_id: contactId,
        company_id: companyId,
        expected_close_date: new Date()
      })
      .returning()
      .execute();

    const deal = await getDeal(dealResult[0].id);

    expect(deal).not.toBeNull();
    expect(deal!.value).toEqual(9999999.99);
    expect(typeof deal!.value).toEqual('number');
    expect(deal!.title).toEqual('Enterprise Deal');
    expect(deal!.stage).toEqual('Won');
  });
});