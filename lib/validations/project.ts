import { z } from 'zod';

export const projectStatusEnum = z.enum([
  'planning',
  'active',
  'in_review',
  'completed',
  'closed',
  'cancelled',
]);

export const projectInputSchema = z.object({
  client_id: z.string().uuid('Select a client'),
  service_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(5000).optional().nullable(),
  service_type: z.string().max(120).optional().nullable(),
  status: projectStatusEnum.default('planning'),
  budget: z.coerce.number().min(0).default(0),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectUpdateSchema = projectInputSchema.partial().extend({
  spent: z.coerce.number().min(0).optional(),
});
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

export const deliverableStatusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'under_review',
  'approved',
  'rejected',
]);

export const deliverableInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  status: deliverableStatusEnum.default('pending'),
  due_date: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  file_urls: z.array(z.string().url()).optional(),
});
export type DeliverableInput = z.infer<typeof deliverableInputSchema>;

export const deliverableUpdateSchema = deliverableInputSchema.partial();
export type DeliverableUpdate = z.infer<typeof deliverableUpdateSchema>;
