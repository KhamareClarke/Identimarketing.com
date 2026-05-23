import { z } from 'zod';

export const clientStatusEnum = z.enum(['lead', 'active', 'paused', 'churned']);

export const clientInputSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  industry: z.string().max(120).optional().nullable(),
  contact_name: z.string().max(200).optional().nullable(),
  contact_email: z.string().email('Invalid contact email'),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  budget: z.coerce.number().min(0).default(0),
  status: clientStatusEnum.default('active'),
  notes: z.string().max(5000).optional().nullable(),
});

export type ClientInput = z.infer<typeof clientInputSchema>;

export const clientUpdateSchema = clientInputSchema.partial();
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;
