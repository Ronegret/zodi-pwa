import { describe, expect, it } from 'vitest';
import { loginSchema, newPasswordSchema, registerSchema } from '@/lib/validation/auth';
import { chartRequestSchema } from '@/lib/validation/chart';
import { fieldErrors, formToObject } from '@/lib/validation/common';
import { onboardingSchema, profileUpdateSchema } from '@/lib/validation/profile';

const errorsOf = (result: { success: boolean; error?: unknown }) =>
  result.success ? {} : fieldErrors(result.error as Parameters<typeof fieldErrors>[0]);

describe('auth', () => {
  it('normaliza el correo y exige contraseña', () => {
    const ok = loginSchema.parse({ email: '  Ana@Example.COM ', password: 'x' });
    expect(ok.email).toBe('ana@example.com');
    expect(errorsOf(loginSchema.safeParse({ email: 'no-es-correo', password: '' }))).toEqual({
      email: expect.stringMatching(/correo/),
      password: 'Escribe tu contraseña.',
    });
  });

  it('registro: contraseña robusta y confirmación', () => {
    const base = { name: 'Ana', email: 'ana@example.com' };
    expect(
      errorsOf(registerSchema.safeParse({ ...base, password: 'corta1', confirm: 'corta1' }))
        .password,
    ).toMatch(/10 caracteres/);
    expect(
      errorsOf(
        registerSchema.safeParse({
          ...base,
          password: 'sololetrasaqui',
          confirm: 'sololetrasaqui',
        }),
      ).password,
    ).toMatch(/número/);
    expect(
      errorsOf(
        registerSchema.safeParse({ ...base, password: 'Estrella2024', confirm: 'Estrella2025' }),
      ),
    ).toEqual({ confirm: 'Las contraseñas no coinciden.' });
    expect(
      registerSchema.safeParse({ ...base, password: 'Estrella2024', confirm: 'Estrella2024' })
        .success,
    ).toBe(true);
  });

  it('rechaza contraseñas de más de 72 caracteres (límite de bcrypt)', () => {
    const long = 'a1'.repeat(37);
    expect(newPasswordSchema.safeParse({ password: long, confirm: long }).success).toBe(false);
  });
});

describe('perfil', () => {
  it('PATCH rechaza campos sensibles (plan, gemas)', () => {
    expect(profileUpdateSchema.safeParse({ plan: 'vip' }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ gems: 1000 }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ display_name: 'Ana', id: 'otro' }).success).toBe(false);
  });

  it('PATCH valida usuario, zona horaria y pareja lat/lon', () => {
    expect(profileUpdateSchema.parse({ username: 'Ana_Luna' })).toEqual({ username: 'ana_luna' });
    expect(errorsOf(profileUpdateSchema.safeParse({ username: 'ña' })).username).toBeDefined();
    expect(
      errorsOf(profileUpdateSchema.safeParse({ time_zone: 'Marte/Olimpo' })).time_zone,
    ).toMatch(/no existe/);
    expect(profileUpdateSchema.safeParse({ time_zone: 'America/Santiago' }).success).toBe(true);
    expect(errorsOf(profileUpdateSchema.safeParse({ birth_lat: 40 })).birth_lat).toMatch(/juntas/);
  });

  it('PATCH: avatar solo https y "" borra campos opcionales', () => {
    expect(profileUpdateSchema.safeParse({ avatar_url: 'http://x.com/a.png' }).success).toBe(false);
    expect(profileUpdateSchema.parse({ birth_time: '', personal_bio: '' })).toEqual({
      birth_time: null,
      personal_bio: null,
    });
  });

  it('onboarding desde formulario: coma decimal, hora desconocida y fechas imposibles', () => {
    const form = new FormData();
    for (const [k, v] of Object.entries({
      display_name: 'Ana',
      username: 'ana',
      birth_date: '1990-04-15',
      birth_time: '',
      birth_time_unknown: 'on',
      birth_place: 'Madrid',
      birth_lat: '40,4168',
      birth_lon: '-3.7038',
      time_zone: 'Europe/Madrid',
    })) {
      form.set(k, v);
    }
    const parsed = onboardingSchema.parse(formToObject(form));
    expect(parsed).toMatchObject({
      birth_lat: 40.4168,
      birth_time_unknown: true,
      reading_tone: 'directo',
    });
    expect(parsed.birth_time).toBeUndefined();

    form.delete('birth_time_unknown');
    expect(errorsOf(onboardingSchema.safeParse(formToObject(form))).birth_time).toMatch(
      /no la sabes/,
    );

    form.set('birth_date', '1990-02-30');
    expect(errorsOf(onboardingSchema.safeParse(formToObject(form))).birth_date).toMatch(
      /no existe/,
    );
    form.set('birth_date', '2999-01-01');
    expect(errorsOf(onboardingSchema.safeParse(formToObject(form))).birth_date).toMatch(/futuro/);
  });

  it('una latitud vacía no se convierte en 0', () => {
    const result = onboardingSchema.safeParse({
      display_name: 'Ana',
      username: 'ana',
      birth_date: '1990-04-15',
      birth_time: '10:30',
      birth_place: 'Madrid',
      birth_lat: '',
      birth_lon: '-3.7',
      time_zone: 'Europe/Madrid',
    });
    expect(errorsOf(result).birth_lat).toBeDefined();
  });
});

describe('carta', () => {
  it('acepta hora nula y rechaza claves extra', () => {
    const base = { date: '1879-03-14', timeZone: 'Europe/Berlin', latitude: 48.4, longitude: 10 };
    expect(errorsOf(chartRequestSchema.safeParse({ ...base, time: '11:30' })).date).toMatch(/1900/);
    const ok = chartRequestSchema.parse({ ...base, date: '1990-01-01', time: null });
    expect(ok.time).toBeNull();
    expect(
      chartRequestSchema.safeParse({ ...base, date: '1990-01-01', time: '10:00', userId: 'x' })
        .success,
    ).toBe(false);
  });
});

describe('utilidades de formulario', () => {
  it('formToObject conserva arrays solo donde se pide', () => {
    const form = new FormData();
    form.append('topics', 'amor');
    form.append('topics', 'dinero');
    form.append('name', 'Ana');
    expect(formToObject(form, ['topics'])).toEqual({ topics: ['amor', 'dinero'], name: 'Ana' });
    expect(formToObject(form)).toEqual({ topics: 'amor', name: 'Ana' });
  });
});
