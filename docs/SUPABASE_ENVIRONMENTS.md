# Supabase 雙環境配置指南

## 🏗️ 環境架構（簡化版）

### 環境對應
由於 Supabase Free Plan 限制為 2 個 projects，採用簡化的雙環境架構：

- **Staging 環境**（開發 + 測試）: `to-do-staging` 專案
  - Project ID: `qerosiozltqrbehctxdn`
  - Region: ap-southeast-1
  - 用途: 開發、測試、功能驗證
  
- **Production 環境**（正式）: `to-do-production` 專案
  - Project ID: `ajbusqpjsjcuzzxuueij`
  - Region: ap-south-1
  - 用途: 正式上線、生產環境
  - 註: 原名為 `to-do-dev`，已更名為 `to-do-production`

## 📋 環境對應關係

### Staging 環境
```
GitHub Branch: develop
Vercel Project: To Do Staging
Supabase Project: to-do-staging (qerosiozltqrbehctxdn)
環境變數前綴: EXPO_PUBLIC_SUPABASE_URL_DEV / EXPO_PUBLIC_SUPABASE_URL_STAGING
```

### Production 環境
```
GitHub Branch: main
Vercel Project: To Do Production
Supabase Project: to-do-production (ajbusqpjsjcuzzxuueij)
環境變數前綴: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_URL_PROD
```

## 🔧 Supabase Project 詳細資訊

### to-do-staging
```yaml
Project ID: qerosiozltqrbehctxdn
Database Host: db.qerosiozltqrbehctxdn.supabase.co
Region: ap-southeast-1 (Singapore)
Created: 2025-10-05
Status: ACTIVE_HEALTHY
PostgreSQL: 17.6.1.011
```

**用途:**
- 功能開發和測試
- 整合測試
- UI/UX 測試
- 可以自由修改和重置資料
- 不需要嚴格的資料保護

**RLS 設定:**
- 啟用 RLS 但允許更寬鬆的測試
- 可以暫時關閉某些安全限制進行調試

### to-do-production
```yaml
Project ID: ajbusqpjsjcuzzxuueij
Database Host: db.ajbusqpjsjcuzzxuueij.supabase.co
Region: ap-south-1 (Mumbai)
Created: 2025-10-23
Status: ACTIVE_HEALTHY
PostgreSQL: 17.6.1.025
```

**用途:**
- 正式上線環境
- 真實用戶資料
- 嚴格的資料保護
- 高可用性要求

**RLS 設定:**
- 嚴格執行 RLS 政策
- 最高安全級別
- 生產資料保護

## 🔄 資料庫結構同步

### 使用 Supabase CLI 同步結構

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入 Supabase
supabase login

# 連結到 Staging 專案
supabase link --project-ref qerosiozltqrbehctxdn

# 從 Staging 導出結構
supabase db dump --schema public > schema-staging.sql

# 切換到 Production 專案
supabase link --project-ref ajbusqpjsjcuzzxuueij

# 應用到 Production（謹慎執行！）
psql -h db.ajbusqpjsjcuzzxuueij.supabase.co -U postgres -d postgres -f schema-staging.sql
```

### Migration 檔案管理

專案中的 Migration 檔案：
- `supabase_migration_add_note.sql` - 新增備註欄位
- `supabase_migration_cleanup_simple.sql` - 資料庫清理
- `supabase_migration_user_settings.sql` - 使用者設定
- `supabase_migration_version_check.sql` - 版本檢查

**執行順序:**
1. 先在 Staging 環境測試
2. 驗證無誤後再應用到 Production

## 🔒 環境變數設定

### Staging 環境變數
```bash
# .env.development 或 Vercel Staging Environment Variables
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-staging-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

### Production 環境變數
```bash
# .env.production 或 Vercel Production Environment Variables
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

## 📊 資料隔離策略

### Staging 環境
- 使用測試資料
- 可以自由修改和重置
- 不影響正式環境
- 定期清理測試資料

### Production 環境
- 真實用戶資料
- 嚴格備份策略
- 高可用性設定
- 不可隨意修改

## 🔐 安全性設定

### RLS Policies

**Staging:** 較寬鬆，便於測試
```sql
-- 開發者可以查看所有資料（測試用）
CREATE POLICY "Allow developers to view all data in staging"
  ON tasks FOR SELECT
  USING (true);
```

**Production:** 嚴格限制
```sql
-- 用戶只能查看自己的資料
CREATE POLICY "Users can only view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

### API 金鑰管理
- 定期輪換 API 金鑰
- 使用環境變數管理
- 不在代碼中硬編碼
- Staging 和 Production 使用不同的金鑰

## 📈 監控和備份

### 備份策略
- **Staging**: 每週備份（資料可重建）
- **Production**: 每日自動備份 + 重要操作前手動備份

### 監控設定
在 Supabase Dashboard 監控：
- 資料庫性能
- 連接數
- 錯誤率
- 儲存空間
- API 請求量

## 🚀 部署流程

### Staging 部署
```bash
# 1. 在 develop 分支開發
git checkout develop

# 2. 測試完成後推送
git push origin develop

# 3. Vercel 自動部署到 Staging
# 4. 使用 Staging Supabase (qero...)
```

### Production 部署
```bash
# 1. 從 develop 合併到 main
git checkout main
git merge develop

# 2. 推送到 main
git push origin main

# 3. Vercel 自動部署到 Production
# 4. 使用 Production Supabase (ajbu...)
```

## ⚠️ 重要注意事項

1. **Supabase Project 名稱**
   - Project 名稱在 Dashboard 中可以修改（僅顯示用）
   - 實際連接使用 Project ID，不受名稱影響
   - URL 格式: `https://{project-id}.supabase.co`

2. **環境隔離**
   - Staging 和 Production 完全隔離
   - 不可在 Production 進行測試
   - 所有變更必須先在 Staging 驗證

3. **資料遷移**
   - 不要將 Staging 資料遷移到 Production
   - Production 資料是真實用戶資料，需嚴格保護
   - 結構變更使用 Migration 檔案管理

4. **存取控制**
   - Staging: 開發團隊可存取
   - Production: 僅限授權人員存取
   - 使用不同的資料庫密碼

## 🔗 相關文檔

- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Vercel 部署配置
- [SUPABASE_SCHEMA_OVERVIEW.md](./SUPABASE_SCHEMA_OVERVIEW.md) - 資料庫結構概覽
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - 環境變數說明

## 🆘 故障排除

### 連接問題
```bash
# 檢查 Supabase 狀態
curl https://qerosiozltqrbehctxdn.supabase.co/rest/v1/
curl https://ajbusqpjsjcuzzxuueij.supabase.co/rest/v1/
```

### 環境變數問題
```bash
# 檢查當前環境配置
console.log(getSupabaseConfig());
console.log(getCurrentEnvironment());
```

### Migration 問題
- 先在 Staging 測試 Migration
- 檢查 SQL 語法錯誤
- 注意外鍵依賴關係
- 備份後再執行

## 📞 支援資源

- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Docs: https://supabase.com/docs
- Supabase CLI: https://supabase.com/docs/guides/cli
