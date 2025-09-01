import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { getCompanies } from '../handlers/get_companies';

// Test data for creating companies
const testCompany1: CreateCompanyInput = {
  name: 'Acme Corporation',
  industry: 'Technology',
  website: 'https://acme.com',
  phone: '+1-555-0123',
  email: 'contact@acme.com',
  address: '123 Tech Street, San Francisco, CA'
};

const testCompany2: CreateCompanyInput = {
  name: 'Beta Industries',
  industry: 'Manufacturing',
  website: 'https://beta-industries.com',
  phone: '+1-555-0456',
  email: 'info@beta-industries.com',
  address: '456 Industrial Ave, Detroit, MI'
};

const testCompany3: CreateCompanyInput = {
  name: 'Gamma Solutions',
  industry: null,
  website: null,
  phone: null,
  email: null,
  address: null
};

describe('getCompanies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no companies exist', async () => {
    const result = await getCompanies();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return single company', async () => {
    // Create test company
    await db.insert(companiesTable)
      .values({
        name: testCompany1.name,
        industry: testCompany1.industry,
        website: testCompany1.website,
        phone: testCompany1.phone,
        email: testCompany1.email,
        address: testCompany1.address
      })
      .execute();

    const result = await getCompanies();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Acme Corporation');
    expect(result[0].industry).toEqual('Technology');
    expect(result[0].website).toEqual('https://acme.com');
    expect(result[0].phone).toEqual('+1-555-0123');
    expect(result[0].email).toEqual('contact@acme.com');
    expect(result[0].address).toEqual('123 Tech Street, San Francisco, CA');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple companies', async () => {
    // Create multiple test companies
    await db.insert(companiesTable)
      .values([
        {
          name: testCompany1.name,
          industry: testCompany1.industry,
          website: testCompany1.website,
          phone: testCompany1.phone,
          email: testCompany1.email,
          address: testCompany1.address
        },
        {
          name: testCompany2.name,
          industry: testCompany2.industry,
          website: testCompany2.website,
          phone: testCompany2.phone,
          email: testCompany2.email,
          address: testCompany2.address
        }
      ])
      .execute();

    const result = await getCompanies();

    expect(result).toHaveLength(2);
    
    // Check first company
    const acme = result.find(company => company.name === 'Acme Corporation');
    expect(acme).toBeDefined();
    expect(acme!.industry).toEqual('Technology');
    expect(acme!.website).toEqual('https://acme.com');
    
    // Check second company  
    const beta = result.find(company => company.name === 'Beta Industries');
    expect(beta).toBeDefined();
    expect(beta!.industry).toEqual('Manufacturing');
    expect(beta!.website).toEqual('https://beta-industries.com');
    
    // Verify all companies have required fields
    result.forEach(company => {
      expect(company.id).toBeDefined();
      expect(company.name).toBeDefined();
      expect(company.created_at).toBeInstanceOf(Date);
      expect(company.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle companies with null fields', async () => {
    // Create company with null fields
    await db.insert(companiesTable)
      .values({
        name: testCompany3.name,
        industry: testCompany3.industry,
        website: testCompany3.website,
        phone: testCompany3.phone,
        email: testCompany3.email,
        address: testCompany3.address
      })
      .execute();

    const result = await getCompanies();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Gamma Solutions');
    expect(result[0].industry).toBeNull();
    expect(result[0].website).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return companies in creation order', async () => {
    // Create companies in specific order
    const company1 = await db.insert(companiesTable)
      .values({
        name: 'First Company',
        industry: 'Tech',
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    const company2 = await db.insert(companiesTable)
      .values({
        name: 'Second Company',
        industry: 'Finance',
        website: null,
        phone: null,
        email: null,
        address: null
      })
      .returning()
      .execute();

    const result = await getCompanies();

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(company1[0].id);
    expect(result[1].id).toEqual(company2[0].id);
    expect(result[0].name).toEqual('First Company');
    expect(result[1].name).toEqual('Second Company');
  });
});