import { z } from 'zod';
import { emailSchema } from './common';

// Supabase (bcrypt) ignora lo que pase de 72 caracteres: mejor avisar.
export const passwordSchema = z
  .string({ error: 'Escribe una contraseña.' })
  .min(10, 'Mínimo 10 caracteres. Más corta que eso la adivina hasta tu ex.')
  .max(72, 'Máximo 72 caracteres.')
  .regex(/\p{L}/u, 'Incluye al menos una letra.')
  .regex(/\d/, 'Incluye al menos un número.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Escribe tu contraseña.' })
    .min(1, 'Escribe tu contraseña.')
    .max(72, 'Máximo 72 caracteres.'),
});

export const registerSchema = z
  .object({
    name: z
      .string({ error: 'Dinos cómo te llamas.' })
      .trim()
      .min(1, 'Dinos cómo te llamas.')
      .max(60, 'Máximo 60 caracteres.'),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string({ error: 'Repite la contraseña.' }),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    error: 'Las contraseñas no coinciden.',
  });

export const recoverSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string({ error: 'Repite la contraseña.' }),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    error: 'Las contraseñas no coinciden.',
  });
