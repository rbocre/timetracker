import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Project Validators', () => {
  let createProjectSchema: typeof import('../src/modules/projects/projects.validator').createProjectSchema;
  let updateProjectSchema: typeof import('../src/modules/projects/projects.validator').updateProjectSchema;

  beforeAll(async () => {
    const mod = await import('../src/modules/projects/projects.validator.js');
    createProjectSchema = mod.createProjectSchema;
    updateProjectSchema = mod.updateProjectSchema;
  });

  describe('createProjectSchema', () => {
    it('should validate a correct project input', () => {
      const input = {
        name: 'Website Redesign',
        description: 'Complete redesign',
        color: '#3B82F6',
        hourlyRate: 150,
      };

      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty project name', () => {
      const input = { name: '' };

      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid hex color', () => {
      const input = {
        name: 'Test Project',
        color: 'red',
      };

      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject negative hourly rate', () => {
      const input = {
        name: 'Test Project',
        hourlyRate: -10,
      };

      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should default color to blue', () => {
      const input = { name: 'Test Project' };

      const result = createProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#3B82F6');
      }
    });
  });

  describe('updateProjectSchema', () => {
    it('should allow partial update', () => {
      const input = { name: 'Updated Name' };

      const result = updateProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should allow isActive field', () => {
      const input = { isActive: false };

      const result = updateProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
