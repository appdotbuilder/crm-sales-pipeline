import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, contactsTable, dealsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteDeal } from '../handlers/delete_deal';
import { eq } from 'drizzle-orm';

// Test input for deletion
const testDeleteInput: DeleteInput = {
  id: 1
};

describe('deleteDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing deal', async () => {
    // Create prerequisite company first
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://testcompany.com',
        phone: '555-0123',
        email: 'contact@testcompany.com',
        address: '123 Tech Street'
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create prerequisite contact
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@testcompany.com',
        phone: '555-0124',
        job_title: 'Sales Manager',
        company_id: company.id
      })
      .returning()
      .execute();

    const contact = contactResult[0];

    // Create the deal to be deleted
    const dealResult = await db.insert(dealsTable)
      .values({
        title: 'Test Deal',
        description: 'A deal for testing deletion',
        value: '50000.00',
        stage: 'Qualified',
        contact_id: contact.id,
        company_id: company.id,
        expected_close_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const deal = dealResult[0];

    // Delete the deal
    const result = await deleteDeal({ id: deal.id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify deal no longer exists in database
    const deletedDeals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, deal.id))
      .execute();

    expect(deletedDeals).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent deal', async () => {
    const result = await deleteDeal({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should handle deletion of deal with minimal data', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Minimal Company'
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create prerequisite contact with minimal data
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        company_id: company.id
      })
      .returning()
      .execute();

    const contact = contactResult[0];

    // Create deal with minimal required data
    const dealResult = await db.insert(dealsTable)
      .values({
        title: 'Minimal Deal',
        value: '1000.00',
        stage: 'New Lead',
        contact_id: contact.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const deal = dealResult[0];

    // Delete the deal
    const result = await deleteDeal({ id: deal.id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify deal no longer exists
    const deletedDeals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, deal.id))
      .execute();

    expect(deletedDeals).toHaveLength(0);
  });

  it('should not affect other deals when deleting one deal', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Multi Deal Company'
      })
      .returning()
      .execute();

    const company = companyResult[0];

    // Create prerequisite contact
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'Bob',
        last_name: 'Johnson',
        company_id: company.id
      })
      .returning()
      .execute();

    const contact = contactResult[0];

    // Create first deal
    const deal1Result = await db.insert(dealsTable)
      .values({
        title: 'First Deal',
        value: '10000.00',
        stage: 'Qualified',
        contact_id: contact.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const deal1 = deal1Result[0];

    // Create second deal
    const deal2Result = await db.insert(dealsTable)
      .values({
        title: 'Second Deal',
        value: '20000.00',
        stage: 'Proposal Sent',
        contact_id: contact.id,
        company_id: company.id
      })
      .returning()
      .execute();

    const deal2 = deal2Result[0];

    // Delete only the first deal
    const result = await deleteDeal({ id: deal1.id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify first deal is deleted
    const deletedDeals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, deal1.id))
      .execute();

    expect(deletedDeals).toHaveLength(0);

    // Verify second deal still exists
    const remainingDeals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, deal2.id))
      .execute();

    expect(remainingDeals).toHaveLength(1);
    expect(remainingDeals[0].title).toBe('Second Deal');
  });

  it('should handle deals with all possible stage values', async () => {
    // Create prerequisite company and contact
    const companyResult = await db.insert(companiesTable)
      .values({ name: 'Stage Test Company' })
      .returning()
      .execute();

    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'Stage',
        last_name: 'Tester',
        company_id: companyResult[0].id
      })
      .returning()
      .execute();

    const contact = contactResult[0];
    const company = companyResult[0];

    // Test each deal stage
    const stages = ['New Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'] as const;

    for (const stage of stages) {
      // Create deal with specific stage
      const dealResult = await db.insert(dealsTable)
        .values({
          title: `Deal in ${stage}`,
          value: '5000.00',
          stage: stage,
          contact_id: contact.id,
          company_id: company.id
        })
        .returning()
        .execute();

      const deal = dealResult[0];

      // Delete the deal
      const result = await deleteDeal({ id: deal.id });

      // Verify deletion was successful
      expect(result.success).toBe(true);

      // Verify deal is deleted
      const deletedDeals = await db.select()
        .from(dealsTable)
        .where(eq(dealsTable.id, deal.id))
        .execute();

      expect(deletedDeals).toHaveLength(0);
    }
  });
});