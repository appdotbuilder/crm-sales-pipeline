import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, companiesTable, contactsTable, dealsTable } from '../db/schema';
import { type DeleteInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for deleting a task
const deleteInput: DeleteInput = {
  id: 1
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '555-0123',
        email: 'test@company.com',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const contact = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
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
        stage: 'Qualified',
        contact_id: contact[0].id,
        company_id: company[0].id,
        expected_close_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create the task to be deleted
    const task = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing deletion',
        completed: false,
        due_date: new Date('2024-06-01'),
        contact_id: contact[0].id,
        company_id: company[0].id,
        deal_id: deal[0].id
      })
      .returning()
      .execute();

    // Delete the task
    const result = await deleteTask({ id: task[0].id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify task no longer exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task[0].id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should delete a task with minimal data (nulls)', async () => {
    // Create a minimal task with nullable fields
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

    // Delete the task
    const result = await deleteTask({ id: task[0].id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify task no longer exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task[0].id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should handle deletion of non-existent task gracefully', async () => {
    // Attempt to delete a task that doesn't exist
    const result = await deleteTask({ id: 99999 });

    // Should still return success (DELETE operations are idempotent)
    expect(result.success).toBe(true);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        completed: false,
        due_date: null,
        contact_id: null,
        company_id: null,
        deal_id: null
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        completed: true,
        due_date: null,
        contact_id: null,
        company_id: null,
        deal_id: null
      })
      .returning()
      .execute();

    // Delete only the first task
    const result = await deleteTask({ id: task1[0].id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify only the first task was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].id).toBe(task2[0].id);
    expect(remainingTasks[0].title).toBe('Task 2');
  });

  it('should delete completed task successfully', async () => {
    // Create a completed task
    const task = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is done',
        completed: true,
        due_date: new Date('2024-01-01'),
        contact_id: null,
        company_id: null,
        deal_id: null
      })
      .returning()
      .execute();

    // Delete the completed task
    const result = await deleteTask({ id: task[0].id });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify task no longer exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task[0].id))
      .execute();

    expect(tasks).toHaveLength(0);
  });
});