import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type UpdateCompanyInput, type CreateCompanyInput } from '../schema';
import { updateCompany } from '../handlers/update_company';
import { eq } from 'drizzle-orm';

// Test input for creating a company first
const createTestInput: CreateCompanyInput = {
  name: 'Original Company',
  industry: 'Technology',
  website: 'https://original.com',
  phone: '123-456-7890',
  email: 'contact@original.com',
  address: '123 Original St'
};

describe('updateCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all company fields', async () => {
    // Create a company first
    const createResult = await db.insert(companiesTable)
      .values(createTestInput)
      .returning()
      .execute();

    const companyId = createResult[0].id;

    // Update all fields
    const updateInput: UpdateCompanyInput = {
      id: companyId,
      name: 'Updated Company',
      industry: 'Healthcare',
      website: 'https://updated.com',
      phone: '987-654-3210',
      email: 'new@updated.com',
      address: '456 Updated Ave'
    };

    const result = await updateCompany(updateInput);

    expect(result.id).toEqual(companyId);
    expect(result.name).toEqual('Updated Company');
    expect(result.industry).toEqual('Healthcare');
    expect(result.website).toEqual('https://updated.com');
    expect(result.phone).toEqual('987-654-3210');
    expect(result.email).toEqual('new@updated.com');
    expect(result.address).toEqual('456 Updated Ave');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create a company first
    const createResult = await db.insert(companiesTable)
      .values(createTestInput)
      .returning()
      .execute();

    const companyId = createResult[0].id;
    const originalCompany = createResult[0];

    // Update only name and email
    const updateInput: UpdateCompanyInput = {
      id: companyId,
      name: 'Partially Updated Company',
      email: 'partial@updated.com'
    };

    const result = await updateCompany(updateInput);

    expect(result.id).toEqual(companyId);
    expect(result.name).toEqual('Partially Updated Company');
    expect(result.email).toEqual('partial@updated.com');
    // Other fields should remain unchanged
    expect(result.industry).toEqual(originalCompany.industry);
    expect(result.website).toEqual(originalCompany.website);
    expect(result.phone).toEqual(originalCompany.phone);
    expect(result.address).toEqual(originalCompany.address);
    expect(result.updated_at > originalCompany.updated_at).toBe(true);
  });

  it('should set fields to null when explicitly provided', async () => {
    // Create a company first
    const createResult = await db.insert(companiesTable)
      .values(createTestInput)
      .returning()
      .execute();

    const companyId = createResult[0].id;

    // Update with null values
    const updateInput: UpdateCompanyInput = {
      id: companyId,
      industry: null,
      website: null,
      phone: null
    };

    const result = await updateCompany(updateInput);

    expect(result.id).toEqual(companyId);
    expect(result.industry).toBeNull();
    expect(result.website).toBeNull();
    expect(result.phone).toBeNull();
    // Name should remain unchanged since it wasn't in the update
    expect(result.name).toEqual(createTestInput.name);
    expect(result.email).toEqual(createTestInput.email);
    expect(result.address).toEqual(createTestInput.address);
  });

  it('should save updated company to database', async () => {
    // Create a company first
    const createResult = await db.insert(companiesTable)
      .values(createTestInput)
      .returning()
      .execute();

    const companyId = createResult[0].id;

    const updateInput: UpdateCompanyInput = {
      id: companyId,
      name: 'Database Updated Company',
      industry: 'Finance'
    };

    const result = await updateCompany(updateInput);

    // Verify in database
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .execute();

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toEqual('Database Updated Company');
    expect(companies[0].industry).toEqual('Finance');
    expect(companies[0].website).toEqual(createTestInput.website); // Unchanged
    expect(companies[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when company does not exist', async () => {
    const updateInput: UpdateCompanyInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent Company'
    };

    await expect(updateCompany(updateInput)).rejects.toThrow(/Company with id 999999 not found/i);
  });

  it('should update only the updated_at timestamp when no fields changed', async () => {
    // Create a company first
    const createResult = await db.insert(companiesTable)
      .values(createTestInput)
      .returning()
      .execute();

    const companyId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a small moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with only id (no other fields)
    const updateInput: UpdateCompanyInput = {
      id: companyId
    };

    const result = await updateCompany(updateInput);

    expect(result.id).toEqual(companyId);
    expect(result.name).toEqual(createTestInput.name);
    expect(result.industry).toEqual(createTestInput.industry);
    expect(result.website).toEqual(createTestInput.website);
    expect(result.phone).toEqual(createTestInput.phone);
    expect(result.email).toEqual(createTestInput.email);
    expect(result.address).toEqual(createTestInput.address);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});