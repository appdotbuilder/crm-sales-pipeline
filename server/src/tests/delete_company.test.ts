import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, contactsTable, dealsTable, tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';
import { deleteCompany } from '../handlers/delete_company';

describe('deleteCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing company', async () => {
    // Create a test company
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '+1234567890',
        email: 'test@company.com',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: company[0].id
    };

    // Delete the company
    const result = await deleteCompany(input);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify company was deleted from database
    const deletedCompany = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, company[0].id))
      .execute();

    expect(deletedCompany).toHaveLength(0);
  });

  it('should throw error when company does not exist', async () => {
    const input: DeleteInput = {
      id: 999
    };

    // Attempt to delete non-existent company
    await expect(deleteCompany(input)).rejects.toThrow(/Company with id 999 not found/i);
  });

  it('should handle cascading deletes for related contacts', async () => {
    // Create a test company
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology'
      })
      .returning()
      .execute();

    // Create a contact linked to the company
    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: company[0].id
    };

    // Delete the company
    const result = await deleteCompany(input);

    expect(result.success).toBe(true);

    // Verify company was deleted
    const deletedCompany = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, company[0].id))
      .execute();

    expect(deletedCompany).toHaveLength(0);

    // Verify contact still exists but company_id is set to null
    const updatedContact = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, contact[0].id))
      .execute();

    expect(updatedContact).toHaveLength(1);
    expect(updatedContact[0].company_id).toBeNull();
  });

  it('should handle cascading deletes for related deals and tasks', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology'
      })
      .returning()
      .execute();

    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const deal = await db.insert(dealsTable)
      .values({
        title: 'Test Deal',
        description: 'A test deal',
        value: '10000.00', // Convert number to string for numeric column
        stage: 'New Lead',
        contact_id: contact[0].id,
        company_id: company[0].id,
        expected_close_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const task = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A test task',
        completed: false,
        due_date: new Date('2024-06-15'),
        contact_id: contact[0].id,
        company_id: company[0].id,
        deal_id: deal[0].id
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: company[0].id
    };

    // Delete the company
    const result = await deleteCompany(input);

    expect(result.success).toBe(true);

    // Verify company was deleted
    const deletedCompany = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, company[0].id))
      .execute();

    expect(deletedCompany).toHaveLength(0);

    // Verify deals related to the company were deleted
    const remainingDeals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, deal[0].id))
      .execute();

    expect(remainingDeals).toHaveLength(0);

    // Verify tasks related to the company were deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task[0].id))
      .execute();

    expect(remainingTasks).toHaveLength(0);

    // Verify contact still exists but company_id is set to null
    const updatedContact = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, contact[0].id))
      .execute();

    expect(updatedContact).toHaveLength(1);
    expect(updatedContact[0].company_id).toBeNull();
  });

  it('should handle deletion with minimal company data', async () => {
    // Create a company with only required fields
    const company = await db.insert(companiesTable)
      .values({
        name: 'Minimal Company'
        // All other fields are optional/nullable
      })
      .returning()
      .execute();

    const input: DeleteInput = {
      id: company[0].id
    };

    // Delete the company
    const result = await deleteCompany(input);

    expect(result.success).toBe(true);

    // Verify company was deleted
    const deletedCompany = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, company[0].id))
      .execute();

    expect(deletedCompany).toHaveLength(0);
  });
});