import { describe, expect, it } from 'vitest';
import { loginSchema, newPasswordSchema, registerSchema } from '@/lib/validation/auth';
import { chartRequestSchema } from '@/lib/validation/chart';
import { fieldErrors, formToObject } from '@/lib/validation/common';
import { profileUpdateSchema } from '@/lib/validation/profile';
import {
  ARRAY_FIELDS,
  firstIncompleteStep,
  resolveStep,
  stepSchemas,
} from '@/lib/onboarding/steps';

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

  it('paso nacimiento: hora desconocida y fechas imposibles', () => {
    const form = new FormData();
    form.set('birth_date', '1990-04-15');
    form.set('birth_time', '');
    form.set('birth_time_unknown', 'on');
    expect(stepSchemas.nacimiento.parse(formToObject(form))).toEqual({
      birth_date: '1990-04-15',
      birth_time: null,
      birth_time_known: false,
    });
    form.delete('birth_time_unknown');
    expect(errorsOf(stepSchemas.nacimiento.safeParse(formToObject(form))).birth_time).toMatch(
      /no la sabes/,
    );
    form.set('birth_time', '10:30');
    expect(stepSchemas.nacimiento.parse(formToObject(form)).birth_time_known).toBe(true);
    form.set('birth_date', '1990-02-30');
    expect(errorsOf(stepSchemas.nacimiento.safeParse(formToObject(form))).birth_date).toMatch(
      /no existe/,
    );
    form.set('birth_date', '2999-01-01');
    expect(errorsOf(stepSchemas.nacimiento.safeParse(formToObject(form))).birth_date).toMatch(
      /futuro/,
    );
  });

  it('paso lugar: coma decimal y campos ocultos vacíos no valen 0', () => {
    const ok = stepSchemas.lugar.parse({
      birth_place: 'Madrid, España',
      birth_lat: '40,4168',
      birth_lon: '-3.7038',
      time_zone: 'Europe/Madrid',
    });
    expect(ok.birth_lat).toBe(40.4168);
    const empty = stepSchemas.lugar.safeParse({
      birth_place: '',
      birth_lat: '',
      birth_lon: '',
      time_zone: '',
    });
    expect(errorsOf(empty).birth_lat).toBe('Elige tu ciudad de la lista.');
  });

  it('paso estilo: varios temas desde el formulario, máximo 4', () => {
    const form = new FormData();
    form.set('reading_tone', 'brutal');
    for (const t of ['amor', 'dinero']) form.append('favorite_topics', t);
    expect(stepSchemas.estilo.parse(formToObject(form, ARRAY_FIELDS))).toEqual({
      reading_tone: 'brutal',
      favorite_topics: ['amor', 'dinero'],
    });
    for (const t of ['trabajo', 'futuro', 'energia']) form.append('favorite_topics', t);
    expect(
      errorsOf(stepSchemas.estilo.safeParse(formToObject(form, ARRAY_FIELDS))).favorite_topics,
    ).toMatch(/4 temas/);
    expect(stepSchemas.estilo.safeParse({ reading_tone: 'cruel' }).success).toBe(false);
  });

  it('no deja saltarse pasos obligatorios', () => {
    const blank = {
      display_name: 'Ana',
      username: null,
      birth_date: null,
      birth_time_known: null,
      birth_lat: null,
      time_zone: null,
    };
    expect(firstIncompleteStep(blank)).toBe('perfil');
    expect(resolveStep('avisos', blank)).toBe('perfil');
    const partial = {
      ...blank,
      username: 'ana',
      birth_date: '1990-04-15',
      birth_time_known: false,
    };
    expect(resolveStep('nacimiento', partial)).toBe('nacimiento');
    expect(resolveStep('estilo', partial)).toBe('lugar');
    const done = { ...partial, birth_lat: 40, time_zone: 'Europe/Madrid' };
    expect(firstIncompleteStep(done)).toBeNull();
    expect(resolveStep('sobre-ti', done)).toBe('sobre-ti');
    expect(resolveStep(null, done)).toBe('estilo');
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
