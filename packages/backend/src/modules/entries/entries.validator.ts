import { z } from 'zod';

export const createEntrySchema = z.object({
  description: z.string().max(500).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().int().min(0).optional(),
  date: z.string().datetime(),
  projectId: z.string().uuid(),
});

export const updateEntrySchema = createEntrySchema.partial();

export const timerStartSchema = z.object({
  projectId: z.string().uuid(),
  description: z.string().max(500).optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type TimerStartInput = z.infer<typeof timerStartSchema>;
