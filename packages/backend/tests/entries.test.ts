import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Entry Validators', () => {
  let createEntrySchema: typeof import('../src/modules/entries/entries.validator').createEntrySchema;
  let timerStartSchema: typeof import('../src/modules/entries/entries.validator').timerStartSchema;

  beforeAll(async () => {
    const mod = await import('../src/modules/entries/entries.validator.js');
    createEntrySchema = mod.createEntrySchema;
    timerStartSchema = mod.timerStartSchema;
  });

  describe('createEntrySchema', () => {
    it('should validate a correct entry input', () => {
      const input = {
        description: 'Working on feature X',
        startTime: '2024-01-15T09:00:00.000Z',
        endTime: '2024-01-15T17:00:00.000Z',
        duration: 480,
        date: '2024-01-15T00:00:00.000Z',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should allow entry without endTime (running timer)', () => {
      const input = {
        startTime: '2024-01-15T09:00:00.000Z',
        date: '2024-01-15T00:00:00.000Z',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject missing projectId', () => {
      const input = {
        startTime: '2024-01-15T09:00:00.000Z',
        date: '2024-01-15T00:00:00.000Z',
      };

      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid projectId format', () => {
      const input = {
        startTime: '2024-01-15T09:00:00.000Z',
        date: '2024-01-15T00:00:00.000Z',
        projectId: 'not-a-uuid',
      };

      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('timerStartSchema', () => {
    it('should validate timer start input', () => {
      const input = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Starting work',
      };

      const result = timerStartSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should allow timer start without description', () => {
      const input = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = timerStartSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
