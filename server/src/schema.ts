import { z } from 'zod';

// Deal stages enum
export const dealStageSchema = z.enum([
  'New Lead',
  'Qualified', 
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
]);

export type DealStage = z.infer<typeof dealStageSchema>;

// Company schemas
export const companySchema = z.object({
  id: z.number(),
  name: z.string(),
  industry: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Company = z.infer<typeof companySchema>;

export const createCompanyInputSchema = z.object({
  name: z.string().min(1),
  industry: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable()
});

export type CreateCompanyInput = z.infer<typeof createCompanyInputSchema>;

export const updateCompanyInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  industry: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateCompanyInput = z.infer<typeof updateCompanyInputSchema>;

// Contact schemas
export const contactSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  job_title: z.string().nullable(),
  company_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Contact = z.infer<typeof contactSchema>;

export const createContactInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  job_title: z.string().nullable(),
  company_id: z.number().nullable()
});

export type CreateContactInput = z.infer<typeof createContactInputSchema>;

export const updateContactInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
  company_id: z.number().nullable().optional()
});

export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;

// Deal schemas
export const dealSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  value: z.number(),
  stage: dealStageSchema,
  contact_id: z.number(),
  company_id: z.number(),
  expected_close_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Deal = z.infer<typeof dealSchema>;

export const createDealInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  value: z.number().nonnegative(),
  stage: dealStageSchema,
  contact_id: z.number(),
  company_id: z.number(),
  expected_close_date: z.coerce.date().nullable()
});

export type CreateDealInput = z.infer<typeof createDealInputSchema>;

export const updateDealInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  value: z.number().nonnegative().optional(),
  stage: dealStageSchema.optional(),
  contact_id: z.number().optional(),
  company_id: z.number().optional(),
  expected_close_date: z.coerce.date().nullable().optional()
});

export type UpdateDealInput = z.infer<typeof updateDealInputSchema>;

// Task schemas
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  due_date: z.coerce.date().nullable(),
  contact_id: z.number().nullable(),
  company_id: z.number().nullable(),
  deal_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  completed: z.boolean().default(false),
  due_date: z.coerce.date().nullable(),
  contact_id: z.number().nullable(),
  company_id: z.number().nullable(),
  deal_id: z.number().nullable()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  due_date: z.coerce.date().nullable().optional(),
  contact_id: z.number().nullable().optional(),
  company_id: z.number().nullable().optional(),
  deal_id: z.number().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Generic delete input schema
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;