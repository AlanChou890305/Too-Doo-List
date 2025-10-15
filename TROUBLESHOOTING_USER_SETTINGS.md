# 用戶設定故障排除指南

## 問題：Supabase 沒有儲存語言/主題設定

### 診斷步驟

#### 步驟 1：檢查 Supabase 表格是否存在

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案
3. 點擊 **Table Editor**
4. 查找 `user_settings` 表格

**如果找不到表格：**

```sql
-- 在 SQL Editor 中執行
SELECT * FROM information_schema.tables
WHERE table_name = 'user_settings';
```

如果沒有結果，需要執行：`supabase_migration_user_settings.sql`

---

#### 步驟 2：檢查 RLS Policies

```sql
-- 檢查 Policies 是否存在
SELECT * FROM pg_policies
WHERE tablename = 'user_settings';
```

應該看到 4 個 Policies：

- `Users can view their own settings`
- `Users can insert their own settings`
- `Users can update their own settings`
- `Users can delete their own settings`

**如果沒有 Policies：**
重新執行 `supabase_migration_user_settings.sql` 的 RLS 部分

---

#### 步驟 3：測試 App 並查看 Console

1. 開啟 App（在 Expo Go 或真機上）
2. 開啟 Console（Metro Bundler 或 Xcode）
3. 切換語言到「繁體中文」
4. 查看 Console 輸出：

**正常輸出：**

```
🌐 Setting language to: zh
✅ Language saved to Supabase: { language: 'zh', theme: 'light', ... }
```

**錯誤輸出：**

```
❌ Error saving language to Supabase: [錯誤訊息]
```

---

#### 步驟 4：直接檢查 Supabase 資料

```sql
-- 查看所有用戶設定
SELECT
  us.user_id,
  au.email,
  us.language,
  us.theme,
  us.created_at,
  us.updated_at
FROM public.user_settings us
JOIN auth.users au ON us.user_id = au.id;
```

**預期結果：**

```
user_id                              | email           | language | theme | created_at          | updated_at
-------------------------------------|-----------------|----------|-------|---------------------|------------
abc-123-def-456...                   | user@gmail.com  | zh       | dark  | 2025-10-15 10:00:00 | 2025-10-15 10:05:00
```

---

#### 步驟 5：手動測試 upsert

```sql
-- 假設你的 user_id 是 'YOUR_USER_ID'
-- 手動插入/更新測試

INSERT INTO public.user_settings (user_id, language, theme)
VALUES ('YOUR_USER_ID', 'zh', 'dark')
ON CONFLICT (user_id)
DO UPDATE SET
  language = EXCLUDED.language,
  theme = EXCLUDED.theme,
  updated_at = now();
```

---

## 常見問題

### 問題 1：`user_settings` 表格不存在

**解決方法：**

1. 確認已執行 `supabase_migration_user_settings.sql`
2. 在 Supabase Dashboard → SQL Editor 中重新執行
3. 檢查是否有錯誤訊息

---

### 問題 2：RLS Policy 阻擋了 INSERT

**症狀：**
Console 顯示：

```
Error: new row violates row-level security policy
```

**解決方法：**

```sql
-- 確認 INSERT Policy 存在
SELECT * FROM pg_policies
WHERE tablename = 'user_settings'
AND policyname = 'Users can insert their own settings';

-- 如果不存在，重新創建
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

### 問題 3：`auth.uid()` 返回 NULL

**原因：** 用戶未正確登入

**診斷：**

```sql
-- 檢查當前用戶
SELECT auth.uid();
```

**解決方法：**

1. 確認用戶已登入
2. 在 App Console 中檢查：
   ```javascript
   const {
     data: { user },
   } = await supabase.auth.getUser();
   console.log("Current user:", user);
   ```

---

### 問題 4：更新成功但重新登入後沒有載入

**可能原因：**

1. `getUserSettings()` 有錯誤但被 catch 住
2. 返回了預設值而非實際儲存的值

**診斷：**
查看 App Console 的載入日誌：

```
🌐 Loading language settings from Supabase...
📦 User settings received: { language: '??', theme: '??' }
```

**解決方法：**
檢查 `userService.js` 中的 `getUserSettings()` 是否正確查詢：

```javascript
const { data, error } = await supabase
  .from("user_settings")
  .select("*")
  .eq("user_id", user.id)
  .single();
```

---

### 問題 5：多個相同 user_id 的記錄

**症狀：**

```
Error: Query returned more than one row
```

**解決方法：**

```sql
-- 刪除重複記錄，只保留最新的
DELETE FROM public.user_settings a
USING public.user_settings b
WHERE a.user_id = b.user_id
AND a.id < b.id;

-- 確認 UNIQUE constraint 存在
ALTER TABLE public.user_settings
ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);
```

---

## 強制重新同步設定

如果所有方法都失敗，可以手動重置：

### 方法 A：在 Supabase 中手動設定

```sql
-- 使用你的實際 user_id
INSERT INTO public.user_settings (user_id, language, theme)
VALUES ('YOUR_USER_ID', 'zh', 'dark')
ON CONFLICT (user_id)
DO UPDATE SET
  language = 'zh',
  theme = 'dark',
  updated_at = now();
```

### 方法 B：清空並重新創建

```sql
-- 刪除你的設定（會重新創建）
DELETE FROM public.user_settings
WHERE user_id = 'YOUR_USER_ID';

-- 然後在 App 中切換語言，會自動創建新記錄
```

---

## Debug Console 命令

在 App 中運行 Metro Bundler 時，按 `d` 打開 Debug Menu，然後在 Chrome DevTools Console 中執行：

```javascript
// 檢查當前用戶
supabase.auth.getUser().then(({ data }) => console.log("User:", data.user));

// 檢查當前設定
import { UserService } from "./src/services/userService";
UserService.getUserSettings().then((settings) =>
  console.log("Settings:", settings)
);

// 強制更新設定
UserService.updateUserSettings({ language: "zh", theme: "dark" }).then(
  (result) => console.log("Update result:", result)
);
```

---

## 檢查清單

在報告問題前，請檢查：

- [ ] `user_settings` 表格已創建
- [ ] RLS Policies 已設定（4 個）
- [ ] 用戶已成功登入（有 session）
- [ ] Console 中有看到載入/儲存的日誌
- [ ] Supabase Project 狀態正常（無暫停）
- [ ] 網路連線正常

---

## 獲取你的 User ID

在 App Console 中查看：

```javascript
supabase.auth.getUser().then(({ data }) => {
  console.log("Your user_id:", data.user?.id);
});
```

或在 Supabase Dashboard → Authentication → Users 中查看。

---

## 聯絡支援

如果以上方法都無法解決，請提供：

1. Console 完整日誌
2. Supabase SQL 查詢結果
3. 你的 user_id
4. 錯誤截圖
