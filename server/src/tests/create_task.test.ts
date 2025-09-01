import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, companiesTable, contactsTable, dealsTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs
const basicTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  completed: false,
  due_date: new Date('2024-12-31'),
  contact_id: null,
  company_id: null,
  deal_id: null
};

const minimalTaskInput: CreateTaskInput = {
  title: 'Minimal Task',
  description: null,
  completed: true,
  due_date: null,
  contact_id: null,
  company_id: null,
  deal_id: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a basic task', async () => {
    const result = await createTask(basicTaskInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.contact_id).toBeNull();
    expect(result.company_id).toBeNull();
    expect(result.deal_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a minimal task with null values', async () => {
    const result = await createTask(minimalTaskInput);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(true);
    expect(result.due_date).toBeNull();
    expect(result.contact_id).toBeNull();
    expect(result.company_id).toBeNull();
    expect(result.deal_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(basicTaskInput);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].due_date).toEqual(new Date('2024-12-31'));
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create task with valid foreign key references', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
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

    const [contact] = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: null,
        job_title: 'Manager',
        company_id: company.id
      })
      .returning()
      .execute();

    const [deal] = await db.insert(dealsTable)
      .values({
        title: 'Test Deal',
        description: 'A deal for testing',
        value: '50000.00',
        stage: 'Qualified',
        contact_id: contact.id,
        company_id: company.id,
        expected_close_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create task with foreign key references
    const taskWithReferences: CreateTaskInput = {
      title: 'Task with References',
      description: 'Task linked to company, contact, and deal',
      completed: false,
      due_date: new Date('2024-11-30'),
      contact_id: contact.id,
      company_id: company.id,
      deal_id: deal.id
    };

    const result = await createTask(taskWithReferences);

    expect(result.title).toEqual('Task with References');
    expect(result.contact_id).toEqual(contact.id);
    expect(result.company_id).toEqual(company.id);
    expect(result.deal_id).toEqual(deal.id);

    // Verify task is saved with correct references
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].contact_id).toEqual(contact.id);
    expect(tasks[0].company_id).toEqual(company.id);
    expect(tasks[0].deal_id).toEqual(deal.id);
  });

  it('should handle completed field default correctly', async () => {
    // Input without completed field should use default from Zod schema
    const inputWithoutCompleted: CreateTaskInput = {
      title: 'Task Without Completed',
      description: null,
      completed: false, // Zod default will be applied
      due_date: null,
      contact_id: null,
      company_id: null,
      deal_id: null
    };

    const result = await createTask(inputWithoutCompleted);

    expect(result.completed).toEqual(false);
  });

  it('should create tasks with different due dates', async () => {
    // Future due date
    const futureTask: CreateTaskInput = {
      title: 'Future Task',
      description: 'Task due in the future',
      completed: false,
      due_date: new Date('2025-06-15'),
      contact_id: null,
      company_id: null,
      deal_id: null
    };

    // Past due date
    const pastTask: CreateTaskInput = {
      title: 'Past Task',
      description: 'Task that was due in the past',
      completed: true,
      due_date: new Date('2023-01-01'),
      contact_id: null,
      company_id: null,
      deal_id: null
    };

    const futureResult = await createTask(futureTask);
    const pastResult = await createTask(pastTask);

    expect(futureResult.due_date).toEqual(new Date('2025-06-15'));
    expect(pastResult.due_date).toEqual(new Date('2023-01-01'));
    expect(futureResult.completed).toEqual(false);
    expect(pastResult.completed).toEqual(true);
  });
});