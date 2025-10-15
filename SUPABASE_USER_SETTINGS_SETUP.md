# Supabase 用戶設定表格設置指南

## 功能說明

此表格用於儲存用戶的個人化設定：

- ✅ **語言偏好**（繁體中文 / English）
- ✅ **主題模式**（淺色模式 / 深色模式）
- ✅ **通知設定**（未來功能）

---

## 快速設定步驟

### 步驟 1：登入 Supabase Dashboard

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案

### 步驟 2：執行 SQL 遷移

1. 點擊左側選單的 **SQL Editor**
2. 點擊 **New Query**
3. 複製 `supabase_migration_user_settings.sql` 的內容
4. 貼上到編輯器中
5. 點擊 **Run** 執行

### 步驟 3：驗證安裝

執行以下查詢確認表格已創建：

```sql
SELECT * FROM information_schema.tables
WHERE table_name = 'user_settings';
```

應該會看到一筆記錄。

### 步驟 4：測試功能

1. 在 App 中切換語言或主題
2. 在 Supabase Dashboard 中查看資料：
   ```sql
   SELECT * FROM public.user_settings;
   ```
3. 確認設定已儲存

---

## 資料庫結構

### user_settings 表格

| 欄位名稱                | 類型        | 說明                       | 預設值   |
| ----------------------- | ----------- | -------------------------- | -------- |
| `id`                    | UUID        | 主鍵                       | 自動生成 |
| `user_id`               | UUID        | 用戶 ID（關聯 auth.users） | -        |
| `language`              | VARCHAR(10) | 界面語言                   | 'en'     |
| `theme`                 | VARCHAR(10) | 界面主題                   | 'light'  |
| `notifications_enabled` | BOOLEAN     | 通知開關                   | true     |
| `created_at`            | TIMESTAMP   | 創建時間                   | 當前時間 |
| `updated_at`            | TIMESTAMP   | 更新時間                   | 當前時間 |

### 限制條件

- `language` 只能是 `'en'` 或 `'zh'`
- `theme` 只能是 `'light'` 或 `'dark'`
- 每個用戶只能有一筆設定記錄（UNIQUE constraint）

---

## App 程式碼說明

### 已實作的功能

#### 1. 讀取用戶設定

```javascript
// 在 App.js 中
const loadLanguage = async () => {
  const userSettings = await UserService.getUserSettings();
  setLanguageState(userSettings.language);
};

const loadTheme = async () => {
  const userSettings = await UserService.getUserSettings();
  setThemeModeState(userSettings.theme);
};
```

#### 2. 儲存用戶設定

```javascript
// 切換語言時自動儲存
const setLanguage = async (lang) => {
  setLanguageState(lang);
  await UserService.updateUserSettings({ language: lang });
};

// 切換主題時自動儲存
const setThemeMode = async (mode) => {
  setThemeModeState(mode);
  await UserService.updateUserSettings({ theme: mode });
};
```

### UserService API

#### `getUserSettings()`

獲取用戶設定（如果不存在則返回預設值）

**返回值：**

```javascript
{
  language: 'en' | 'zh',
  theme: 'light' | 'dark',
  notifications_enabled: boolean
}
```

#### `updateUserSettings(settings)`

更新用戶設定（使用 upsert，如果不存在則創建）

**參數：**

```javascript
{
  language?: 'en' | 'zh',
  theme?: 'light' | 'dark',
  notifications_enabled?: boolean
}
```

---

## 工作流程

### 用戶首次登入

1. App 呼叫 `getUserSettings()`
2. Supabase 查詢 `user_settings` 表格
3. 如果找不到記錄，返回預設值（英文 + 淺色模式）
4. App 使用預設值初始化 UI

### 用戶切換設定

1. 用戶在設定頁面切換語言或主題
2. App 呼叫 `updateUserSettings({ language: 'zh' })`
3. UserService 使用 `upsert` 寫入 Supabase
4. 如果是首次設定，會創建新記錄
5. 如果已有設定，會更新現有記錄

### 用戶再次登入

1. App 呼叫 `getUserSettings()`
2. Supabase 返回已儲存的設定
3. App 自動套用用戶的語言和主題偏好

---

## 安全性（RLS Policies）

已設定 Row Level Security，確保：

✅ 用戶只能讀取自己的設定  
✅ 用戶只能建立自己的設定  
✅ 用戶只能更新自己的設定  
✅ 用戶只能刪除自己的設定

**Policy 詳情：**

```sql
-- 範例：查看設定的 Policy
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);
```

這確保了 A 用戶無法存取 B 用戶的設定。

---

## 測試

### 手動測試步驟

1. **登入 App**
2. **切換語言**：英文 → 繁體中文
3. **切換主題**：淺色 → 深色
4. **登出**
5. **重新登入**
6. **驗證**：語言和主題應自動套用上次的設定

### SQL 查詢測試

```sql
-- 查看所有用戶設定
SELECT
  us.user_id,
  au.email,
  us.language,
  us.theme,
  us.notifications_enabled,
  us.created_at,
  us.updated_at
FROM public.user_settings us
JOIN auth.users au ON us.user_id = au.id;
```

---

## 故障排除

### 問題：設定沒有儲存

**檢查：**

1. 確認 `user_settings` 表格已創建
2. 確認 RLS Policies 已設定
3. 檢查 Console 是否有錯誤訊息
4. 確認用戶已登入（`auth.uid()` 不為空）

### 問題：RLS Policy 錯誤

**解決：**

```sql
-- 檢查 Policies
SELECT * FROM pg_policies WHERE tablename = 'user_settings';

-- 如果需要重新創建，先刪除舊的
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
-- 然後重新執行遷移檔案
```

### 問題：更新失敗

**檢查：**

```sql
-- 確認欄位限制
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_settings';
```

---

## 未來擴展

可以新增的欄位：

```sql
ALTER TABLE public.user_settings
ADD COLUMN reminder_minutes INTEGER[] DEFAULT ARRAY[30];

ALTER TABLE public.user_settings
ADD COLUMN notification_sound VARCHAR(50) DEFAULT 'default';

ALTER TABLE public.user_settings
ADD COLUMN week_starts_on INTEGER DEFAULT 0 CHECK (week_starts_on >= 0 AND week_starts_on <= 6);
```

---

## 相關檔案

- **SQL 遷移**：`supabase_migration_user_settings.sql`
- **UserService**：`src/services/userService.js`
- **App 整合**：`App.js`（搜尋 `getUserSettings` 和 `updateUserSettings`）

---

## 需要協助？

如果遇到問題：

1. 檢查 Supabase Dashboard 的 Logs
2. 檢查 App 的 Console 輸出
3. 確認網路連線正常
4. 確認 Supabase Project 狀態正常

