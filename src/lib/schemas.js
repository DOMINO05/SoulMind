import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Érvénytelen email cím'),
  password: z.string().min(6, 'A jelszónak legalább 6 karakternek kell lennie'),
});

// Register Schema
export const registerSchema = z.object({
  email: z.string().email('Érvénytelen email cím'),
  password: z.string().min(8, 'A jelszónak legalább 8 karakternek kell lennie'),
  secretCode: z.string().min(1, 'Az adminisztrátori jelszó kötelező'),
});

// Application Schema
export const applicationSchema = z.object({
  full_name: z.string().min(3, 'A névnek legalább 3 karakternek kell lennie'),
  email: z.string().email('Érvénytelen email cím'),
  phone: z.string().min(9, 'A telefonszám túl rövid'), // Basic length check
  interests: z.string().optional(),
  gdpr: z.literal(true, {
    errorMap: () => ({ message: 'Az adatkezelési tájékoztató elfogadása kötelező' }),
  }),
});
