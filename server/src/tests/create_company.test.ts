import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { createCompany } from '../handlers/create_company';
import { eq } from 'drizzle-orm';

// Test input with all fields
const fullTestInput: CreateCompanyInput = {
  name: 'Acme Corporation',
  industry: 'Technology',
  website: 'https://acme.com',
  phone: '+1-555-123-4567',
  email: 'contact@acme.com',
  address: '123 Main St, San Francisco, CA 94105'
};

// Test input with minimal required fields
const minimalTestInput: CreateCompanyInput = {
  name: 'Minimal Corp',
  industry: null,
  website: null,
  phone: null,
  email: null,
  address: null
};

describe('createCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a company with all fields', async () => {
    const result = await createCompany(fullTestInput);

    // Basic field validation
    expect(result.name).toEqual('Acme Corporation');
    expect(result.industry).toEqual('Technology');
    expect(result.website).toEqual('https://acme.com');
    expect(result.phone).toEqual('+1-555-123-4567');
    expect(result.email).toEqual('contact@acme.com');
    expect(result.address).toEqual('123 Main St, San Francisco, CA 94105');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a company with minimal required fields', async () => {
    const result = await createCompany(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Corp');
    expect(result.industry).toBeNull();
    expect(result.website).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save company to database', async () => {
    const result = await createCompany(fullTestInput);

    // Query using proper drizzle syntax
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, result.id))
      .execute();

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toEqual('Acme Corporation');
    expect(companies[0].industry).toEqual('Technology');
    expect(companies[0].website).toEqual('https://acme.com');
    expect(companies[0].phone).toEqual('+1-555-123-4567');
    expect(companies[0].email).toEqual('contact@acme.com');
    expect(companies[0].address).toEqual('123 Main St, San Francisco, CA 94105');
    expect(companies[0].created_at).toBeInstanceOf(Date);
    expect(companies[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle companies with valid email format', async () => {
    const emailTestInput: CreateCompanyInput = {
      name: 'Email Test Corp',
      industry: null,
      website: null,
      phone: null,
      email: 'valid@email.com',
      address: null
    };

    const result = await createCompany(emailTestInput);

    expect(result.email).toEqual('valid@email.com');
    expect(result.name).toEqual('Email Test Corp');
    expect(result.id).toBeDefined();
  });

  it('should create multiple companies successfully', async () => {
    // Create first company
    const firstResult = await createCompany(fullTestInput);
    
    // Create second company
    const secondInput: CreateCompanyInput = {
      name: 'Second Company',
      industry: 'Manufacturing',
      website: 'https://second.com',
      phone: '+1-555-987-6543',
      email: 'info@second.com',
      address: '456 Oak Ave, New York, NY 10001'
    };
    const secondResult = await createCompany(secondInput);

    // Verify both companies exist and have unique IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.name).toEqual('Acme Corporation');
    expect(secondResult.name).toEqual('Second Company');

    // Verify both are saved in database
    const allCompanies = await db.select()
      .from(companiesTable)
      .execute();

    expect(allCompanies).toHaveLength(2);
    expect(allCompanies.some(c => c.name === 'Acme Corporation')).toBe(true);
    expect(allCompanies.some(c => c.name === 'Second Company')).toBe(true);
  });
});