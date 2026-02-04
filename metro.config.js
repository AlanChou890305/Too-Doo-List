const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude native-only modules from web bundle
config.resolver = config.resolver || {};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Exclude react-native-google-mobile-ads on web
  if (
    platform === "web" &&
    (moduleName === "react-native-google-mobile-ads" ||
      moduleName.startsWith("react-native-google-mobile-ads/"))
  ) {
    return {
      type: "empty",
    };
  }

  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
