# Supabase 多環境配置指南

## 🏗️ 環境架構

### 環境對應
- **開發環境**: `too-doo-list-dev` 專案
- **測試環境**: `too-doo-list-staging` 專案
- **正式環境**: `too-doo-list-prod` 專案

## 📋 設定步驟

### 1. 創建 Supabase 專案

#### 開發環境專案
```bash
專案名稱: too-doo-list-dev
組織: your-organization
地區: 選擇最近的區域
資料庫密碼: 設定強密碼
```

#### 測試環境專案
```bash
專案名稱: too-doo-list-staging
組織: your-organization
地區: 選擇最近的區域
資料庫密碼: 設定強密碼
```

#### 正式環境專案
```bash
專案名稱: too-doo-list-prod
組織: your-organization
地區: 選擇最近的區域
資料庫密碼: 設定強密碼
```

### 2. 資料庫結構同步

#### 使用 Supabase CLI 同步結構
```bash
# 安裝 Supabase CLI
npm install -g supabase

# 初始化專案
supabase init

# 登入 Supabase
supabase login

# 連結到各環境專案
supabase link --project-ref your-dev-project-ref
supabase link --project-ref your-staging-project-ref
supabase link --project-ref your-prod-project-ref
```

#### 資料庫遷移
```bash
# 從開發環境導出結構
supabase db dump --schema public > schema-dev.sql

# 應用到測試環境
supabase db reset --linked

# 應用到正式環境
supabase db reset --linked
```

### 3. 環境變數配置

#### 開發環境變數
```bash
EXPO_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your-dev-anon-key
```

#### 測試環境變數
```bash
EXPO_PUBLIC_SUPABASE_URL_STAGING=https://your-staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING=your-staging-anon-key
```

#### 正式環境變數
```bash
EXPO_PUBLIC_SUPABASE_URL_PROD=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD=your-prod-anon-key
```

### 4. RLS (Row Level Security) 設定

#### 開發環境
- 啟用 RLS 但允許更寬鬆的測試
- 可以暫時關閉某些安全限制進行調試

#### 測試環境
- 完全啟用 RLS
- 模擬正式環境的安全設定
- 使用測試資料

#### 正式環境
- 嚴格執行 RLS 政策
- 最高安全級別
- 生產資料保護

### 5. 資料隔離策略

#### 開發環境
- 使用測試資料
- 可以自由修改和重置
- 不影響其他環境

#### 測試環境
- 使用模擬資料
- 定期重置為乾淨狀態
- 用於整合測試

#### 正式環境
- 真實用戶資料
- 嚴格備份策略
- 高可用性設定

## 🔧 資料遷移流程

### 1. 結構遷移
```sql
-- 從開發環境導出結構
pg_dump -h your-dev-db-host -U postgres -s -n public your-db > schema.sql

-- 應用到測試環境
psql -h your-staging-db-host -U postgres -d your-db -f schema.sql

-- 應用到正式環境
psql -h your-prod-db-host -U postgres -d your-db -f schema.sql
```

### 2. 資料遷移
```sql
-- 測試資料遷移到測試環境
INSERT INTO staging.tasks SELECT * FROM dev.tasks WHERE is_test_data = true;

-- 不遷移正式環境資料（保持隔離）
```

## 📊 監控和備份

### 1. 備份策略
- **開發環境**: 每日備份
- **測試環境**: 每週備份
- **正式環境**: 每小時備份 + 即時複製

### 2. 監控設定
- 資料庫性能監控
- 連接數監控
- 錯誤率監控
- 儲存空間監控

### 3. 告警設定
- 資料庫連接失敗
- 高錯誤率
- 儲存空間不足
- 性能下降

## ⚠️ 安全注意事項

### 1. 存取控制
- 開發環境: 開發團隊存取
- 測試環境: 測試團隊存取
- 正式環境: 僅限授權人員存取

### 2. API 金鑰管理
- 定期輪換 API 金鑰
- 使用環境變數管理
- 不在代碼中硬編碼

### 3. 資料保護
- 敏感資料加密
- 定期安全審計
- 存取日誌記錄

## 🎯 最佳實踐

1. **環境隔離**: 確保各環境完全隔離
2. **資料安全**: 嚴格控制資料存取
3. **備份策略**: 定期備份重要資料
4. **監控告警**: 即時監控環境狀態
5. **版本控制**: 使用 Git 管理資料庫變更
