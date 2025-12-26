# Supabase 時間戳記格式統一說明

## 📋 概述

所有 Supabase 數據庫中的時間戳記欄位已統一使用 `timestamptz` (timestamp with time zone) 類型，確保時間數據的一致性和時區處理的正確性。

---

## ✅ 已統一的時間戳記欄位

### 1. `public.tasks` 表

| 欄位名稱       | 資料類型      | 說明             |
| -------------- | ------------- | ---------------- |
| `completed_at` | `timestamptz` | 任務完成時間     |
| `created_at`   | `timestamptz` | 任務創建時間     |
| `updated_at`   | `timestamptz` | 任務最後更新時間 |

### 2. `public.user_settings` 表

| 欄位名稱         | 資料類型      | 說明                 |
| ---------------- | ------------- | -------------------- |
| `last_active_at` | `timestamptz` | 用戶最後活動時間     |
| `created_at`     | `timestamptz` | 設定記錄創建時間     |
| `updated_at`     | `timestamptz` | 設定記錄最後更新時間 |

---

## 🔍 驗證 SQL 查詢

### 檢查所有時間戳記欄位的資料類型

```sql
-- 檢查 tasks 表的時間戳記欄位
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
  AND column_name IN ('completed_at', 'created_at', 'updated_at')
ORDER BY column_name;

-- 檢查 user_settings 表的時間戳記欄位
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_settings'
  AND column_name IN ('last_active_at', 'created_at', 'updated_at')
ORDER BY column_name;
```

### 檢查所有表的時間戳記欄位（完整檢查）

```sql
-- 查找所有使用 timestamptz 的欄位
SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'timestamp with time zone'
ORDER BY table_name, column_name;
```

---

## 📝 時間戳記格式說明

### 存儲格式

- **數據庫存儲**: PostgreSQL `timestamptz` 類型
- **內部格式**: UTC 時間（自動轉換）
- **顯示格式**: 根據時區設定自動轉換

### 範例值

```
原始格式: 2025-12-21 13:49:07.803079+00
```

### 在 Supabase Dashboard 中的顯示

Supabase Dashboard 會根據您的時區設定自動格式化顯示時間，例如：

- **UTC**: `2025-12-21 13:49:07+00`
- **UTC+8**: `2025-12-21 21:49:07+08` (自動轉換)

---

## 🛠️ 使用建議

### 1. 查詢時格式化時間戳記

如果需要自定義格式，可以使用 PostgreSQL 的 `to_char()` 函數：

```sql
-- 格式化為易讀格式
SELECT
    id,
    title,
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at_formatted,
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at_formatted
FROM public.tasks
WHERE user_id = 'YOUR_USER_ID';
```

### 2. 在應用程式中處理時間戳記

應用程式已提供 `formatTimestamp()` 工具函數（位於 `src/utils/dateUtils.js`），可在需要時格式化時間戳記：

```javascript
import { formatTimestamp } from "./src/utils/dateUtils";

// 格式化時間戳記
const formattedDate = formatTimestamp(task.created_at, language, true);
```

---

## ✅ 統一性檢查清單

- [x] `tasks.created_at` - `timestamptz`
- [x] `tasks.updated_at` - `timestamptz`
- [x] `tasks.completed_at` - `timestamptz`
- [x] `user_settings.created_at` - `timestamptz`
- [x] `user_settings.updated_at` - `timestamptz`
- [x] `user_settings.last_active_at` - `timestamptz`

---

## 📚 相關文檔

- [Supabase Schema Overview](./SUPABASE_SCHEMA_OVERVIEW.md)
- [Date Utils 工具函數](../../src/utils/dateUtils.js)

---

**最後更新**: 2025-12-21  
**狀態**: ✅ 所有時間戳記欄位已統一使用 `timestamptz`
