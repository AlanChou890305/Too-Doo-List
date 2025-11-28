/**
 * 環境配置管理器
 * 僅保留 Production 環境
 */

// 獲取當前環境
export const getCurrentEnvironment = () => {
  return "production";
};

// 環境配置
export const environmentConfig = {
  production: {
    name: "Production",
    appName: "Too-Doo-List",
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://ajbusqpjsjcuzzxuueij.supabase.co",
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYnVzcXBqc2pjdXp6eHV1ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNjY2NTksImV4cCI6MjA0NDc0MjY1OX0.1Aw4OcBWPZTiRbGJDLpMmBPWQcZYMmVvFqMxdKHgAuU",
    },
    api: {
      baseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.yourdomain.com",
      version: "v1",
    },
    features: {
      debug: false,
      analytics: true,
      crashReporting: true,
      notificationDebug: false,
    },
    logging: {
      level: "error",
      enableConsole: false,
    },
  },
};

// 獲取當前環境配置
export const getConfig = () => {
  return environmentConfig.production;
};

// 檢查是否為測試環境 (Always false)
export const isStaging = () => false;

// 檢查是否為正式環境 (Always true)
export const isProduction = () => true;

// 獲取 Supabase 配置
export const getSupabaseConfig = () => {
  return getConfig().supabase;
};

// 獲取 API 配置
export const getApiConfig = () => {
  return getConfig().api;
};

// 獲取功能開關
export const getFeatureFlags = () => {
  return getConfig().features;
};

// 日誌配置
export const getLoggingConfig = () => {
  return getConfig().logging;
};

// 環境資訊
export const getEnvironmentInfo = () => {
  const config = getConfig();
  return {
    environment: "production",
    name: config.name,
    appName: config.appName,
    features: config.features,
  };
};
