import { defineConfig, devices } from '@playwright/test';

/** Puertos propios para no reutilizar por error un `npm run dev` sin el mock. */
export const MOCK_SUPABASE_URL = 'http://127.0.0.1:54329';
const APP_URL = 'http://localhost:4329';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: [
    {
      command: 'node tests/e2e/support/mock-supabase.mjs',
      url: `${MOCK_SUPABASE_URL}/__test/health`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_SUPABASE_PORT: '54329' },
    },
    {
      command: 'npm run dev -- --port 4329',
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      // process.env tiene prioridad sobre .env.local: los e2e nunca tocan el Supabase real.
      env: { PUBLIC_SUPABASE_URL: MOCK_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key' },
    },
  ],
  use: { baseURL: APP_URL },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Viewport y táctil de iPad sobre Chromium: WebKit no arranca en Windows (falta icutu77.dll).
    // Probar el motor Safari en CI Linux (Fase 8).
    { name: 'tablet', use: { ...devices['iPad (gen 7)'], defaultBrowserType: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
