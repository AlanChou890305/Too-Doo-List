# User Settings 測試指南

## 修復內容

### 🐛 問題
- user_settings 表出現重複鍵錯誤：`duplicate key value violates unique constraint "user_settings_user_id_key"`
- 首次登入的用戶沒有自動創建 user_settings 記錄
- upsert 操作沒有正確處理衝突

### ✅ 修復方案

#### 1. **修復 updateUserSettings (upsert 操作)**
```javascript
// 添加 onConflict 參數
.upsert({
  user_id: user.id,
  ...settingsWithPlatform,
}, {
  onConflict: 'user_id'  // 明確指定衝突欄位
})
```

#### 2. **修復 getUserSettings (自動創建記錄)**
- 檢測錯誤碼 `PGRST116` (記錄不存在)
- 自動創建預設 user_settings 記錄
- 包含 language, theme, platform, user_agent

#### 3. **修復 updatePlatformInfo**
- 先調用 `getUserSettings()` 確保記錄存在
- 使用 `update()` 而非 `upsert()`
- 避免重複鍵衝突

---

## 測試流程

### 測試 1: 新用戶首次登入
**目的**: 確認 user_settings 自動創建

1. 使用新的 Google 帳號登入
2. 檢查 console log，應該看到：
   ```
   📝 Creating default user settings for new user
   ✅ Default user settings created
   ```
3. 檢查 Supabase `user_settings` 表，應該有新記錄：
   - `user_id`: 用戶 ID
   - `language`: "en"
   - `theme`: "light"
   - `platform`: "web" 或 "ios"
   - `notifications_enabled`: true

**預期結果**:
- ✅ 自動創建 user_settings 記錄
- ✅ 無錯誤訊息
- ✅ 可以正常進入 App

---

### 測試 2: 語言設定保存
**目的**: 確認 language 設定可以保存到 Supabase

1. 登入 App
2. 進入 Settings 頁面
3. 切換語言：English ↔ 繁體中文
4. 檢查 console log，應該看到：
   ```
   🌐 Setting language to: zh (或 en)
   ✅ Language and platform saved to Supabase: {...}
   ```
5. 檢查 Supabase `user_settings` 表：
   - `language` 欄位應該更新為 "zh" 或 "en"
   - `updated_at` 時間應該更新
   - `last_active_at` 時間應該更新

6. **重新登入測試**：
   - 登出 App
   - 重新登入
   - 確認語言設定保持不變

**預期結果**:
- ✅ 語言設定保存成功
- ✅ 重新登入後語言設定保持不變
- ✅ 無重複鍵錯誤

---

### 測試 3: 主題設定保存
**目的**: 確認 theme 設定可以保存到 Supabase

1. 登入 App
2. 進入 Settings 頁面
3. 切換主題：Light Mode ↔ Dark Mode
4. 檢查 console log，應該看到：
   ```
   🎨 Setting theme to: dark (或 light)
   ✅ Theme and platform saved to Supabase: {...}
   ```
5. 檢查 Supabase `user_settings` 表：
   - `theme` 欄位應該更新為 "dark" 或 "light"
   - `updated_at` 時間應該更新
   - `last_active_at` 時間應該更新

6. **重新登入測試**：
   - 登出 App
   - 重新登入
   - 確認主題設定保持不變

**預期結果**:
- ✅ 主題設定保存成功
- ✅ 重新登入後主題設定保持不變
- ✅ 無重複鍵錯誤

---

### 測試 4: 平台資訊追蹤
**目的**: 確認 platform 和 user_agent 正確記錄

1. **Web 測試**：
   - 在瀏覽器中開啟 App (localhost 或 Vercel)
   - 登入後檢查 `user_settings` 表
   - `platform` 應該是 "web"
   - `user_agent` 應該包含瀏覽器資訊

2. **iOS 測試**：
   - 在 TestFlight App 中登入
   - 檢查 `user_settings` 表
   - `platform` 應該是 "ios"
   - `user_agent` 應該是 "iOS App - [版本號]"

3. **切換測試**：
   - 先在 Web 登入
   - 再用同一帳號在 iOS 登入
   - `platform` 應該更新為 "ios"

**預期結果**:
- ✅ 平台資訊正確記錄
- ✅ 切換平台時正確更新
- ✅ `last_active_at` 每次登入都更新

---

### 測試 5: 並發更新測試
**目的**: 確認不會出現重複鍵錯誤

1. 登入 App
2. 快速執行以下操作（幾乎同時）：
   - 切換語言
   - 切換主題
   - App 自動更新 platform info
3. 檢查 console log，**不應該**看到：
   ```
   ❌ duplicate key value violates unique constraint "user_settings_user_id_key"
   ```

**預期結果**:
- ✅ 無重複鍵錯誤
- ✅ 所有設定都正確更新
- ✅ 最後更新的值是最終值

---

## 檢查清單

### ✅ 開發環境測試
- [ ] 新用戶首次登入成功
- [ ] user_settings 自動創建
- [ ] 語言設定保存成功
- [ ] 主題設定保存成功
- [ ] 重新登入後設定保持不變
- [ ] 無重複鍵錯誤

### ✅ Web 環境測試 (localhost)
- [ ] localhost Google SSO 登入成功
- [ ] 設定保存到 Supabase
- [ ] platform 記錄為 "web"

### ✅ Web 環境測試 (Vercel)
- [ ] Vercel Google SSO 登入成功
- [ ] 設定保存到 Supabase
- [ ] platform 記錄為 "web"

### ✅ iOS 環境測試 (TestFlight)
- [ ] TestFlight Google SSO 登入成功
- [ ] 設定保存到 Supabase
- [ ] platform 記錄為 "ios"

---

## 常見問題排查

### Q1: 仍然看到重複鍵錯誤
**解決方案**:
1. 清除 Supabase 中可能的重複記錄：
   ```sql
   -- 檢查重複記錄
   SELECT user_id, COUNT(*) 
   FROM public.user_settings 
   GROUP BY user_id 
   HAVING COUNT(*) > 1;
   
   -- 如果有重複，保留最新的，刪除舊的
   DELETE FROM public.user_settings 
   WHERE id NOT IN (
     SELECT MAX(id) 
     FROM public.user_settings 
     GROUP BY user_id
   );
   ```

### Q2: 語言/主題設定無法保存
**解決方案**:
1. 檢查 Supabase RLS (Row Level Security) 政策
2. 確認用戶有權限 UPDATE user_settings
3. 檢查 console log 中的錯誤訊息

### Q3: 首次登入沒有創建 user_settings
**解決方案**:
1. 確認已執行最新的 migration SQL
2. 檢查 Supabase 表結構是否正確
3. 確認 trigger 已正確設置

---

## Supabase 資料庫確認

執行以下 SQL 確認表結構：

```sql
-- 1. 檢查表結構
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

-- 2. 檢查索引
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'user_settings';

-- 3. 檢查觸發器
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'user_settings';

-- 4. 檢查現有記錄
SELECT 
  id,
  user_id,
  language,
  theme,
  platform,
  display_name,
  last_active_at,
  created_at,
  updated_at
FROM public.user_settings 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 成功標準

✅ **所有測試通過時，應該滿足**:

1. ✅ 新用戶首次登入自動創建 user_settings
2. ✅ 語言設定保存並持久化
3. ✅ 主題設定保存並持久化
4. ✅ 平台資訊正確追蹤 (web/ios)
5. ✅ 無任何重複鍵錯誤
6. ✅ 重新登入後設定保持不變
7. ✅ Console 無錯誤訊息

---

## 下一步

測試通過後：
1. 更新版本號 (v1.6.1)
2. 提交到 Git repository
3. 部署到 Vercel (web)
4. 提交新版本到 TestFlight (iOS)

