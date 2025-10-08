# 添加 Note 欄位到資料庫

## 📝 說明

這個 migration 會在 `tasks` 資料表中添加一個新的 `note` 欄位，用來儲存任務的備註內容。

## 🚀 執行 Migration

### 方法 1：使用 Supabase Dashboard（推薦）

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點擊左側選單的 **SQL Editor**
4. 點擊 **New Query**
5. 複製 `supabase_migration_add_note.sql` 文件的內容
6. 貼上到 SQL Editor
7. 點擊 **Run** 執行

### 方法 2：使用 Supabase CLI

如果你已經安裝 Supabase CLI：

```bash
# 1. 進入專案目錄
cd /Users/hububble/Desktop/Too-Doo-List

# 2. 執行 migration
supabase db push
```

### 方法 3：直接使用 SQL

你也可以直接在 Supabase SQL Editor 中執行以下 SQL：

```sql
-- 添加 note 欄位
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS note TEXT;

-- 添加欄位說明
COMMENT ON COLUMN tasks.note IS 'User notes or additional comments for the task';
```

## ✅ 驗證

執行完成後，你可以在 Supabase Dashboard 中驗證：

1. 前往 **Table Editor**
2. 選擇 `tasks` 資料表
3. 確認是否有 `note` 欄位

或者在 SQL Editor 執行：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'note';
```

## 📊 欄位資訊

- **欄位名稱**: `note`
- **資料類型**: `TEXT`
- **是否可為空**: `YES`
- **預設值**: `NULL`
- **用途**: 儲存任務的備註或額外說明

## 🔄 Rollback（回滾）

如果需要移除這個欄位，可以執行：

```sql
ALTER TABLE tasks DROP COLUMN IF EXISTS note;
```

**⚠️ 注意**: 回滾會永久刪除所有備註資料，請謹慎操作！

## 📝 相關檔案更新

已更新的檔案：

- ✅ `src/types/taskTypes.js` - 添加 NOTE 欄位常數
- ✅ `src/services/taskService.js` - 處理 note 欄位的讀寫
- ✅ `App.js` - UI 表單和狀態管理

## 🎯 下一步

執行完 migration 後，重新啟動應用程式：

```bash
npx expo start --web --port 8082
```

現在你可以在建立或編輯任務時使用備註功能了！
