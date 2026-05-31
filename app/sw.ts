import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, CacheFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const zodiAssetsCache: RuntimeCaching = {
  matcher: ({ url }) => {
    return url.pathname.startsWith('/zodi-art/') || url.pathname.startsWith('/zodiac/');
  },
  handler: new CacheFirst({
    cacheName: 'zodi-assets-v4',   // bump version → fuerza re-fetch de todo el caché anterior
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días (antes 30)
      }),
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [zodiAssetsCache, ...defaultCache],
});

serwist.addEventListeners();
