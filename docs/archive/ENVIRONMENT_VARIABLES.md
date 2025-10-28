# 環境變數配置指南（雙環境架構）

## 📋 環境架構

採用簡化的雙環境架構：

1. **Staging 環境**（開發 + 測試）
2. **Production 環境**（正式）

## 🔑 需要設定的環境變數

### **1. Staging 環境（開發 + 測試）**

**用途:** 功能開發、測試、驗證

```bash
# 基本配置
EXPO_PUBLIC_APP_ENV=development

# Supabase 配置（to-do-staging project）
EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-staging-anon-key

# 或使用 STAGING 前綴（兩種都支援）
EXPO_PUBLIC_SUPABASE_URL_STAGING=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key

# 功能開關
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

**Supabase Project 資訊:**
```
Project Name: to-do-staging
Project ID: qerosiozltqrbehctxdn
Region: ap-southeast-1 (Singapore)
Database: db.qerosiozltqrbehctxdn.supabase.co
```

### **2. Production 環境（正式）**

**用途:** 正式上線、生產環境

```bash
# 基本配置
EXPO_PUBLIC_APP_ENV=production

# Supabase 配置（to-do-production project，原 to-do-dev）
EXPO_PUBLIC_SUPABASE_URL=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# 或使用 PROD 前綴（兩種都支援）
EXPO_PUBLIC_SUPABASE_URL_PROD=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD=your-production-anon-key

# 功能開關
EXPO_PUBLIC_ENABLE_DEBUG=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

**Supabase Project 資訊:**
```
Project Name: to-do-production (原 to-do-dev)
Project ID: ajbusqpjsjcuzzxuueij
Region: ap-south-1 (Mumbai)
Database: db.ajbusqpjsjcuzzxuueij.supabase.co
```

## 🚀 設定步驟

### **步驟 1: 獲取 Supabase API 金鑰**

#### **Staging 環境**

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇 `to-do-staging` 專案
3. 前往 Settings → API
4. 複製以下內容：
   - Project URL (作為 `SUPABASE_URL_DEV`)
   - anon public key (作為 `SUPABASE_ANON_KEY_DEV`)

#### **Production 環境**

1. 選擇 `to-do-production` 專案
2. 前往 Settings → API
3. 複製以下內容：
   - Project URL (作為 `SUPABASE_URL`)
   - anon public key (作為 `SUPABASE_ANON_KEY`)

### **步驟 2: 本地開發設定**

創建 `.env.local` 文件（在專案根目錄，不要提交到 Git）：

```bash
# 本地開發預設使用 Staging 環境
EXPO_PUBLIC_APP_ENV=development

# Staging Supabase
EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-staging-anon-key

# 啟用 Debug
EXPO_PUBLIC_ENABLE_DEBUG=true
```

### **步驟 3: Vercel 部署設定**

#### **Staging Project (To Do Staging)**

1. 前往 Vercel Dashboard
2. 選擇 `To Do Staging` 專案
3. Settings → Environment Variables
4. 新增以下變數（所有環境都勾選）：

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-staging-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

#### **Production Project (To Do Production)**

1. 選擇 `To Do Production` 專案
2. Settings → Environment Variables
3. 新增以下變數（所有環境都勾選）：

```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

### **步驟 4: EAS Build 設定（iOS/Android）**

在 `eas.json` 中設定環境變數：

```json
{
  "build": {
    "staging": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "development",
        "EXPO_PUBLIC_SUPABASE_URL": "https://qerosiozltqrbehctxdn.supabase.co"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production",
        "EXPO_PUBLIC_SUPABASE_URL": "https://ajbusqpjsjcuzzxuueij.supabase.co"
      }
    }
  }
}
```

**注意:** `SUPABASE_ANON_KEY` 應該設定在 EAS Secrets 中，不要直接寫在 `eas.json`。

## 🧪 測試環境切換

### **本地測試**

```bash
# Staging 環境（預設）
npm start

# 或明確指定
EXPO_PUBLIC_APP_ENV=development npm start

# Production 環境（本地測試）
EXPO_PUBLIC_APP_ENV=production npm start
```

### **檢查當前環境**

在 Console 中查看：

```javascript
console.log('Environment:', process.env.EXPO_PUBLIC_APP_ENV);
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
```

或使用內建的環境資訊：

```javascript
import { getEnvironmentInfo } from './src/config/environment';
console.log(getEnvironmentInfo());
```

## 📊 環境對應表

| 環境 | Git Branch | Vercel Project | Supabase Project | Project ID |
|------|-----------|----------------|------------------|------------|
| Staging | `develop` | To Do Staging | to-do-staging | qerosiozlt... |
| Production | `main` | To Do Production | to-do-production | ajbusqpjsj... |

## ⚠️ 重要注意事項

### **1. 安全性**

- ❌ 不要在代碼中硬編碼 API 金鑰
- ❌ 不要提交 `.env` 或 `.env.local` 到 Git
- ✅ 使用環境變數管理敏感資訊
- ✅ 定期輪換 API 金鑰

### **2. 環境隔離**

- Staging 和 Production 使用完全不同的 Supabase 專案
- 兩個環境的資料完全隔離
- 不要在 Production 進行測試

### **3. 變數命名**

為了相容性，支援多種命名方式：

```bash
# Staging 環境支援：
EXPO_PUBLIC_SUPABASE_URL_DEV
EXPO_PUBLIC_SUPABASE_URL_STAGING
# 兩者擇一即可

# Production 環境支援：
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_URL_PROD
# 建議使用 EXPO_PUBLIC_SUPABASE_URL
```

### **4. .gitignore 設定**

確保以下檔案已加入 `.gitignore`：

```
.env
.env.local
.env.development
.env.staging
.env.production
.env*.local
```

## 🔧 故障排除

### **問題 1: 環境變數未生效**

**症狀:** 應用連接到錯誤的 Supabase 專案

**解決方法:**
```bash
# 1. 檢查環境變數是否正確設定
console.log(process.env.EXPO_PUBLIC_APP_ENV);

# 2. 清除快取並重新啟動
npm start --clear

# 3. Vercel 需要重新部署
# Settings → Deployments → Redeploy
```

### **問題 2: Vercel 部署後環境變數不正確**

**症狀:** Web 版本連接到錯誤的環境

**解決方法:**
1. 檢查 Vercel Dashboard 中的環境變數
2. 確認所有環境都勾選（Production, Preview, Development）
3. 修改後需要重新部署

### **問題 3: 本地開發連接到 Production**

**症狀:** 本地開發時連接到正式環境

**解決方法:**
1. 檢查 `.env.local` 文件
2. 確認 `EXPO_PUBLIC_APP_ENV=development`
3. 確認使用的是 Staging 的 Supabase URL

## 📞 相關文檔

- [SUPABASE_ENVIRONMENTS.md](./SUPABASE_ENVIRONMENTS.md) - Supabase 環境配置
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Vercel 部署配置
- [ENV_SETUP_INSTRUCTIONS.md](./ENV_SETUP_INSTRUCTIONS.md) - 環境設定說明

## 🆘 獲取幫助

如果遇到問題：
1. 檢查 Console 中的環境調試資訊
2. 確認 Supabase Dashboard 中的專案狀態
3. 檢查 Vercel Deployment Logs
4. 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)（如果有）
