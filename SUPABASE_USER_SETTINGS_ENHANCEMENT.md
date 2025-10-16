# Supabase User Settings 增強功能

## 🎯 新增功能

### 1. 顯示用戶名稱 (Display Name)

- 自動從 Supabase `auth.users` 表格同步用戶的顯示名稱
- 支援 Google OAuth 的 `name` 或 `full_name` 欄位
- 如果沒有名稱，會使用 email 作為備選

### 2. 平台追蹤 (Platform Tracking)

- 自動記錄用戶使用的平台：`web`、`ios`、`android`
- 記錄詳細的 User Agent 資訊
- 追蹤最後活動時間

### 3. 資料庫增強

- 在 `public.user_settings` 表格新增 `display_name` 欄位
- 在 `public.user_settings` 表格新增 `platform` 欄位
- 在 `public.user_settings` 表格新增 `user_agent` 欄位
- 在 `public.user_settings` 表格新增 `last_active_at` 欄位
- 所有功能都直接在 `user_settings` 表格中實現，無需額外視圖

---

## 📋 設定步驟

### 步驟 1：執行資料庫遷移

在 Supabase Dashboard 的 SQL Editor 中執行：

```sql
-- 複製 supabase_migration_add_display_name_platform.sql 的內容
-- 貼上並執行
```

### 步驟 2：驗證安裝

執行以下查詢確認表格已更新：

```sql
-- 檢查新欄位
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- 檢查 user_settings 表格的新欄位
SELECT * FROM user_settings LIMIT 5;
```

### 步驟 3：測試功能

1. **登入應用程式**
2. **檢查 Supabase Dashboard**：
   ```sql
   SELECT
     us.user_id,
     us.display_name,
     au.email,
     us.platform,
     us.user_agent,
     us.last_active_at
   FROM user_settings us
   LEFT JOIN auth.users au ON us.user_id = au.id;
   ```

---

## 🔍 查詢範例

### 查看所有用戶的平台分佈

```sql
SELECT
  platform,
  COUNT(*) as user_count,
  MAX(last_active_at) as latest_activity
FROM user_settings
GROUP BY platform
ORDER BY user_count DESC;
```

### 查看特定用戶的完整資訊

```sql
SELECT
  us.display_name,
  au.email,
  us.platform,
  us.user_agent,
  us.language,
  us.theme,
  us.last_active_at,
  au.created_at as account_created_at,
  au.last_sign_in_at
FROM user_settings us
LEFT JOIN auth.users au ON us.user_id = au.id
WHERE us.user_id = 'your-user-id-here';
```

### 查看 Web 版用戶

```sql
SELECT
  us.display_name,
  au.email,
  us.user_agent,
  us.last_active_at
FROM user_settings us
LEFT JOIN auth.users au ON us.user_id = au.id
WHERE us.platform = 'web'
ORDER BY us.last_active_at DESC;
```

### 查看 iOS App 用戶

```sql
SELECT
  us.display_name,
  au.email,
  us.user_agent,
  us.last_active_at
FROM user_settings us
LEFT JOIN auth.users au ON us.user_id = au.id
WHERE us.platform = 'ios'
ORDER BY us.last_active_at DESC;
```

---

## 📱 程式碼使用範例

### 獲取用戶設定（包含認證資訊）

```javascript
import { UserService } from "./src/services/userService";

// 獲取完整用戶資訊
const userInfo = await UserService.getUserSettingsWithAuth();
console.log("User info:", {
  name: userInfo.display_name,
  email: userInfo.email,
  platform: userInfo.platform,
  lastActive: userInfo.last_active_at,
});
```

### 手動更新平台資訊

```javascript
// 當用戶開啟應用程式時自動調用
await UserService.updatePlatformInfo();
```

### 獲取平台資訊

```javascript
// 獲取當前平台的 User Agent
const userAgent = UserService.getUserAgent();
console.log("Current platform:", Platform.OS);
console.log("User Agent:", userAgent);
```

---

## 🛡️ 安全性

- 所有新欄位都遵循現有的 RLS (Row Level Security) 政策
- 用戶只能查看和修改自己的資料
- 視圖 `user_settings_with_auth` 也受到 RLS 保護

---

## 📊 資料結構

### user_settings 表格（更新後）

| 欄位名稱                | 類型         | 說明         | 預設值             |
| ----------------------- | ------------ | ------------ | ------------------ |
| `id`                    | UUID         | 主鍵         | 自動生成           |
| `user_id`               | UUID         | 用戶 ID      | -                  |
| `language`              | VARCHAR(10)  | 界面語言     | 'en'               |
| `theme`                 | VARCHAR(10)  | 界面主題     | 'light'            |
| `notifications_enabled` | BOOLEAN      | 通知開關     | true               |
| `display_name`          | VARCHAR(255) | 顯示名稱     | 從 auth.users 同步 |
| `platform`              | VARCHAR(20)  | 使用平台     | 'web'              |
| `user_agent`            | TEXT         | 用戶代理字串 | 自動生成           |
| `last_active_at`        | TIMESTAMP    | 最後活動時間 | 當前時間           |
| `created_at`            | TIMESTAMP    | 創建時間     | 當前時間           |
| `updated_at`            | TIMESTAMP    | 更新時間     | 當前時間           |

### 直接查詢方式

如果需要結合認證資訊，可以直接使用 JOIN 查詢：

```sql
SELECT
  us.*,
  au.email,
  au.created_at as auth_created_at,
  au.last_sign_in_at
FROM user_settings us
LEFT JOIN auth.users au ON us.user_id = au.id;
```

---

## 🔄 自動更新機制

1. **用戶登入時**：自動更新平台資訊和最後活動時間
2. **設定變更時**：自動更新平台資訊
3. **觸發器**：自動從 auth.users 同步顯示名稱

---

## 🧪 測試清單

- [ ] 執行資料庫遷移
- [ ] 驗證新欄位已創建
- [ ] 測試 Web 版登入
- [ ] 測試 iOS App 登入
- [ ] 檢查 display_name 自動同步
- [ ] 檢查 platform 欄位記錄
- [ ] 檢查 last_active_at 更新
- [ ] 驗證 RLS 政策正常運作

---

## 🚀 後續擴展

可以考慮新增：

1. **設備資訊**：記錄具體的設備型號
2. **應用程式版本**：記錄用戶使用的 App 版本
3. **地理位置**：記錄用戶的大概位置（需用戶同意）
4. **使用統計**：記錄功能使用頻率
5. **錯誤追蹤**：記錄用戶遇到的錯誤

---

**完成設定後，你就可以在 Supabase Dashboard 中看到每個用戶的完整資訊，包括顯示名稱和使用平台！** 🎉
