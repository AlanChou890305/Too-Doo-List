module.exports = {
  expo: {
    name: "Too Doo List",
    slug: "too-doo-list",
    version: "1.0.0",
    description: "Smart Task Management & Productivity App with Google SSO",
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
        {
          name: "description",
          content:
            "Too Doo List - Smart Task Management App with Google SSO. Organize your daily tasks, boost productivity, and achieve your goals with our intuitive calendar-based to-do list app.",
        },
        {
          name: "keywords",
          content:
            "task management, to-do list, productivity app, calendar, Google SSO, task organizer, daily planner, goal tracking",
        },
        { name: "author", content: "Too Doo List Team" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        {
          property: "og:title",
          content: "Too Doo List - Smart Task Management & Productivity App",
        },
        {
          property: "og:description",
          content:
            "Transform your productivity with Too Doo List! A modern, intuitive task management app featuring Google SSO, calendar integration, and smart organization tools. Stay focused, achieve more, and never miss a deadline again.",
        },
        { property: "og:image", content: "./assets/logo.png" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://too-doo-list.netlify.app" },
        { property: "og:site_name", content: "Too Doo List" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Too Doo List - Smart Task Management & Productivity App",
        },
        {
          name: "twitter:description",
          content:
            "Transform your productivity with Too Doo List! A modern, intuitive task management app featuring Google SSO, calendar integration, and smart organization tools. Stay focused, achieve more, and never miss a deadline again.",
        },
        { name: "twitter:image", content: "./assets/logo.png" },
        { name: "twitter:creator", content: "@TooDooList" },
        { name: "theme-color", content: "#6c63ff" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: "Too Doo List" },
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
