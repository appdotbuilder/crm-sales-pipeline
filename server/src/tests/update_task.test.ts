import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, companiesTable, contactsTable, dealsTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let contactId: number;
  let dealId: number;
  let taskId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
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
    companyId = company[0].id;

    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone: '123-456-7890',
        job_title: 'Manager',
        company_id: companyId
      })
      .returning()
      .execute();
    contactId = contact[0].id;

    const deal = await db.insert(dealsTable)
      .values({
        title: 'Test Deal',
        description: 'A test deal',
        value: '10000.00',
        stage: 'New Lead',
        contact_id: contactId,
        company_id: companyId,
        expected_close_date: new Date('2024-12-31')
      })
      .returning()
      .execute();
    dealId = deal[0].id;

    // Create initial task
    const task = await db.insert(tasksTable)
      .values({
        title: 'Initial Task',
        description: 'Initial description',
        completed: false,
        due_date: new Date('2024-06-01'),
        contact_id: contactId,
        company_id: companyId,
        deal_id: dealId
      })
      .returning()
      .execute();
    taskId = task[0].id;
  });

  it('should update task title', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Initial description'); // Should remain unchanged
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Multi-Updated Task',
      description: 'Updated description',
      completed: true,
      due_date: new Date('2024-07-01')
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Multi-Updated Task');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.due_date).toEqual(new Date('2024-07-01'));
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update foreign key relationships', async () => {
    // Create another company and contact for testing updates
    const newCompany = await db.insert(companiesTable)
      .values({
        name: 'New Company',
        industry: 'Finance'
      })
      .returning()
      .execute();

    const newContact = await db.insert(contactsTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        company_id: newCompany[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: taskId,
      contact_id: newContact[0].id,
      company_id: newCompany[0].id
    };

    const result = await updateTask(updateInput);

    expect(result.contact_id).toEqual(newContact[0].id);
    expect(result.company_id).toEqual(newCompany[0].id);
    expect(result.deal_id).toEqual(dealId); // Should remain unchanged
  });

  it('should set nullable fields to null', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      description: null,
      due_date: null,
      contact_id: null,
      company_id: null,
      deal_id: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.contact_id).toBeNull();
    expect(result.company_id).toBeNull();
    expect(result.deal_id).toBeNull();
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Database Test Task',
      completed: true
    };

    await updateTask(updateInput);

    // Verify changes were persisted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Test Task');
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only update provided fields', async () => {
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Only completed should change
    expect(result.title).toEqual(originalTask[0].title);
    expect(result.description).toEqual(originalTask[0].description);
    expect(result.completed).toEqual(true); // This should change
    expect(result.due_date).toEqual(originalTask[0].due_date);
    expect(result.contact_id).toEqual(originalTask[0].contact_id);
    expect(result.company_id).toEqual(originalTask[0].company_id);
    expect(result.deal_id).toEqual(originalTask[0].deal_id);
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999,
      title: 'Non-existent Task'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });

  it('should update timestamp correctly', async () => {
    const beforeUpdate = new Date();
    
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Timestamp Test'
    };

    const result = await updateTask(updateInput);
    const afterUpdate = new Date();

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at >= beforeUpdate).toBe(true);
    expect(result.updated_at <= afterUpdate).toBe(true);
  });
});