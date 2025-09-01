import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the deal stage enum
export const dealStageEnum = pgEnum('deal_stage', [
  'New Lead',
  'Qualified',
  'Proposal Sent', 
  'Negotiation',
  'Won',
  'Lost'
]);

// Companies table
export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  industry: text('industry'),
  website: text('website'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Contacts table
export const contactsTable = pgTable('contacts', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  job_title: text('job_title'),
  company_id: integer('company_id').references(() => companiesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Deals table
export const dealsTable = pgTable('deals', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  value: numeric('value', { precision: 15, scale: 2 }).notNull(),
  stage: dealStageEnum('stage').notNull(),
  contact_id: integer('contact_id').notNull().references(() => contactsTable.id),
  company_id: integer('company_id').notNull().references(() => companiesTable.id),
  expected_close_date: timestamp('expected_close_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  due_date: timestamp('due_date'),
  contact_id: integer('contact_id').references(() => contactsTable.id),
  company_id: integer('company_id').references(() => companiesTable.id),
  deal_id: integer('deal_id').references(() => dealsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const companiesRelations = relations(companiesTable, ({ many }) => ({
  contacts: many(contactsTable),
  deals: many(dealsTable),
  tasks: many(tasksTable),
}));

export const contactsRelations = relations(contactsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [contactsTable.company_id],
    references: [companiesTable.id],
  }),
  deals: many(dealsTable),
  tasks: many(tasksTable),
}));

export const dealsRelations = relations(dealsTable, ({ one, many }) => ({
  contact: one(contactsTable, {
    fields: [dealsTable.contact_id],
    references: [contactsTable.id],
  }),
  company: one(companiesTable, {
    fields: [dealsTable.company_id],
    references: [companiesTable.id],
  }),
  tasks: many(tasksTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  contact: one(contactsTable, {
    fields: [tasksTable.contact_id],
    references: [contactsTable.id],
  }),
  company: one(companiesTable, {
    fields: [tasksTable.company_id],
    references: [companiesTable.id],
  }),
  deal: one(dealsTable, {
    fields: [tasksTable.deal_id],
    references: [dealsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Company = typeof companiesTable.$inferSelect;
export type NewCompany = typeof companiesTable.$inferInsert;
export type Contact = typeof contactsTable.$inferSelect;
export type NewContact = typeof contactsTable.$inferInsert;
export type Deal = typeof dealsTable.$inferSelect;
export type NewDeal = typeof dealsTable.$inferInsert;
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  companies: companiesTable,
  contacts: contactsTable,
  deals: dealsTable,
  tasks: tasksTable,
};