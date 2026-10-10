import type { APIRequestContext, Page } from '@playwright/test';
import { MOCK_SUPABASE_URL } from '../../../playwright.config';

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/** Usuario nuevo en el Supabase falso (cada test el suyo). */
export async function createTestUser(
  request: APIRequestContext,
  onboarded: boolean,
): Promise<TestUser> {
  const res = await request.post(`${MOCK_SUPABASE_URL}/__test/users`, { data: { onboarded } });
  return (await res.json()) as TestUser;
}

export async function login(page: Page, user: TestUser, path = '/auth/login') {
  await page.goto(path);
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}
