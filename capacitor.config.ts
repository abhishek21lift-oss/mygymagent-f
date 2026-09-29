const config = {
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
  plugins: {
    PushNotifications: {
      // "alert" also shows a notification while the app is open on
      // Android, which otherwise delivers it silently to the listener.
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
