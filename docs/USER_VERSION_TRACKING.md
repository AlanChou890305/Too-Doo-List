# 用戶版本追蹤功能說明

## 📋 功能概述

此功能允許你在 Supabase 中追蹤每個用戶當前使用的 App 版本號和 Build 號碼。

## 🗄️ 資料庫結構

### user_settings 表新增欄位

| 欄位名稱             | 資料類型 | 說明                          | 範例  |
| -------------------- | -------- | ----------------------------- | ----- |
| `app_version`        | varchar  | 用戶當前使用的 App 版本號     | 1.2.3 |
| `app_build_number`   | varchar  | 用戶當前使用的 Build 號碼     | 11    |

## 🚀 部署步驟

### 1. 執行資料庫 Migration

在 Supabase SQL Editor 中執行：

```bash
# 檔案位置
supabase_migration_add_version_tracking.sql
```

或直接執行以下 SQL：

```sql
-- Add version tracking columns
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS app_version varchar,
ADD COLUMN IF NOT EXISTS app_build_number varchar;

-- Add comments
COMMENT ON COLUMN public.user_settings.app_version IS 'User''s current app version (e.g., 1.2.3)';
COMMENT ON COLUMN public.user_settings.app_build_number IS 'User''s current build number (e.g., 11)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_app_version
ON public.user_settings(app_version, platform);
```

### 2. 代碼已自動更新

✅ `userService.js` 已修改，`updatePlatformInfo()` 方法會自動更新版本資訊
✅ 當用戶啟動 App 時，版本號會自動記錄到資料庫

### 3. 驗證功能

在 Supabase SQL Editor 執行：

```sql
-- 檢查欄位是否成功添加
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_settings'
  AND column_name IN ('app_version', 'app_build_number');
```

## 📊 常用查詢

### 1. 查看所有用戶的版本分佈

```sql
SELECT
  app_version,
  app_build_number,
  platform,
  COUNT(*) as user_count,
  MAX(last_active_at) as latest_activity
FROM public.user_settings
WHERE app_version IS NOT NULL
GROUP BY app_version, app_build_number, platform
ORDER BY app_version DESC, app_build_number DESC;
```

**範例結果：**

| app_version | app_build_number | platform | user_count | latest_activity      |
| ----------- | ---------------- | -------- | ---------- | -------------------- |
| 1.2.3       | 11               | ios      | 45         | 2026-01-31 10:30:00  |
| 1.2.2       | 10               | ios      | 23         | 2026-01-30 15:20:00  |
| 1.2.3       | 11               | web      | 12         | 2026-01-31 09:15:00  |

---

### 2. 查看使用舊版本的用戶

```sql
-- 查看不是最新版本的用戶
SELECT
  display_name,
  platform,
  app_version,
  app_build_number,
  last_active_at,
  CASE
    WHEN last_active_at > NOW() - INTERVAL '7 days' THEN '活躍用戶'
    WHEN last_active_at > NOW() - INTERVAL '30 days' THEN '最近活躍'
    ELSE '不活躍'
  END as activity_status
FROM public.user_settings
WHERE app_version IS NOT NULL
  AND app_version < '1.2.3'  -- 替換為當前最新版本
ORDER BY last_active_at DESC;
```

---

### 3. 查看平台分佈

```sql
SELECT
  platform,
  app_version,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM public.user_settings
WHERE app_version IS NOT NULL
GROUP BY platform, app_version
ORDER BY platform, app_version DESC;
```

---

### 4. 查看特定用戶的版本資訊

```sql
SELECT
  display_name,
  platform,
  app_version,
  app_build_number,
  last_active_at,
  created_at,
  AGE(NOW(), last_active_at) as inactive_duration
FROM public.user_settings
WHERE user_id = 'YOUR_USER_ID';
```

---

### 5. 版本採用率分析

```sql
-- 計算最新版本的採用率
WITH version_stats AS (
  SELECT
    app_version,
    COUNT(*) as user_count,
    MAX(last_active_at) as latest_activity
  FROM public.user_settings
  WHERE app_version IS NOT NULL
    AND last_active_at > NOW() - INTERVAL '30 days'  -- 只看活躍用戶
  GROUP BY app_version
),
total_users AS (
  SELECT COUNT(*) as total
  FROM public.user_settings
  WHERE app_version IS NOT NULL
    AND last_active_at > NOW() - INTERVAL '30 days'
)
SELECT
  v.app_version,
  v.user_count,
  ROUND(v.user_count * 100.0 / t.total, 2) as adoption_rate_percent,
  v.latest_activity
FROM version_stats v
CROSS JOIN total_users t
ORDER BY v.app_version DESC;
```

---

### 6. 尋找需要更新的活躍用戶

```sql
-- 找出使用舊版本但最近7天活躍的用戶（可以推送更新通知）
SELECT
  display_name,
  platform,
  app_version,
  app_build_number,
  last_active_at
FROM public.user_settings
WHERE app_version IS NOT NULL
  AND app_version < '1.2.3'  -- 替換為當前最新版本
  AND last_active_at > NOW() - INTERVAL '7 days'
ORDER BY last_active_at DESC;
```

---

## 🔧 工作原理

### 自動更新流程

1. **用戶啟動 App**
2. **App.js 調用** `UserService.updatePlatformInfo()`
3. **自動獲取版本資訊** 從 `versionService.getCurrentVersionInfo()`
4. **更新到資料庫**：
   - `platform`: "ios" / "android" / "web"
   - `app_version`: "1.2.3"
   - `app_build_number`: "11"
   - `last_active_at`: 當前時間

### 代碼位置

- **服務層**: `src/services/userService.js` → `updatePlatformInfo()`
- **版本服務**: `src/services/versionService.js` → `getCurrentVersionInfo()`
- **調用位置**: `App.js` → 用戶登入後

---

## 📈 使用場景

### 1. 版本發布監控

發布新版本後，使用查詢 1 監控用戶升級情況：

```sql
-- 每天檢查版本採用率
SELECT
  app_version,
  COUNT(*) as users,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percent
FROM public.user_settings
WHERE last_active_at > NOW() - INTERVAL '7 days'
GROUP BY app_version
ORDER BY app_version DESC;
```

### 2. 推送更新通知

找出需要更新的活躍用戶，發送 Push Notification：

```sql
-- 匯出需要更新的用戶列表
SELECT
  user_id,
  display_name,
  platform,
  app_version
FROM public.user_settings
WHERE app_version < '1.2.3'
  AND last_active_at > NOW() - INTERVAL '7 days';
```

### 3. 相容性規劃

了解是否可以棄用舊版本 API：

```sql
-- 檢查仍在使用非常舊版本的用戶數
SELECT
  COUNT(*) as old_version_users,
  MIN(app_version) as oldest_version
FROM public.user_settings
WHERE app_version < '1.2.0'
  AND last_active_at > NOW() - INTERVAL '30 days';
```

---

## 🎯 最佳實踐

1. **定期監控**：每週檢查版本分佈
2. **活躍用戶優先**：關注最近活躍用戶的版本
3. **平台差異**：iOS 和 Web 版本可能不同步，分開統計
4. **更新提醒**：對使用舊版本的活躍用戶推送更新通知
5. **數據保留**：保留歷史版本數據用於分析

---

## 🐛 故障排查

### 問題：用戶版本顯示為 NULL

**可能原因：**
- 用戶還沒有重新打開 App
- Migration 尚未執行
- `updatePlatformInfo()` 沒有被調用

**解決方案：**
1. 確認 Migration 已執行
2. 檢查 App.js 是否調用 `updatePlatformInfo()`
3. 讓用戶重新啟動 App

---

### 問題：版本號不正確

**可能原因：**
- `versionService.js` 中的 fallback 版本號沒有更新
- `app.config.js` 或 `package.json` 版本號不一致

**解決方案：**
1. 檢查 `versionService.js` 的 `currentVersion` 和 `currentBuildNumber`
2. 確保所有配置文件版本號一致

---

## 📝 維護清單

發布新版本時的檢查清單：

- [ ] 更新 `package.json` 版本號
- [ ] 更新 `app.config.js` 版本號和 Build 號
- [ ] 更新 `versionService.js` fallback 版本號
- [ ] 更新所有 iOS native 文件版本號
- [ ] 執行 Archive 並上傳到 App Store
- [ ] 24 小時後檢查版本採用率
- [ ] 7 天後評估是否推送更新提醒

---

**文檔版本**: 1.0
**最後更新**: 2026-01-31
**適用 App 版本**: v1.2.3+
