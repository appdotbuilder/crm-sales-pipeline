import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, contactsTable, dealsTable, tasksTable } from '../db/schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when it exists', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '555-0123',
        email: 'info@test.com',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '555-0456',
        job_title: 'Manager',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const deal = await db.insert(dealsTable)
      .values({
        title: 'Test Deal',
        description: 'A test deal',
        value: '10000.00',
        stage: 'New Lead',
        contact_id: contact[0].id,
        company_id: company[0].id,
        expected_close_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create test task
    const task = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        completed: false,
        due_date: new Date('2024-06-15'),
        contact_id: contact[0].id,
        company_id: company[0].id,
        deal_id: deal[0].id
      })
      .returning()
      .execute();

    const result = await getTask(task[0].id);

    // Verify task data
    expect(result).not.toBeNull();
    expect(result!.id).toBe(task[0].id);
    expect(result!.title).toBe('Test Task');
    expect(result!.description).toBe('A task for testing');
    expect(result!.completed).toBe(false);
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.contact_id).toBe(contact[0].id);
    expect(result!.company_id).toBe(company[0].id);
    expect(result!.deal_id).toBe(deal[0].id);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task does not exist', async () => {
    const result = await getTask(999);

    expect(result).toBeNull();
  });

  it('should handle task with minimal data', async () => {
    // Create task with only required fields
    const task = await db.insert(tasksTable)
      .values({
        title: 'Minimal Task',
        description: null,
        completed: false,
        due_date: null,
        contact_id: null,
        company_id: null,
        deal_id: null
      })
      .returning()
      .execute();

    const result = await getTask(task[0].id);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Minimal Task');
    expect(result!.description).toBeNull();
    expect(result!.completed).toBe(false);
    expect(result!.due_date).toBeNull();
    expect(result!.contact_id).toBeNull();
    expect(result!.company_id).toBeNull();
    expect(result!.deal_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle completed task', async () => {
    // Create completed task
    const task = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is done',
        completed: true,
        due_date: new Date('2024-01-15'),
        contact_id: null,
        company_id: null,
        deal_id: null
      })
      .returning()
      .execute();

    const result = await getTask(task[0].id);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Completed Task');
    expect(result!.completed).toBe(true);
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.due_date!.getFullYear()).toBe(2024);
  });

  it('should return task with correct date formatting', async () => {
    const specificDate = new Date('2024-07-04T14:30:00.000Z');
    
    const task = await db.insert(tasksTable)
      .values({
        title: 'Date Test Task',
        description: null,
        completed: false,
        due_date: specificDate,
        contact_id: null,
        company_id: null,
        deal_id: null
      })
      .returning()
      .execute();

    const result = await getTask(task[0].id);

    expect(result).not.toBeNull();
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.due_date).toEqual(specificDate);
  });
});