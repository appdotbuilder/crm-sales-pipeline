import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCompanyInputSchema,
  updateCompanyInputSchema,
  deleteInputSchema,
  createContactInputSchema,
  updateContactInputSchema,
  createDealInputSchema,
  updateDealInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
} from './schema';

// Import handlers
// Company handlers
import { createCompany } from './handlers/create_company';
import { getCompanies } from './handlers/get_companies';
import { getCompany } from './handlers/get_company';
import { updateCompany } from './handlers/update_company';
import { deleteCompany } from './handlers/delete_company';

// Contact handlers
import { createContact } from './handlers/create_contact';
import { getContacts } from './handlers/get_contacts';
import { getContact } from './handlers/get_contact';
import { updateContact } from './handlers/update_contact';
import { deleteContact } from './handlers/delete_contact';

// Deal handlers
import { createDeal } from './handlers/create_deal';
import { getDeals } from './handlers/get_deals';
import { getDeal } from './handlers/get_deal';
import { updateDeal } from './handlers/update_deal';
import { deleteDeal } from './handlers/delete_deal';

// Task handlers
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { getTask } from './handlers/get_task';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Company routes
  createCompany: publicProcedure
    .input(createCompanyInputSchema)
    .mutation(({ input }) => createCompany(input)),
  
  getCompanies: publicProcedure
    .query(() => getCompanies()),
  
  getCompany: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCompany(input.id)),
  
  updateCompany: publicProcedure
    .input(updateCompanyInputSchema)
    .mutation(({ input }) => updateCompany(input)),
  
  deleteCompany: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteCompany(input)),

  // Contact routes
  createContact: publicProcedure
    .input(createContactInputSchema)
    .mutation(({ input }) => createContact(input)),
  
  getContacts: publicProcedure
    .query(() => getContacts()),
  
  getContact: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getContact(input.id)),
  
  updateContact: publicProcedure
    .input(updateContactInputSchema)
    .mutation(({ input }) => updateContact(input)),
  
  deleteContact: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteContact(input)),

  // Deal routes
  createDeal: publicProcedure
    .input(createDealInputSchema)
    .mutation(({ input }) => createDeal(input)),
  
  getDeals: publicProcedure
    .query(() => getDeals()),
  
  getDeal: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getDeal(input.id)),
  
  updateDeal: publicProcedure
    .input(updateDealInputSchema)
    .mutation(({ input }) => updateDeal(input)),
  
  deleteDeal: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteDeal(input)),

  // Task routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  
  getTasks: publicProcedure
    .query(() => getTasks()),
  
  getTask: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getTask(input.id)),
  
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  
  deleteTask: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteTask(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();