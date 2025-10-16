# Migration 執行檢查清單

> 執行 `supabase_migration_cleanup_simple.sql` 前必讀  
> 創建時間：2025-10-16

---

## ⚠️ 重要警告

此 migration 會**永久刪除**以下欄位和資料：

### user_settings 表

- ❌ `user_agent` 欄位（及其所有資料）

### tasks 表

- ❌ `checked` 欄位（資料會遷移到 `is_completed`）
- ❌ `time` (text) 欄位（資料會遷移到 `due_time`，然後重新命名為 `time`）

---

## ✅ Migration 會做什麼

### 1. user_settings 表

**刪除**:

- `user_agent` 欄位

**保留並自動同步**:

- `display_name` - 創建 trigger 自動從 `auth.users` 同步
- `platform` - 保留，用於追蹤 web/ios/android
- `last_active_at` - 保留，追蹤最後活動時間

### 2. tasks 表

**資料遷移**:

```sql
-- 1. time (text) → due_time
UPDATE tasks SET due_time = time::time
WHERE due_time IS NULL AND time IS NOT NULL;

-- 2. checked → is_completed
UPDATE tasks SET is_completed = checked
WHERE is_completed != checked;
```

**刪除**:

- `checked` 欄位（已遷移到 `is_completed`）
- `time` (text) 欄位（已遷移到 `due_time`）

**重新命名**:

- `due_time` → `time` (類型：time without time zone)

**保留並自動同步**:

- `user_display_name` - 創建 trigger 自動從 `auth.users` 同步

---

## 🔍 執行前檢查

### 1. 檢查目前的資料

在 Supabase SQL Editor 執行：

```sql
-- 檢查有多少任務有 time (text) 資料
SELECT COUNT(*) as tasks_with_text_time
FROM public.tasks
WHERE time IS NOT NULL AND time != '';

-- 檢查有多少任務有 due_time 資料
SELECT COUNT(*) as tasks_with_due_time
FROM public.tasks
WHERE due_time IS NOT NULL;

-- 檢查 checked 和 is_completed 的差異
SELECT
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE checked = true) as checked_true,
  COUNT(*) FILTER (WHERE is_completed = true) as completed_true,
  COUNT(*) FILTER (WHERE checked != is_completed) as mismatched
FROM public.tasks;
```

**預期結果**:

- 應該看到有多少任務會被遷移
- 確認 `checked` 和 `is_completed` 是否一致

### 2. 備份資料（強烈建議）

```sql
-- 匯出 tasks 表
-- 在 Supabase Dashboard → Database → tables → tasks → Export as CSV

-- 或創建備份表
CREATE TABLE tasks_backup AS SELECT * FROM public.tasks;
CREATE TABLE user_settings_backup AS SELECT * FROM public.user_settings;
```

---

## 🚀 執行 Migration

### 步驟

1. **打開 Supabase Dashboard**

   - https://supabase.com/dashboard
   - 選擇 "To Do" 專案

2. **進入 SQL Editor**

   - 左側選單 → SQL Editor
   - 點擊 "New query"

3. **複製 SQL**

   - 打開 `supabase_migration_cleanup_simple.sql`
   - 全選複製（Cmd+A, Cmd+C）

4. **貼上並執行**

   - 貼到 SQL Editor（Cmd+V）
   - 點擊 "Run" 按鈕
   - 等待執行完成（約 5-10 秒）

5. **檢查執行結果**

應該看到類似這樣的輸出：

```
=== Checking user_settings table ===
✅ user_settings.user_agent removed
✅ user_settings.display_name kept (with auto-sync trigger)
✅ user_settings.platform exists (kept)
✅ user_settings.last_active_at exists (kept)

=== Checking tasks table ===
✅ tasks.checked removed
✅ tasks.user_display_name kept (with auto-sync trigger)
✅ tasks.time exists (type: time without time zone)
✅ tasks.due_time renamed to time
✅ tasks.time (text) removed

================================================
✅ Database cleanup completed successfully!
================================================
```

---

## 🧪 執行後驗證

### 1. 檢查表結構

```sql
-- user_settings 應該有 15 個欄位
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_settings';

-- tasks 應該有 16 個欄位
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks';
```

### 2. 檢查資料完整性

```sql
-- 檢查是否有任務遺失資料
SELECT
  id,
  title,
  time,
  is_completed,
  user_display_name
FROM public.tasks
WHERE time IS NULL OR user_display_name IS NULL
LIMIT 10;
```

### 3. 檢查 trigger 是否正常

```sql
-- 創建測試任務
INSERT INTO public.tasks (user_id, title, date)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Task',
  CURRENT_DATE
)
RETURNING id, user_display_name;

-- user_display_name 應該自動填充
-- 如果正確，刪除測試任務
-- DELETE FROM public.tasks WHERE title = 'Test Task';
```

---

## ❌ 如果執行失敗

### 常見錯誤

#### 錯誤 1: time (text) 無法轉換為 time

```
ERROR: invalid input syntax for type time
```

**解決方案**:

- 有些 `time` (text) 資料格式不正確
- 需要先清理資料

```sql
-- 檢查哪些資料有問題
SELECT id, title, time
FROM public.tasks
WHERE time IS NOT NULL
  AND time != ''
  AND time !~ '^\d{2}:\d{2}(:\d{2})?$';

-- 手動修正或刪除有問題的資料
```

#### 錯誤 2: 欄位不存在

```
ERROR: column "due_time" does not exist
```

**解決方案**:

- 檢查表結構
- 可能 migration 已經執行過

---

## 🔄 回滾方案

如果執行後發現問題，可以回滾：

```sql
-- 方案 1: 從備份表恢復
DROP TABLE public.tasks;
CREATE TABLE public.tasks AS SELECT * FROM tasks_backup;

DROP TABLE public.user_settings;
CREATE TABLE public.user_settings AS SELECT * FROM user_settings_backup;

-- 方案 2: 重新創建被刪除的欄位
ALTER TABLE public.user_settings ADD COLUMN user_agent TEXT;
ALTER TABLE public.tasks ADD COLUMN checked BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN time TEXT;
```

---

## ✅ 最終檢查清單

執行 migration 前：

- [ ] 已備份 tasks 表
- [ ] 已備份 user_settings 表
- [ ] 已檢查資料一致性
- [ ] 已準備好回滾方案
- [ ] 已更新程式碼到 v1.7.1
- [ ] 已理解此操作不可逆

執行 migration 後：

- [ ] 檢查欄位數量正確
- [ ] 檢查資料完整性
- [ ] 檢查 trigger 正常運作
- [ ] 測試 task 保存功能
- [ ] 測試登入功能

---

## 📝 總結

**Migration 檔案**: `supabase_migration_cleanup_simple.sql`

**安全性**: 🟡 中等

- 有資料遷移步驟
- 有驗證機制
- 建議先備份

**所需時間**: 5-10 秒

**影響範圍**:

- `user_settings`: 移除 1 個欄位
- `tasks`: 移除 2 個欄位，重新命名 1 個欄位

---

**準備好了嗎？**

如果確認，可以執行 migration 了！
