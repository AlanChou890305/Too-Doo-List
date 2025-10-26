# Supabase Project 重新命名執行總結

## 📝 決策

將 Supabase 專案 `to-do-dev` 重新命名為 `to-do-production`，以反映其作為正式環境的用途。

## ✅ 已完成的更新

### 1. 代碼更新

#### `src/config/environment.js`

- ✅ 更新 `production` 環境註解，標註使用 ajbu... project (to-do-production)
- ✅ 更新 `development` 環境註解，標註使用 qero... project (to-do-staging)
- ✅ 更新 `staging` 環境配置，使其成為獨立的 Staging 環境
- ✅ 調整 Staging 環境的 Feature Flags（啟用 debug, 關閉 analytics）

### 2. 文檔更新

#### `SUPABASE_ENVIRONMENTS.md` - 完全重寫

- ✅ 更新為雙環境架構說明
- ✅ 詳細列出兩個 Supabase 專案的資訊
- ✅ 新增 Migration 管理說明
- ✅ 新增 RLS 策略設定指南
- ✅ 新增監控和備份策略

#### `VERCEL_DEPLOYMENT.md` - 完全重寫

- ✅ 更新為雙環境部署配置
- ✅ 詳細的 Vercel 專案設定步驟
- ✅ 環境變數完整配置說明
- ✅ OAuth Redirect URI 設定指南
- ✅ 故障排除章節

#### `ENVIRONMENT_VARIABLES.md` - 完全重寫

- ✅ 雙環境架構的環境變數說明
- ✅ 詳細的 Supabase Project 資訊
- ✅ 本地開發和 Vercel 部署設定步驟
- ✅ 環境變數命名相容性說明
- ✅ 故障排除指南

#### `ENV_SETUP_INSTRUCTIONS.md` - 完全重寫

- ✅ 快速設定指南（Checklist 格式）
- ✅ 階段性設定步驟
- ✅ 測試和驗證流程
- ✅ 後續開發流程說明

#### `README.md` - 部分更新

- ✅ 更新環境變數設定說明
- ✅ 更新 Supabase 設定說明
- ✅ 更新部署章節（改為 Vercel，標註雙環境）

#### `ENVIRONMENT_ARCHITECTURE.md` - 新建

- ✅ 完整的環境架構總覽
- ✅ 圖示化的架構說明
- ✅ 詳細的工作流程
- ✅ 最佳實踐和注意事項
- ✅ 故障排除指南

### 3. 刪除過時文檔

- ✅ 刪除 `VERCEL_DEV_ENVIRONMENT_CHECK.md`（已不適用於雙環境架構）

## 🎯 環境架構總結

### Staging 環境（開發 + 測試）

```
Git Branch:       develop
Vercel Project:   To Do Staging
Vercel Domain:    to-do-staging.vercel.app
Supabase Project: to-do-staging
Supabase ID:      qerosiozltqrbehctxdn
Region:           ap-southeast-1 (Singapore)
```

### Production 環境（正式）

```
Git Branch:       main
Vercel Project:   To Do Production
Vercel Domain:    to-do-mvp.vercel.app
Supabase Project: to-do-production (原 to-do-dev)
Supabase ID:      ajbusqpjsjcuzzxuueij
Region:           ap-south-1 (Mumbai)
```

## ⚠️ 需要手動執行的步驟

### 1. Supabase Dashboard 更新（必須由你手動操作）

**步驟:**

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇 Project ID: `ajbusqpjsjcuzzxuueij`
3. 前往 Settings → General
4. 找到 "Name" 欄位
5. 將名稱從 `to-do-dev` 改為 `to-do-production`
6. 儲存變更

**注意:**

- Project URL 不會改變（仍然是 `ajbusqpjsjcuzzxuueij.supabase.co`）
- 名稱只是顯示用途，不影響功能
- 所有現有連接和資料都不受影響

### 2. Vercel 環境變數檢查

確認兩個 Vercel 專案的環境變數設定正確：

#### To Do Staging

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-staging-anon-key
```

#### To Do Production

```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

### 3. OAuth Redirect URI 檢查

確認 Google Cloud Console 和 Supabase 的 Redirect URI 設定正確：

#### Google Cloud Console

```
Staging:
- https://to-do-staging.vercel.app/auth/callback

Production:
- https://to-do-mvp.vercel.app/auth/callback
```

#### Supabase Dashboard

**to-do-staging:**

```
Authentication → URL Configuration:
- Site URL: https://to-do-staging.vercel.app
- Redirect URLs: https://to-do-staging.vercel.app/auth/callback
```

**to-do-production:**

```
Authentication → URL Configuration:
- Site URL: https://to-do-mvp.vercel.app
- Redirect URLs: https://to-do-mvp.vercel.app/auth/callback
```

## 📊 更新摘要

| 項目                | 狀態                             |
| ------------------- | -------------------------------- |
| 代碼更新            | ✅ 完成                          |
| 文檔更新            | ✅ 完成 (5 個文檔重寫，1 個新建) |
| 過時文檔清理        | ✅ 完成                          |
| Supabase 名稱更新   | ⚠️ 需要手動操作                  |
| Vercel 環境變數檢查 | ⚠️ 建議檢查                      |
| OAuth URI 檢查      | ⚠️ 建議檢查                      |

## 🚀 下一步行動

### 立即執行

1. [ ] 在 Supabase Dashboard 手動更新專案名稱
2. [ ] 檢查 Vercel 環境變數設定
3. [ ] 驗證 OAuth Redirect URI 設定

### 測試驗證

4. [ ] 測試 Staging 環境（develop branch）

   - 推送測試 commit 到 develop
   - 確認自動部署成功
   - 測試 Google SSO 登入
   - 檢查資料存入正確的 Supabase (to-do-staging)

5. [ ] 測試 Production 環境（main branch）
   - 合併 develop 到 main
   - 確認自動部署成功
   - 測試 Google SSO 登入
   - 檢查資料存入正確的 Supabase (to-do-production)

### Git Commit

6. [ ] Commit 所有變更

```bash
git add .
git commit -m "[docs] 更新環境架構為雙環境模式，to-do-dev 重新命名為 to-do-production (v1.x.x)"
git push origin develop
```

## 📚 參考文檔

### 快速開始

- [ENV_SETUP_INSTRUCTIONS.md](./ENV_SETUP_INSTRUCTIONS.md) - 環境設定快速指南

### 詳細配置

- [ENVIRONMENT_ARCHITECTURE.md](./ENVIRONMENT_ARCHITECTURE.md) - 完整架構總覽 ⭐ 推薦先讀
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - 環境變數配置
- [SUPABASE_ENVIRONMENTS.md](./SUPABASE_ENVIRONMENTS.md) - Supabase 環境設定
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Vercel 部署配置

### 開發指南

- [README.md](./README.md) - 專案總覽

## ✨ 優勢

### 簡化管理

- ✅ 只需維護 2 個 Supabase 專案（符合 Free Plan 限制）
- ✅ 清晰的環境分離（Staging vs Production）
- ✅ 簡化的部署流程（develop → Staging, main → Production）

### 成本效益

- ✅ 充分利用 Supabase Free Plan
- ✅ 無需付費升級即可擁有完整的開發和正式環境
- ✅ Vercel 的自動部署免費使用

### 開發體驗

- ✅ 明確的環境對應關係
- ✅ 自動化部署流程
- ✅ 完整的測試環境

## 🎉 完成

所有代碼和文檔更新已完成！

**剩餘工作:**

- 在 Supabase Dashboard 手動更新專案名稱
- 驗證 Vercel 和 OAuth 設定
- 測試兩個環境的部署流程

---

**創建日期:** 2025-10-26  
**執行者:** AI Assistant  
**架構版本:** 2.0 (雙環境架構)
