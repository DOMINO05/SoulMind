import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, applicationSchema } from './schemas';

describe('Validation Schemas', () => {
  describe('Login Schema', () => {
    it('validates correct email and password', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'invalid-email', password: 'password123' });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' });
      expect(result.success).toBe(false);
    });
  });

  describe('Register Schema', () => {
    it('requires secret code', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        secretCode: ''
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Application Schema', () => {
    it('requires gdpr consent', () => {
      const result = applicationSchema.safeParse({
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '123456789',
        gdpr: false
      });
      expect(result.success).toBe(false);
    });

    it('validates correct form', () => {
      const result = applicationSchema.safeParse({
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '123456789',
        gdpr: true
      });
      expect(result.success).toBe(true);
    });
  });
});
