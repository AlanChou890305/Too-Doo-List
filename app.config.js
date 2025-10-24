// 環境配置
const getEnvironmentConfig = () => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || 'development';
  
  const configs = {
    development: {
      name: "To Do Dev",
      slug: "too-doo-list-dev",
      version: "1.8.0-dev",
      description: "To Do - Development Environment",
      scheme: "too-doo-list-dev",
      bundleIdentifier: "com.cty0305.too.doo.list.dev",
      package: "com.cty0305.too.doo.list.dev",
    },
    staging: {
      name: "To Do Staging",
      slug: "too-doo-list-staging", 
      version: "1.8.0-staging",
      description: "To Do - Staging Environment",
      scheme: "too-doo-list-staging",
      bundleIdentifier: "com.cty0305.too.doo.list.staging",
      package: "com.cty0305.too.doo.list.staging",
    },
    production: {
      name: "To Do",
      slug: "too-doo-list",
      version: "1.8.0",
      description: "Simple and intuitive task management app with Google SSO",
      scheme: "too-doo-list",
      bundleIdentifier: "com.cty0305.too.doo.list",
      package: "com.cty0305.too.doo.list",
    }
  };
  
  return configs[env] || configs.production;
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
      supportsTablet: true,
      deploymentTarget: "13.0",
      associatedDomains: ["applinks:to-do-mvp.vercel.app"],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [envConfig.bundleIdentifier],
          },
        ],
      },
    },
    android: {
      package: envConfig.package,
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
      output: "single",
      favicon: "./assets/logo.png",
      meta: [
        {
          name: "description",
          content:
            "To Do - Simple and intuitive task management app with Google SSO. Organize your daily tasks, boost productivity, and achieve your goals with our clean and easy-to-use to-do list app.",
        },
        {
          name: "keywords",
          content:
            "task management, to-do list, productivity app, calendar, Google SSO, task organizer, daily planner, goal tracking",
        },
        { name: "author", content: "To Do Team" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        {
          property: "og:title",
          content: "To Do - Simple Task Management App",
        },
        {
          property: "og:description",
          content:
            "Transform your productivity with To Do! A simple and intuitive task management app featuring Google SSO, calendar integration, and clean organization tools. Stay focused, achieve more, and never miss a deadline again.",
        },
        { property: "og:image", content: "./assets/logo.png" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://to-do-mvp.vercel.app" },
        { property: "og:site_name", content: "To Do" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "To Do - Simple Task Management App",
        },
        {
          name: "twitter:description",
          content:
            "Transform your productivity with To Do! A simple and intuitive task management app featuring Google SSO, calendar integration, and clean organization tools. Stay focused, achieve more, and never miss a deadline again.",
        },
        { name: "twitter:image", content: "./assets/logo.png" },
        { name: "twitter:creator", content: "@TooDooList" },
        { name: "theme-color", content: "#6c63ff" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: "To Do" },
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
      // Environment variables - 根據環境自動切換
      EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
      // 環境特定配置
      environment: envConfig,
    },

    // Splash screen configuration
    splash: {
      image: "./assets/logo.png",
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
    ],
  },
};
