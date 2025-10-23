# 環境變數設定說明

## 🔑 需要設定的環境變數

### **1. 本地開發環境**

創建 `.env.local` 文件（在專案根目錄）：

```bash
# 開發環境
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-dev-anon-key

# 測試環境
EXPO_PUBLIC_SUPABASE_URL_STAGING=https://your-staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
```

### **2. Vercel 部署環境**

在 Vercel Dashboard 中設定環境變數：

#### **開發環境專案 (to-do-dev)**

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=你的開發環境URL
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=你的開發環境KEY
```

#### **測試環境專案 (to-do-staging)**

```bash
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL_STAGING=你的測試環境URL
EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING=你的測試環境KEY
```

## 🚀 測試環境切換

### **本地測試**

```bash
# 開發環境
EXPO_PUBLIC_APP_ENV=development npm start

# 測試環境
EXPO_PUBLIC_APP_ENV=staging npm start
```

### **部署測試**

```bash
# 推送到 develop 分支 → 自動部署開發環境
git checkout develop
git push origin develop

# 推送到 staging 分支 → 自動部署測試環境
git checkout staging
git push origin staging
```

## 📋 下一步行動

1. ✅ 獲取兩個專案的 API 金鑰
2. ✅ 設定本地環境變數
3. ✅ 設定 Vercel 環境變數
4. ✅ 測試環境切換
5. ✅ 測試部署流程
