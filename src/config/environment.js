/**
 * 環境配置管理器
 * 根據當前環境自動切換配置
 */

// 獲取當前環境
export const getCurrentEnvironment = () => {
  return process.env.EXPO_PUBLIC_APP_ENV || 'development';
};

// 環境配置
export const environmentConfig = {
  development: {
    name: 'Development',
    appName: 'Too-Doo-List Dev',
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_DEV || process.env.EXPO_PUBLIC_SUPABASE_URL,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    api: {
      baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL_DEV || 'https://dev-api.yourdomain.com',
      version: 'v1',
    },
    features: {
      debug: true,
      analytics: false,
      crashReporting: false,
      notificationDebug: true,
    },
    logging: {
      level: 'debug',
      enableConsole: true,
    },
  },
  
  staging: {
    name: 'Staging',
    appName: 'Too-Doo-List Staging',
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_STAGING || process.env.EXPO_PUBLIC_SUPABASE_URL,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    api: {
      baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL_STAGING || 'https://staging-api.yourdomain.com',
      version: 'v1',
    },
    features: {
      debug: true,
      analytics: false,
      crashReporting: true,
      notificationDebug: false,
    },
    logging: {
      level: 'info',
      enableConsole: true,
    },
  },
  
  production: {
    name: 'Production',
    appName: 'Too-Doo-List',
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_PROD || process.env.EXPO_PUBLIC_SUPABASE_URL,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    api: {
      baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL_PROD || 'https://api.yourdomain.com',
      version: 'v1',
    },
    features: {
      debug: false,
      analytics: true,
      crashReporting: true,
      notificationDebug: false,
    },
    logging: {
      level: 'error',
      enableConsole: false,
    },
  },
};

// 獲取當前環境配置
export const getConfig = () => {
  const env = getCurrentEnvironment();
  return environmentConfig[env] || environmentConfig.development;
};

// 檢查是否為開發環境
export const isDevelopment = () => getCurrentEnvironment() === 'development';

// 檢查是否為測試環境
export const isStaging = () => getCurrentEnvironment() === 'staging';

// 檢查是否為正式環境
export const isProduction = () => getCurrentEnvironment() === 'production';

// 獲取 Supabase 配置
export const getSupabaseConfig = () => {
  const config = getConfig();
  return config.supabase;
};

// 獲取 API 配置
export const getApiConfig = () => {
  const config = getConfig();
  return config.api;
};

// 獲取功能開關
export const getFeatureFlags = () => {
  const config = getConfig();
  return config.features;
};

// 日誌配置
export const getLoggingConfig = () => {
  const config = getConfig();
  return config.logging;
};

// 環境資訊
export const getEnvironmentInfo = () => {
  const config = getConfig();
  return {
    environment: getCurrentEnvironment(),
    name: config.name,
    appName: config.appName,
    features: config.features,
  };
};
