import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'es.aibueno.zodi',
  appName: 'ZODI',
  webDir: 'public',
  server: {
    url: 'https://zodi.aibueno.es',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: 'release-key.keystore',
      keystoreAlias: 'zodi',
    }
  }
};

export default config;
