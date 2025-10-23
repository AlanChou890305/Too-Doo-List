# 環境變數配置指南

## 📋 需要設定的環境變數

### **1. 開發環境 (.env.development)**

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-dev-anon-key
```

### **2. 測試環境 (.env.staging) - 您現有的專案**

```bash
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL_STAGING=https://your-staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
```

### **3. 正式環境 (.env.production)**

```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL_PROD=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD=your-prod-anon-key
```

## 🚀 下一步行動

### **步驟 1: 創建 Supabase 專案**

#### **開發環境專案**

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 點擊 "New Project"
3. 專案名稱: `to-do-dev`
4. 組織: 選擇您的組織
5. 地區: 選擇最近的區域
6. 資料庫密碼: 設定強密碼
7. 點擊 "Create new project"

#### **正式環境專案**

1. 重複上述步驟
2. 專案名稱: `to-do-prod`
3. 其他設定相同

### **步驟 2: 獲取 API 金鑰**

#### **開發環境**

1. 進入 `to-do-dev` 專案
2. 前往 Settings → API
3. 複製 Project URL 和 anon public key

#### **測試環境 (您現有的)**

1. 進入 `to-do-staging` 專案
2. 前往 Settings → API
3. 複製 Project URL 和 anon public key

#### **正式環境**

1. 進入 `to-do-prod` 專案
2. 前往 Settings → API
3. 複製 Project URL 和 anon public key

### **步驟 3: 設定環境變數**

#### **本地開發**

創建 `.env.development` 文件：

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=你的開發環境URL
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=你的開發環境KEY
```

#### **Vercel 部署**

在 Vercel Dashboard 中設定環境變數：

**開發環境專案:**

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=你的開發環境URL
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=你的開發環境KEY
```

**測試環境專案:**

```bash
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL_STAGING=你的測試環境URL
EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING=你的測試環境KEY
```

**正式環境專案:**

```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL_PROD=你的正式環境URL
EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD=你的正式環境KEY
```

## 🔄 資料庫結構同步

### **1. 從現有專案導出結構**

```bash
# 在您的 to-do-staging 專案中
# 前往 SQL Editor
# 執行以下查詢來導出表結構
```

### **2. 應用到新專案**

```bash
# 將相同的表結構應用到 to-do-dev 和 to-do-prod
# 確保所有環境的資料庫結構一致
```

## ⚠️ 注意事項

1. **資料隔離**: 確保各環境的資料完全隔離
2. **備份策略**: 定期備份重要資料
3. **安全設定**: 設定適當的 RLS 政策
4. **監控**: 為每個環境設定監控
