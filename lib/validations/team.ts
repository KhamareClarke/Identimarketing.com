import { z } from 'zod';

export const teamRoleEnum = z.enum(['admin', 'manager', 'designer', 'developer', 'strategist', 'member']);

export const teamMemberInputSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  role: teamRoleEnum.default('member'),
  specialties: z.array(z.string().min(1)).optional().default([]),
  phone: z.string().max(50).optional().nullable(),
});
export type TeamMemberInput = z.infer<typeof teamMemberInputSchema>;

export const teamMemberUpdateSchema = teamMemberInputSchema.partial().extend({
  status: z.enum(['invited', 'active', 'inactive']).optional(),
});
export type TeamMemberUpdate = z.infer<typeof teamMemberUpdateSchema>;
