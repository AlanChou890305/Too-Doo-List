module.exports = {
  expo: {
    name: "Too Doo List",
    slug: "too-doo-list",
    version: "1.0.0",
    main: "node_modules/expo/AppEntry.js",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: "too-doo-list",
    icon: "./assets/logo.png",
    jsEngine: "hermes",
    sdkVersion: "54.0.0",

    // Platform specific settings
    ios: {
      bundleIdentifier: "com.cty0305.too.doo.list",
      supportsTablet: true,
      associatedDomains: ["applinks:YOUR_APP_LINK_DOMAIN"],
    },
    android: {
      package: "com.cty0305.too.doo.list",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "too-doo-list",
              host: "auth",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      port: 8081,
      bundler: "metro",
      output: "web",
      build: {
        output: {
          publicUrl: ".",
        },
      },
      favicon: "./assets/logo.png",
      meta: [
        { property: "og:title", content: "Too Doo List" },
        {
          property: "og:description",
          content:
            "Too Doo List: a simple, smart, and organized to-do list app to help you manage your daily life. Stay on top of your tasks and boost your productivity!",
        },
        { property: "og:image", content: "./assets/logo.png" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Too Doo List" },
        {
          name: "twitter:description",
          content:
            "Too Doo List: a simple, smart, and organized to-do list app to help you manage your daily life. Stay on top of your tasks and boost your productivity!",
        },
        { name: "twitter:image", content: "./assets/logo.png" },
      ],
    },

    // Updates configuration
    updates: {
      url: "https://u.expo.dev/059246f4-4110-4b6c-96bf-d968f554f81e",
      fallbackToCacheTimeout: 0,
      enabled: true,
    },

    runtimeVersion: {
      policy: "appVersion",
    },

    // EAS project configuration
    extra: {
      eas: {
        projectId: "059246f4-4110-4b6c-96bf-d968f554f81e",
      },
    },

    // Splash screen configuration
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    // Asset bundle patterns
    assetBundlePatterns: ["**/*"],

    // Required plugins
    plugins: [
      [
        "expo-localization",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
      "expo-web-browser",
    ],
  },
};
