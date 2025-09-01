import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, companiesTable, contactsTable, dealsTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
  });

  it('should return all tasks when tasks exist', async () => {
    // Create a company first (for foreign key relationships)
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com',
        phone: '+1-555-0123',
        email: 'test@company.com',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const companyId = companyResult[0].id;

    // Create a contact (for foreign key relationships)
    const contactResult = await db.insert(contactsTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '+1-555-0124',
        job_title: 'Manager',
        company_id: companyId
      })
      .returning()
      .execute();

    const contactId = contactResult[0].id;

    // Create a deal (for foreign key relationships)
    const dealResult = await db.insert(dealsTable)
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

    const dealId = dealResult[0].id;

    // Create test tasks with different configurations
    await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First test task',
          completed: false,
          due_date: new Date('2024-12-01'),
          contact_id: contactId,
          company_id: companyId,
          deal_id: dealId
        },
        {
          title: 'Task 2',
          description: null,
          completed: true,
          due_date: null,
          contact_id: null,
          company_id: null,
          deal_id: null
        },
        {
          title: 'Task 3',
          description: 'Third test task',
          completed: false,
          due_date: new Date('2024-11-15'),
          contact_id: contactId,
          company_id: null,
          deal_id: null
        }
      ])
      .execute();

    const result = await getTasks();

    // Verify we get all tasks
    expect(result).toHaveLength(3);

    // Verify task structure and field types
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(typeof task.title).toBe('string');
      expect(typeof task.completed).toBe('boolean');
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific task data
    const task1 = result.find(t => t.title === 'Task 1');
    expect(task1).toBeDefined();
    expect(task1!.description).toBe('First test task');
    expect(task1!.completed).toBe(false);
    expect(task1!.due_date).toBeInstanceOf(Date);
    expect(task1!.contact_id).toBe(contactId);
    expect(task1!.company_id).toBe(companyId);
    expect(task1!.deal_id).toBe(dealId);

    const task2 = result.find(t => t.title === 'Task 2');
    expect(task2).toBeDefined();
    expect(task2!.description).toBeNull();
    expect(task2!.completed).toBe(true);
    expect(task2!.due_date).toBeNull();
    expect(task2!.contact_id).toBeNull();
    expect(task2!.company_id).toBeNull();
    expect(task2!.deal_id).toBeNull();

    const task3 = result.find(t => t.title === 'Task 3');
    expect(task3).toBeDefined();
    expect(task3!.description).toBe('Third test task');
    expect(task3!.completed).toBe(false);
    expect(task3!.due_date).toBeInstanceOf(Date);
    expect(task3!.contact_id).toBe(contactId);
    expect(task3!.company_id).toBeNull();
    expect(task3!.deal_id).toBeNull();
  });

  it('should return tasks ordered by creation time', async () => {
    // Create tasks with slight delays to ensure different timestamps
    await db.insert(tasksTable)
      .values({
        title: 'First Task',
        description: 'Created first',
        completed: false,
        due_date: null,
        contact_id: null,
        company_id: null,
        deal_id: null
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({
        title: 'Second Task',
        description: 'Created second',
        completed: false,
        due_date: null,
        contact_id: null,
        company_id: null,
        deal_id: null
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Tasks should be returned in the order they were created
    const firstTask = result.find(t => t.title === 'First Task');
    const secondTask = result.find(t => t.title === 'Second Task');
    
    expect(firstTask).toBeDefined();
    expect(secondTask).toBeDefined();
    expect(firstTask!.created_at.getTime()).toBeLessThanOrEqual(secondTask!.created_at.getTime());
  });
});