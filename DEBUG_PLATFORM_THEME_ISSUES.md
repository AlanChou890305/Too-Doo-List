# 平台和主題問題診斷指南

## 🔍 問題分析

### 問題 1: Platform 都顯示 "web"

**可能原因：**

1. 平台資訊只在用戶登入時更新一次
2. 如果用戶已經登入，就不會再觸發 `updatePlatformInfo()`
3. 觸發器可能沒有正確工作

### 問題 2: Theme 沒有正確保存

**可能原因：**

1. 主題設定時發生錯誤
2. 資料庫觸發器沒有正確執行
3. 用戶設定沒有正確同步

## 🛠️ 修復方案

### 方案 1: 強制更新平台資訊

在 App.js 中添加定期更新平台資訊的邏輯：

```javascript
// 在 App.js 的 useEffect 中添加
useEffect(() => {
  // 每次 App 啟動時都更新平台資訊
  const updatePlatformOnStart = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await UserService.updatePlatformInfo();
        console.log("📱 Platform info updated on app start");
      }
    } catch (error) {
      console.error("Error updating platform on start:", error);
    }
  };

  updatePlatformOnStart();
}, []);
```

### 方案 2: 在設定變更時更新平台資訊

修改 `setThemeMode` 和 `setLanguage` 函數：

```javascript
const setThemeMode = async (mode) => {
  console.log(`🎨 Setting theme to: ${mode}`);
  setThemeModeState(mode);

  try {
    // 同時更新主題和平台資訊
    const result = await UserService.updateUserSettings({
      theme: mode,
      platform: Platform.OS,
      user_agent: UserService.getUserAgent(),
    });
    console.log("✅ Theme and platform saved to Supabase:", result);
  } catch (error) {
    console.error("❌ Error saving theme to Supabase:", error);
  }
};

const setLanguage = async (lang) => {
  console.log(`🌐 Setting language to: ${lang}`);
  setLanguageState(lang);

  try {
    // 同時更新語言和平台資訊
    const result = await UserService.updateUserSettings({
      language: lang,
      platform: Platform.OS,
      user_agent: UserService.getUserAgent(),
    });
    console.log("✅ Language and platform saved to Supabase:", result);
  } catch (error) {
    console.error("❌ Error saving language to Supabase:", error);
  }
};
```

### 方案 3: 添加手動更新按鈕

在設定頁面添加一個「更新平台資訊」按鈕，方便測試。

## 🔧 立即修復步驟

### 步驟 1: 檢查資料庫狀態

在 Supabase Dashboard 執行：

```sql
-- 檢查現有用戶的平台資訊
SELECT
  us.user_id,
  us.display_name,
  us.platform,
  us.user_agent,
  us.theme,
  us.last_active_at,
  au.email,
  au.created_at as auth_created_at
FROM user_settings us
LEFT JOIN auth.users au ON us.user_id = au.id
ORDER BY us.last_active_at DESC;
```

### 步驟 2: 手動更新現有用戶的平台資訊

```sql
-- 為現有用戶更新平台資訊（需要知道具體的 user_id）
UPDATE user_settings
SET
  platform = 'ios',  -- 或 'web', 'android'
  user_agent = 'iOS App - TestFlight',
  last_active_at = NOW()
WHERE user_id = 'your-user-id-here';
```

### 步驟 3: 檢查觸發器是否工作

```sql
-- 測試觸發器
INSERT INTO user_settings (user_id, language, theme)
VALUES ('test-user-id', 'en', 'dark')
ON CONFLICT (user_id)
DO UPDATE SET
  theme = EXCLUDED.theme,
  updated_at = NOW();
```

## 🧪 測試方案

### 測試 1: 平台檢測

1. 在 iOS App 中登入
2. 檢查 console 是否有 "Platform info updated successfully"
3. 檢查資料庫中 platform 欄位是否為 "ios"

### 測試 2: 主題設定

1. 在設定頁面切換主題
2. 檢查 console 是否有 "Theme and platform saved to Supabase"
3. 重新開啟 App，檢查主題是否保持

### 測試 3: 語言設定

1. 在設定頁面切換語言（英文/繁體中文）
2. 檢查 console 是否有 "Language and platform saved to Supabase"
3. 重新開啟 App，檢查語言是否保持

### 測試 4: 跨平台測試

1. 在 Web 版登入，檢查 platform 是否為 "web"
2. 在 iOS App 登入，檢查 platform 是否為 "ios"
3. 在 Android App 登入，檢查 platform 是否為 "android"

## 📊 預期結果

執行修復後，應該看到：

```sql
-- 預期的查詢結果
SELECT platform, COUNT(*) as user_count
FROM user_settings
GROUP BY platform;

-- 應該看到類似：
-- platform | user_count
-- ios      | 5
-- web      | 3
-- android  | 1
```

## 🚨 緊急修復

如果問題很急，可以執行這個 SQL 來立即修復：

```sql
-- 為所有現有用戶設置默認平台資訊
UPDATE user_settings
SET
  platform = CASE
    WHEN user_agent LIKE '%iOS%' OR user_agent LIKE '%iPhone%' THEN 'ios'
    WHEN user_agent LIKE '%Android%' THEN 'android'
    ELSE 'web'
  END,
  last_active_at = NOW()
WHERE platform IS NULL OR platform = 'web';
```
