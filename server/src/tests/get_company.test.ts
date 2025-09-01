import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { getCompany } from '../handlers/get_company';

// Test company data
const testCompanyInput: CreateCompanyInput = {
  name: 'Test Company',
  industry: 'Technology',
  website: 'https://testcompany.com',
  phone: '+1-555-123-4567',
  email: 'info@testcompany.com',
  address: '123 Test Street, Test City, TC 12345'
};

describe('getCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing company', async () => {
    // Create a test company first
    const insertResult = await db.insert(companiesTable)
      .values(testCompanyInput)
      .returning()
      .execute();

    const createdCompany = insertResult[0];

    // Retrieve the company
    const result = await getCompany(createdCompany.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCompany.id);
    expect(result!.name).toEqual('Test Company');
    expect(result!.industry).toEqual('Technology');
    expect(result!.website).toEqual('https://testcompany.com');
    expect(result!.phone).toEqual('+1-555-123-4567');
    expect(result!.email).toEqual('info@testcompany.com');
    expect(result!.address).toEqual('123 Test Street, Test City, TC 12345');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent company', async () => {
    const result = await getCompany(999999);
    expect(result).toBeNull();
  });

  it('should retrieve company with minimal data', async () => {
    // Create a company with only required fields
    const minimalCompanyInput: CreateCompanyInput = {
      name: 'Minimal Company',
      industry: null,
      website: null,
      phone: null,
      email: null,
      address: null
    };

    const insertResult = await db.insert(companiesTable)
      .values(minimalCompanyInput)
      .returning()
      .execute();

    const createdCompany = insertResult[0];

    // Retrieve the company
    const result = await getCompany(createdCompany.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCompany.id);
    expect(result!.name).toEqual('Minimal Company');
    expect(result!.industry).toBeNull();
    expect(result!.website).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.email).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve correct company when multiple exist', async () => {
    // Create multiple companies
    const company1Input: CreateCompanyInput = {
      name: 'Company One',
      industry: 'Healthcare',
      website: 'https://company1.com',
      phone: '+1-555-111-1111',
      email: 'info@company1.com',
      address: '111 First Street'
    };

    const company2Input: CreateCompanyInput = {
      name: 'Company Two',
      industry: 'Finance',
      website: 'https://company2.com',
      phone: '+1-555-222-2222',
      email: 'info@company2.com',
      address: '222 Second Street'
    };

    const insertResult1 = await db.insert(companiesTable)
      .values(company1Input)
      .returning()
      .execute();

    const insertResult2 = await db.insert(companiesTable)
      .values(company2Input)
      .returning()
      .execute();

    const createdCompany1 = insertResult1[0];
    const createdCompany2 = insertResult2[0];

    // Retrieve the second company specifically
    const result = await getCompany(createdCompany2.id);

    // Verify we got the correct company
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCompany2.id);
    expect(result!.name).toEqual('Company Two');
    expect(result!.industry).toEqual('Finance');
    expect(result!.website).toEqual('https://company2.com');
    expect(result!.phone).toEqual('+1-555-222-2222');
    expect(result!.email).toEqual('info@company2.com');
    expect(result!.address).toEqual('222 Second Street');

    // Verify it's not the first company
    expect(result!.id).not.toEqual(createdCompany1.id);
    expect(result!.name).not.toEqual('Company One');
  });
});