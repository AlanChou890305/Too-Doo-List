# 環境配置設定指南

## 🏗️ 多環境架構

### 分支策略

- `develop` - 開發環境
- `staging` - 測試環境
- `main` - 正式環境

### 環境配置

#### 1. 開發環境 (.env.development)

```bash
# App Environment
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_APP_NAME=Too-Doo-List Dev

# Supabase Configuration (Development)
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key

# Feature Flags
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_NOTIFICATION_DEBUG=true
```

#### 2. 測試環境 (.env.staging)

```bash
# App Environment
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_APP_NAME=Too-Doo-List Staging

# Supabase Configuration (Staging)
EXPO_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key

# Feature Flags
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_NOTIFICATION_DEBUG=false
```

#### 3. 正式環境 (.env.production)

```bash
# App Environment
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_APP_NAME=Too-Doo-List

# Supabase Configuration (Production)
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key

# Feature Flags
EXPO_PUBLIC_ENABLE_DEBUG=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_NOTIFICATION_DEBUG=false
```

## 📋 設定步驟

### 1. 創建環境文件

```bash
# 複製範本文件
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production

# 編輯各環境的配置
```

### 2. Supabase 專案設定

- 開發環境：創建新的 Supabase 專案
- 測試環境：創建新的 Supabase 專案
- 正式環境：創建新的 Supabase 專案

### 3. Vercel 部署設定

- 開發環境：自動部署 develop 分支
- 測試環境：自動部署 staging 分支
- 正式環境：自動部署 main 分支

## 🔧 環境切換邏輯

在 `supabaseClient.js` 中：

```javascript
const getSupabaseConfig = () => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || "development";

  const configs = {
    development: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_DEV,
      key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV,
    },
    staging: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_STAGING,
      key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING,
    },
    production: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_PROD,
      key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD,
    },
  };

  return configs[env] || configs.development;
};
```

## 🚀 部署流程

### 開發 → 測試

```bash
git checkout staging
git merge develop
git push origin staging
```

### 測試 → 正式

```bash
git checkout main
git merge staging
git push origin main
```

## ⚠️ 注意事項

1. **敏感資料保護**：不要將真實的 API 金鑰提交到 Git
2. **環境隔離**：確保各環境的資料完全隔離
3. **監控設定**：為每個環境設定獨立的監控
4. **備份策略**：定期備份正式環境資料
