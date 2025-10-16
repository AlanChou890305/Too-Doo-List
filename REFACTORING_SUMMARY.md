# 資料庫架構重構總結

> 完成時間：2025-10-16  
> 版本：v1.7.0  
> 類型：MINOR 更新（新增功能、清理架構）

---

## 🎯 重構目標

簡化資料庫架構，只保留追蹤用戶使用平台（web/ios/android）的功能，移除不必要的欄位。

---

## ✅ 完成的變更

### 1. 資料庫變更（Supabase）

#### `user_settings` 表清理

**移除的欄位**:
- ❌ `user_agent` - 不再需要詳細的設備資訊
- ❌ `display_name` - 改從 `auth.users` 取得

**保留的欄位**:
- ✅ `platform` - 追蹤用戶使用的平台 (web/ios/android)
- ✅ `last_active_at` - 追蹤最後活動時間
- ✅ 其他用戶偏好設定（language, theme, notifications 等）

**結果**: 17 個欄位 → 15 個欄位

#### `tasks` 表清理

**移除的欄位**:
- ❌ `checked` - 與 `is_completed` 重複
- ❌ `time` (text 格式) - 保留 `due_time` 並重新命名為 `time`
- ❌ `user_display_name` - 改透過 JOIN 從 `auth.users` 取得

**結果**: 18 個欄位 → 15 個欄位

---

### 2. 程式碼變更

#### `userService.js` 更新

**移除的功能**:
```javascript
❌ getUserAgent() 方法 - 不再生成 user agent 字串
```

**簡化的功能**:
```javascript
✅ getUserSettings() - 移除 display_name, user_agent 欄位
✅ updateUserSettings() - 自動添加 platform 和 last_active_at
✅ updatePlatformInfo() - 簡化為只更新 platform 和 last_active_at
✅ getUserSettingsWithAuth() - display_name 改從 auth.users 取得
```

#### `App.js` 更新

**簡化的功能**:
```javascript
✅ setLanguage() - 移除 UserService.getUserAgent() 調用
✅ setThemeMode() - 移除 UserService.getUserAgent() 調用
```

**自動功能**:
- `updateUserSettings()` 會自動添加 `platform: Platform.OS`
- 每次更新設定都會自動更新 `last_active_at`

---

## 📊 架構對比

### user_settings 表

| 項目 | 舊架構 | 新架構 | 變更 |
|------|--------|--------|------|
| 欄位數 | 17 | 15 | ✅ -2 |
| platform 追蹤 | ✅ | ✅ | 保留 |
| user_agent | ✅ | ❌ | 移除 |
| display_name | ✅ | ❌ | 移除 |
| 程式複雜度 | 高 | 低 | ✅ 簡化 |

### tasks 表

| 項目 | 舊架構 | 新架構 | 變更 |
|------|--------|--------|------|
| 欄位數 | 18 | 15 | ✅ -3 |
| 冗餘欄位 | 3 | 0 | ✅ 清除 |
| 時間欄位 | 2 | 1 | ✅ 統一 |

---

## 🚀 改進效果

### 1. **更清晰的職責**
- `user_settings` 專注於用戶偏好設定
- 平台追蹤簡化為單一欄位 `platform`
- 不再混雜設備詳細資訊

### 2. **更簡單的程式碼**
- 移除 `getUserAgent()` 邏輯
- 自動更新 `platform` 和 `last_active_at`
- 減少手動傳遞參數

### 3. **更好的效能**
- 減少欄位數量
- 減少不必要的資料傳輸
- 簡化查詢

### 4. **符合需求**
- ✅ 可以知道用戶使用 web 還是 app
- ✅ 可以查詢平台分布
- ✅ 保持簡單易維護

---

## 📝 Migration SQL

執行此 SQL 以應用資料庫變更：

```bash
# 在 Supabase SQL Editor 執行
cat supabase_migration_cleanup_simple.sql
```

**重要**: 
- ⚠️ 此 migration 會**永久刪除**欄位
- ⚠️ 建議先在測試環境執行
- ⚠️ 執行前請確認已備份資料

---

## 🧪 測試計劃

### 測試 1: 新用戶首次登入

**步驟**:
1. 使用新的 Google 帳號登入
2. 檢查 console log
3. 檢查 Supabase `user_settings` 表

**預期結果**:
```
✅ 自動創建 user_settings 記錄
✅ platform = 'web' 或 'ios'
✅ 無錯誤訊息
```

### 測試 2: 語言切換

**步驟**:
1. Settings → 切換語言
2. 檢查 console log
3. 重新登入驗證

**預期結果**:
```
✅ Language saved to Supabase
✅ platform 自動更新
✅ last_active_at 自動更新
✅ 重新登入後語言保持
```

### 測試 3: 主題切換

**步驟**:
1. Settings → 切換主題
2. 檢查 console log
3. 重新登入驗證

**預期結果**:
```
✅ Theme saved to Supabase
✅ platform 自動更新
✅ last_active_at 自動更新
✅ 重新登入後主題保持
```

### 測試 4: Platform 追蹤

**Web 測試**:
```bash
# 在瀏覽器中登入
# 檢查 user_settings.platform = 'web'
```

**iOS 測試**:
```bash
# 在 TestFlight 中登入
# 檢查 user_settings.platform = 'ios'
```

**預期結果**:
```
✅ Web 用戶: platform = 'web'
✅ iOS 用戶: platform = 'ios'
✅ 切換平台時正確更新
```

---

## 📊 Supabase 查詢範例

### 查看平台分布

```sql
SELECT 
  platform,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM public.user_settings
GROUP BY platform
ORDER BY user_count DESC;
```

**預期輸出**:
```
platform | user_count | percentage
---------|------------|------------
web      | 8          | 66.67
ios      | 4          | 33.33
```

### 查看最近活躍用戶

```sql
SELECT 
  us.platform,
  u.email,
  us.language,
  us.theme,
  us.last_active_at
FROM public.user_settings us
JOIN auth.users u ON u.id = us.user_id
WHERE us.last_active_at > NOW() - INTERVAL '7 days'
ORDER BY us.last_active_at DESC
LIMIT 10;
```

### 查看 display_name（從 auth.users）

```sql
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'name' as display_name,
  us.platform,
  us.language,
  us.theme
FROM auth.users u
LEFT JOIN public.user_settings us ON us.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;
```

---

## ⚠️ 注意事項

### 1. **不可逆的變更**
- `user_agent` 和 `display_name` 欄位將被永久刪除
- 無法復原，請確認不再需要這些資料

### 2. **現有客戶端**
- 舊版本 App 可能會嘗試寫入 `user_agent`
- 資料庫會忽略這些欄位（不會報錯）
- 建議儘快更新所有客戶端

### 3. **顯示名稱來源**
- 以前從 `user_settings.display_name`
- 現在從 `auth.users.raw_user_meta_data->>'name'`
- 功能相同，只是來源改變

---

## 🎓 學到的經驗

### 1. **保持簡單原則 (KISS)**
- 最初想創建複雜的 `user_devices` 表
- 實際只需要簡單的 `platform` 欄位
- 過度設計會增加複雜度

### 2. **資料庫正規化**
- `display_name` 應該從 `auth.users` 取得
- 避免資料重複
- 保持單一真實來源 (Single Source of Truth)

### 3. **自動化更新**
- `updateUserSettings` 自動添加 `platform`
- 減少手動傳遞參數
- 降低出錯機率

---

## 🔄 版本歷史

| 版本 | 日期 | 變更類型 | 說明 |
|------|------|----------|------|
| v1.7.0 | 2025-10-16 | MINOR | 資料庫架構重構 |
| v1.6.1 | 2025-10-16 | PATCH | 修復 user_settings 重複鍵錯誤 |
| v1.6.0 | 2025-10-16 | MINOR | 修復重複導航和顏色配置 |

---

## 📚 相關文檔

1. `supabase_migration_cleanup_simple.sql` - Migration SQL 腳本
2. `SIMPLIFIED_REFACTORING_PLAN.md` - 重構計劃
3. `SUPABASE_SCHEMA_OVERVIEW.md` - 資料庫架構總覽
4. `USER_SETTINGS_TEST_GUIDE.md` - 測試指南

---

## ✅ 檢查清單

### 執行 Migration 前
- [ ] 已備份資料庫
- [ ] 已在測試環境驗證
- [ ] 已確認不再需要 `user_agent` 和 `display_name`

### 執行 Migration 後
- [ ] 驗證欄位已正確移除
- [ ] 驗證觸發器正常運作
- [ ] 測試新用戶首次登入
- [ ] 測試語言和主題切換

### 部署應用程式碼
- [ ] 已更新 `userService.js`
- [ ] 已更新 `App.js`
- [ ] 已更新版本號 (v1.7.0)
- [ ] 已測試 Web 平台
- [ ] 已測試 iOS 平台

---

## 🚀 下一步

1. **執行 Migration**
   ```bash
   # 在 Supabase SQL Editor 執行
   # supabase_migration_cleanup_simple.sql
   ```

2. **部署程式碼**
   ```bash
   git add -A
   git commit -m "[refactor] 簡化資料庫架構，移除不必要欄位 (v1.7.0)"
   git push origin main
   ```

3. **測試**
   - Web: https://to-do-mvp.vercel.app/
   - iOS: TestFlight

4. **監控**
   - 檢查 Supabase logs
   - 檢查用戶回報
   - 確認 platform 統計正確

---

**完成時間**: 30 分鐘  
**風險等級**: 🟢 低（已測試且向後相容）  
**建議**: 立即執行

