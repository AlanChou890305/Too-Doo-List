# Vercel 雙環境部署配置

## 🚀 部署架構（簡化版）

### 環境對應
採用簡化的雙環境架構：

- **Staging 環境**（開發 + 測試）
  - Git Branch: `develop`
  - Vercel Project: `To Do Staging`
  - Domain: `to-do-staging.vercel.app` (或自訂)
  - Supabase: `to-do-staging` (qerosiozltqrbehctxdn)

- **Production 環境**（正式）
  - Git Branch: `main`
  - Vercel Project: `To Do Production`
  - Domain: `to-do-mvp.vercel.app` (或自訂)
  - Supabase: `to-do-production` (ajbusqpjsjcuzzxuueij)

## 📋 Vercel Project 設定

### Staging Project 設定

**基本設定:**
```
Project Name: To Do Staging
Git Repository: Too-Doo-List
Production Branch: develop (設為 Staging 的 production branch)
```

**Build Settings:**
```
Framework Preset: Other
Build Command: npx expo export --platform web --output-dir dist
Output Directory: dist
Install Command: npm install
```

**Environment Variables:**
```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false

# Alternative variable names (for compatibility)
EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-staging-anon-key
EXPO_PUBLIC_SUPABASE_URL_STAGING=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
```

**Domains:**
- Production: `to-do-staging.vercel.app`
- Preview: 自動為每個 commit 生成預覽 URL

### Production Project 設定

**基本設定:**
```
Project Name: To Do Production
Git Repository: Too-Doo-List
Production Branch: main
```

**Build Settings:**
```
Framework Preset: Other
Build Command: npx expo export --platform web --output-dir dist
Output Directory: dist
Install Command: npm install
```

**Environment Variables:**
```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true

# Alternative variable names (for compatibility)
EXPO_PUBLIC_SUPABASE_URL_PROD=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD=your-production-anon-key
```

**Domains:**
- Production: `to-do-mvp.vercel.app` (或自訂域名)
- Preview: 自動為每個 commit 生成預覽 URL

## 🔄 部署流程

### Staging 部署流程

```bash
# 1. 在 develop 分支開發
git checkout develop

# 2. 進行開發和測試
# ... coding ...

# 3. Commit 變更
git add .
git commit -m "[feat] 新功能描述 (v1.x.x)"

# 4. 推送到 develop 分支
git push origin develop

# 5. Vercel 自動觸發部署
# - 使用 Staging 環境變數
# - 連接到 to-do-staging Supabase
# - 部署到 to-do-staging.vercel.app
```

**自動部署觸發條件:**
- ✅ Push to `develop` branch
- ✅ Pull Request to `develop` (Preview Deployment)
- ✅ Merge to `develop`

### Production 部署流程

```bash
# 1. 確保 Staging 環境測試通過
# 2. 從 develop 合併到 main
git checkout main
git merge develop

# 3. 更新版本號（如需要）
# - 編輯 app.config.js
# - 編輯 package.json

# 4. Commit 並推送
git add .
git commit -m "[release] 版本 v1.x.x"
git push origin main

# 5. Vercel 自動觸發部署
# - 使用 Production 環境變數
# - 連接到 to-do-production Supabase
# - 部署到 to-do-mvp.vercel.app
```

**自動部署觸發條件:**
- ✅ Push to `main` branch
- ✅ Pull Request to `main` (Preview Deployment)
- ✅ Merge to `main`

## 🔒 環境變數管理

### 在 Vercel Dashboard 設定

1. **進入 Project Settings**
   - Vercel Dashboard → 選擇 Project → Settings → Environment Variables

2. **新增環境變數**
   - Key: `EXPO_PUBLIC_SUPABASE_URL`
   - Value: 對應環境的 Supabase URL
   - Environments: 勾選 `Production`, `Preview`, `Development`

3. **必要的環境變數**
   - `EXPO_PUBLIC_APP_ENV`
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_ENABLE_DEBUG` (optional)
   - `EXPO_PUBLIC_ENABLE_ANALYTICS` (optional)

### 本地開發環境變數

創建 `.env.local` (不要提交到 Git):

```bash
# Staging 環境（本地開發預設使用）
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=true
```

## 🔗 OAuth Redirect URI 設定

### Google Cloud Console

**Staging 環境:**
```
Authorized redirect URIs:
- https://to-do-staging.vercel.app/auth/callback
- exp://localhost:8081 (for local development)
```

**Production 環境:**
```
Authorized redirect URIs:
- https://to-do-mvp.vercel.app/auth/callback
```

### Supabase Dashboard

**Staging Project (to-do-staging):**
```
Authentication → URL Configuration:
- Site URL: https://to-do-staging.vercel.app
- Redirect URLs:
  - https://to-do-staging.vercel.app/auth/callback
  - exp://localhost:8081
```

**Production Project (to-do-production):**
```
Authentication → URL Configuration:
- Site URL: https://to-do-mvp.vercel.app
- Redirect URLs:
  - https://to-do-mvp.vercel.app/auth/callback
  - exp://localhost:8081 (for TestFlight testing)
```

## 📊 監控和日誌

### Vercel Dashboard 功能

**Deployments:**
- 查看所有部署歷史
- 查看部署狀態（Building, Ready, Error）
- 回滾到之前的部署版本

**Analytics:**
- 頁面訪問量
- 用戶地理位置
- 載入時間
- 錯誤率

**Logs:**
- Function Logs（查看部署日誌）
- Edge Logs（查看 Edge Function 日誌）
- Build Logs（查看建置日誌）

### 告警設定

在 Vercel Dashboard → Settings → Notifications:
- 部署成功通知
- 部署失敗告警
- 整合 Slack/Email 通知

## 🔧 進階配置

### vercel.json 配置

```json
{
  "version": 2,
  "name": "too-doo-list",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/auth/callback",
      "destination": "/auth/callback.html"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 自訂域名設定

**Staging:**
```
staging.yourdomain.com → to-do-staging.vercel.app
```

**Production:**
```
app.yourdomain.com → to-do-mvp.vercel.app
```

## 🚨 故障排除

### 部署失敗

**檢查清單:**
1. 檢查 Build Logs
2. 確認環境變數設定正確
3. 驗證 `package.json` 依賴項
4. 確認 `npx expo export` 在本地可以執行

**常見錯誤:**
```bash
# 環境變數未設定
Error: Missing EXPO_PUBLIC_SUPABASE_URL
解決: 在 Vercel Dashboard 新增環境變數

# Build 指令失敗
Error: Command "npx expo export" exited with 1
解決: 檢查 expo 版本和依賴項

# Output Directory 不正確
Error: No Output Directory found
解決: 確認 vercel.json 中 distDir 設為 "dist"
```

### OAuth 重定向失敗

**檢查清單:**
1. 確認 Google Cloud Console Redirect URI 設定
2. 確認 Supabase Site URL 設定
3. 檢查 Vercel 部署的域名是否正確
4. 測試 `/auth/callback` 路徑是否可訪問

### 環境變數問題

**Debug 方式:**
```javascript
// 在 App.js 或 supabaseClient.js 中
console.log('Current Environment:', process.env.EXPO_PUBLIC_APP_ENV);
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Debug Mode:', process.env.EXPO_PUBLIC_ENABLE_DEBUG);
```

## ⚠️ 重要注意事項

1. **環境隔離**
   - Staging 和 Production 使用完全不同的 Supabase 專案
   - 不要在 Production 環境進行測試
   - 每個環境有獨立的環境變數

2. **部署安全**
   - 不要在代碼中硬編碼 API 金鑰
   - Production 環境關閉 Debug 模式
   - 定期檢查環境變數是否外洩

3. **回滾策略**
   - Vercel 支援一鍵回滾到之前的部署
   - 保持至少 3 個穩定版本可供回滾
   - 重大更新前先在 Staging 完整測試

4. **分支保護**
   - 設定 `main` branch 需要 Pull Request 才能合併
   - 設定 Code Review 規則
   - 啟用 CI/CD 檢查

## 🎯 最佳實踐

### 開發流程

```
開發 → Staging 測試 → Production 部署
  ↓         ↓              ↓
develop  staging      main branch
  ↓         ↓              ↓
Staging   測試        Production
Vercel    驗證        Vercel
```

### 版本管理

```bash
# 功能開發
develop branch → Staging Vercel → 測試驗證

# 正式發布
main branch → Production Vercel → 上線
```

### 緊急修復

```bash
# 在 develop 修復
git checkout develop
# fix bug...
git commit -m "[fix] 緊急修復"
git push origin develop

# 在 Staging 驗證
# 測試通過後

# 快速部署到 Production
git checkout main
git cherry-pick <commit-hash>  # 或 merge develop
git push origin main
```

## 🔗 相關文檔

- [SUPABASE_ENVIRONMENTS.md](./SUPABASE_ENVIRONMENTS.md) - Supabase 環境配置
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - 環境變數說明
- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Vercel 初始設定

## 📞 支援資源

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Vercel CLI: https://vercel.com/docs/cli
