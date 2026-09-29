const config = {
  appId: "com.mygymagent.app",
  // The launcher label and the name Android Settings lists the app under.
  // "Cult Client", not the full THE CULT CLIENT: launchers cut labels at
  // about twelve characters, and this matches the iPhone Home Screen label
  // (short_name in src/app/manifest.ts). appId is deliberately unchanged --
  // changing it makes a different app, which existing installs cannot
  // update to and which the Firebase config would no longer match.
  appName: "Cult Client",
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
