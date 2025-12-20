// 獲取關聯域名
const getAssociatedDomains = () => {
  return ["applinks:to-do-mvp.vercel.app"];
};

// 獲取重定向 URL
const getRedirectUrl = () => {
  return "https://to-do-mvp.vercel.app";
};

// 環境配置
const getEnvironmentConfig = () => {
  return {
    name: "TaskCal",
    slug: "taskcal",
    version: "1.2.1",
    description: "Simple and intuitive task management app with Google SSO",
    scheme: "taskcal",
    bundleIdentifier: "com.cty0305.too.doo.list",
    package: "com.cty0305.too.doo.list",
    iosBuildNumber: "9",
  };
};

const envConfig = getEnvironmentConfig();

module.exports = {
  expo: {
    name: envConfig.name,
    slug: envConfig.slug,
    version: envConfig.version,
    description: envConfig.description,
    main: "node_modules/expo/AppEntry.js",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: envConfig.scheme,
    icon: "./assets/logo.png",
    jsEngine: "hermes",
    sdkVersion: "54.0.0",

    // Platform specific settings
    ios: {
      bundleIdentifier: envConfig.bundleIdentifier,
      buildNumber: envConfig.iosBuildNumber || "1",
      supportsTablet: false,
      deploymentTarget: "13.0",
      associatedDomains: getAssociatedDomains(),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [envConfig.scheme],
          },
        ],
      },
    },
    // Android configuration removed as this project targets iOS only
    web: {
      port: 8081,
      bundler: "metro",
      output: "single",
      favicon: "./assets/logo.png",
      meta: [
        {
          name: "description",
          content:
            "TaskCal - Simple and intuitive task management app with Google SSO. Organize your daily tasks, boost productivity, and achieve your goals with our clean and easy-to-use calendar-based to-do list app.",
        },
        {
          name: "keywords",
          content:
            "task management, to-do list, productivity app, calendar, Google SSO, task organizer, daily planner, goal tracking",
        },
        { name: "author", content: "TaskCal Team" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        {
          property: "og:title",
          content: "TaskCal - Simple Task Management App",
        },
        {
          property: "og:description",
          content:
            "Transform your productivity with TaskCal! A simple and intuitive task management app featuring Google SSO, calendar integration, and clean organization tools. Stay focused, achieve more, and never miss a deadline again.",
        },
        { property: "og:image", content: "./assets/logo.png" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: getRedirectUrl() },
        { property: "og:site_name", content: "TaskCal" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "TaskCal - Simple Task Management App",
        },
        {
          name: "twitter:description",
          content:
            "Transform your productivity with TaskCal! A simple and intuitive task management app featuring Google SSO, calendar integration, and clean organization tools. Stay focused, achieve more, and never miss a deadline again.",
        },
        { name: "twitter:image", content: "./assets/logo.png" },
        { name: "twitter:creator", content: "@TooDooList" },
        { name: "theme-color", content: "#6c63ff" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: "TaskCal" },
      ],
    },

    // Updates configuration
    runtimeVersion: "1.5.0",
    updates: {
      url: "https://u.expo.dev/a86169e7-6d37-4bee-be43-d1e709615ef9",
      channel: "production",
    },

    // EAS project configuration
    extra: {
      eas: {
        projectId: "a86169e7-6d37-4bee-be43-d1e709615ef9",
      },
      // Environment variables
      EXPO_PUBLIC_APP_ENV: "production",
      // Environment specific configuration
      environment: envConfig,
    },

    // Splash screen configuration
    splash: {
      image: "./assets/logo-white.png",
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
      [
        "expo-notifications",
        {
          icon: "./assets/logo.png",
          color: "#6c63ff",
          sounds: [],
        },
      ],
      "expo-apple-authentication",
    ],
  },
};
