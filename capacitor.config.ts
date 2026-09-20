import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mygymagent.app",
  appName: "MyGymAgent",
  webDir: "www",
  server: {
    url: "https://mygymagent-f.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
