# 環境設定快速指南（雙環境架構）

## 🎯 目標

設定 Too-Doo-List 的雙環境架構：
- **Staging**: 開發和測試
- **Production**: 正式環境

## 📋 設定清單

### ✅ 階段 1: Supabase 專案確認

**Staging 環境:**
- [x] Project: `to-do-staging`
- [x] Project ID: `qerosiozltqrbehctxdn`
- [x] Region: ap-southeast-1
- [x] 用於開發和測試

**Production 環境:**
- [x] Project: `to-do-production` (原 `to-do-dev`)
- [x] Project ID: `ajbusqpjsjcuzzxuueij`
- [x] Region: ap-south-1
- [x] 用於正式環境

### ✅ 階段 2: 獲取 API 金鑰

#### Staging 環境
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇 `to-do-staging` 專案
3. Settings → API
4. 複製：
   - ✅ Project URL
   - ✅ anon public key

#### Production 環境
1. 選擇 `to-do-production` 專案
2. Settings → API
3. 複製：
   - ✅ Project URL
   - ✅ anon public key

### ✅ 階段 3: 本地環境設定

創建 `.env.local` 文件：

```bash
# Staging 環境（本地開發預設）
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your_staging_anon_key
EXPO_PUBLIC_ENABLE_DEBUG=true
```

**檢查點:**
- [ ] 檔案創建在專案根目錄
- [ ] 確認已加入 `.gitignore`
- [ ] URL 和 Key 正確無誤

### ✅ 階段 4: Vercel 環境變數設定

#### Staging Project (To Do Staging)

1. 前往 Vercel Dashboard
2. 選擇 `To Do Staging` 專案
3. Settings → Environment Variables
4. 新增以下變數：

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your_staging_anon_key
```

**檢查點:**
- [ ] 所有變數名稱正確
- [ ] 所有環境都勾選（Production, Preview, Development）
- [ ] URL 和 Key 對應 Staging 專案

#### Production Project (To Do Production)

1. 選擇 `To Do Production` 專案
2. Settings → Environment Variables
3. 新增以下變數：

```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

**檢查點:**
- [ ] 所有變數名稱正確
- [ ] 所有環境都勾選
- [ ] URL 和 Key 對應 Production 專案
- [ ] `EXPO_PUBLIC_ENABLE_DEBUG=false`

### ✅ 階段 5: Git 分支設定

確認分支結構：

```bash
# 檢查現有分支
git branch -a

# 應該看到：
# * main (Production)
#   develop (Staging)
```

**檢查點:**
- [ ] `main` branch 存在
- [ ] `develop` branch 存在
- [ ] 兩個 branch 都已推送到 remote

### ✅ 階段 6: Vercel 專案連接

#### Staging Project
- [ ] Git Repository: `Too-Doo-List`
- [ ] Production Branch: `develop`
- [ ] Auto Deploy: ✅ Enabled

#### Production Project
- [ ] Git Repository: `Too-Doo-List`
- [ ] Production Branch: `main`
- [ ] Auto Deploy: ✅ Enabled

### ✅ 階段 7: 測試部署

#### Staging 測試
```bash
# 1. 切換到 develop 分支
git checkout develop

# 2. 做一個測試變更
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "[test] Staging deployment test"

# 3. 推送
git push origin develop

# 4. 檢查 Vercel Dashboard
# 應該看到 To Do Staging 自動開始部署
```

**檢查點:**
- [ ] Vercel 自動觸發部署
- [ ] 部署成功（Status: Ready）
- [ ] 訪問 Staging URL 正常運作
- [ ] Console 顯示正確的環境資訊

#### Production 測試
```bash
# 1. 切換到 main 分支
git checkout main

# 2. 合併 develop（如果需要）
git merge develop

# 3. 推送
git push origin main

# 4. 檢查 Vercel Dashboard
# 應該看到 To Do Production 自動開始部署
```

**檢查點:**
- [ ] Vercel 自動觸發部署
- [ ] 部署成功（Status: Ready）
- [ ] 訪問 Production URL 正常運作
- [ ] Console 不顯示 debug 資訊（已關閉）

### ✅ 階段 8: OAuth 設定

#### Google Cloud Console

**Staging:**
```
Authorized redirect URIs:
- https://too-doo-list-staging.vercel.app/auth/callback
```

**Production:**
```
Authorized redirect URIs:
- https://to-do-mvp.vercel.app/auth/callback
```

**檢查點:**
- [ ] Staging Redirect URI 已新增
- [ ] Production Redirect URI 已新增
- [ ] 兩個環境的 OAuth 都能正常運作

#### Supabase Dashboard

**Staging Project (to-do-staging):**
```
Authentication → URL Configuration:
- Site URL: https://too-doo-list-staging.vercel.app
- Redirect URLs: https://too-doo-list-staging.vercel.app/auth/callback
```

**Production Project (to-do-production):**
```
Authentication → URL Configuration:
- Site URL: https://to-do-mvp.vercel.app
- Redirect URLs: https://to-do-mvp.vercel.app/auth/callback
```

**檢查點:**
- [ ] Staging Supabase URL 設定正確
- [ ] Production Supabase URL 設定正確
- [ ] OAuth 登入測試成功

## 🧪 最終驗證

### Staging 環境驗證
```bash
# 1. 訪問 Staging URL
# https://to-do-staging.vercel.app

# 2. 開啟 Console (F12)

# 3. 檢查環境資訊
# 應該看到：
# Environment: development
# Supabase URL: qerosiozltqrbehctxdn.supabase.co

# 4. 測試 Google SSO
# 登入 → 新增任務 → 確認資料存入 Staging Supabase
```

### Production 環境驗證
```bash
# 1. 訪問 Production URL
# https://to-do-mvp.vercel.app

# 2. 開啟 Console (F12)

# 3. 檢查環境資訊（應該沒有 debug 資訊）
# Environment: production
# Supabase URL: ajbusqpjsjcuzzxuueij.supabase.co

# 4. 測試 Google SSO
# 登入 → 新增任務 → 確認資料存入 Production Supabase
```

## ✅ 完成確認

所有檢查點都完成後，您應該有：

- [x] 兩個獨立的 Supabase 專案
- [x] 兩個獨立的 Vercel 專案
- [x] 正確的環境變數配置
- [x] 自動部署流程運作正常
- [x] OAuth 在兩個環境都正常
- [x] 資料完全隔離

## 🚀 後續開發流程

### 日常開發
```bash
# 在 develop 分支開發
git checkout develop
# ... 開發 ...
git commit -m "[feat] 新功能"
git push origin develop
# 自動部署到 Staging
```

### 發布到 Production
```bash
# Staging 測試通過後
git checkout main
git merge develop
git push origin main
# 自動部署到 Production
```

## 📚 相關文檔

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - 詳細的環境變數說明
- [SUPABASE_ENVIRONMENTS.md](./SUPABASE_ENVIRONMENTS.md) - Supabase 配置
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Vercel 部署流程

## 🆘 遇到問題？

查看故障排除文檔：
- [ENVIRONMENT_VARIABLES.md#故障排除](./ENVIRONMENT_VARIABLES.md#故障排除)
- [VERCEL_DEPLOYMENT.md#故障排除](./VERCEL_DEPLOYMENT.md#故障排除)

## 🎉 完成！

恭喜！你已經完成雙環境架構的設定。現在可以開始開發了！
