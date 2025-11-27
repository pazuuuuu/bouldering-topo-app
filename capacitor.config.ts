import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.boulderingtopo',
  appName: 'Bouldering Topo',
  webDir: 'out',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  ios: {
    // @ts-ignore: allowsBackForwardNavigationGestures is valid but missing from type definition
    allowsBackForwardNavigationGestures: true,
  },
};

export default config;
