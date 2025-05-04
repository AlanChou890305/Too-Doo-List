module.exports = {
  expo: {
    name: "Too Doo List",
    slug: "Too-Doo-List",
    developmentClient: true,
    android: {
      package: "com.cty0305.too.doo.list"
    },
    ios: {
      bundleIdentifier: "com.cty0305.too.doo.list"
    },
    updates: {
      url: "https://u.expo.dev/059246f4-4110-4b6c-96bf-d968f554f81e",
      fallbackToCacheTimeout: 0,
      enabled: true
    },
    updates: {
      url: "https://u.expo.dev/059246f4-4110-4b6c-96bf-d968f554f81e",
      fallbackToCacheTimeout: 0,
      enabled: true
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    sdkVersion: "53.0.0",
    platform: {
      ios: {
        supportsTablet: true
      }
    },
    ios: {
      bundleIdentifier: "com.cty0305.toodoolist"
    },
    android: {
      package: "com.cty0305.toodoolist"
    },
    extra: {
      eas: {
        projectId: "059246f4-4110-4b6c-96bf-d968f554f81e"
      }
    },
    name: "Too Doo List",
    slug: "too-doo-list",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: [
      "**/*",
    ],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
  },
};
