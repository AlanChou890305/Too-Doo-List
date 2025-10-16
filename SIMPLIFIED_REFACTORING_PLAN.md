# 簡化版架構調整計劃

> 目標：只追蹤用戶是使用 web 還是 app，不需要複雜的多設備追蹤  
> 創建時間：2025-10-16

---

## 🎯 需求澄清

### 你的實際需求

```
✅ 知道用戶目前是用 web 還是 app (iOS/Android)
✅ 在 Supabase 可以看到平台分布
✅ 保持簡單，不需要追蹤多個設備
```

### 不需要的功能

```
❌ 追蹤用戶的所有設備
❌ 查看設備歷史記錄
❌ 遠端登出某個設備
❌ 複雜的 user_devices 表
```

---

## 📊 簡化方案

### 現況分析

目前 `user_settings` 表**已經有** `platform` 欄位：

```sql
platform VARCHAR(20) DEFAULT 'web'
  CHECK (platform IN ('web', 'ios', 'android'))
```

**問題在於**：

1. 所有用戶的 `platform` 都顯示 `'web'`（即使是 iOS 用戶）
2. 原因：程式碼中的更新邏輯有問題

---

## ✅ 最簡單的解決方案

### 不需要改變資料庫結構！

**只需要修復程式碼**：

#### 1. **保留欄位**

```
✅ user_settings.platform (已存在)
✅ user_settings.last_active_at (已存在)
❌ 不需要 user_settings.user_agent (移除)
❌ 不需要 user_settings.display_name (移除，從 auth.users 取得)
```

#### 2. **清理 tasks 表**

```
❌ tasks.checked (移除，使用 is_completed)
❌ tasks.time (移除，使用 due_time 並重新命名為 time)
❌ tasks.user_display_name (移除，透過 JOIN 取得)
```

#### 3. **修復程式碼**

- 確保 `updatePlatformInfo()` 正確更新 `platform`
- 確保 iOS app 正確識別為 'ios'
- 確保每次 app 啟動都更新 platform

---

## 🔧 實施步驟

### Step 1: 清理資料庫（只移除不必要的欄位）

```sql
-- 從 user_settings 移除不必要的欄位
ALTER TABLE public.user_settings
  DROP COLUMN IF EXISTS user_agent CASCADE,
  DROP COLUMN IF EXISTS display_name CASCADE;

-- 保留 platform 和 last_active_at（這是你需要的）

-- 清理 tasks 表
ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS checked CASCADE,
  DROP COLUMN IF EXISTS time CASCADE,
  DROP COLUMN IF EXISTS user_display_name CASCADE;

-- 重新命名 due_time 為 time
ALTER TABLE public.tasks
  RENAME COLUMN due_time TO time;
```

### Step 2: 修復 userService.js

確保 `platform` 正確更新：

```javascript
static async updatePlatformInfo() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      platform: Platform.OS,  // 'web', 'ios', 或 'android'
      last_active_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });
}
```

### Step 3: 確保 App.js 正確調用

每次 app 啟動時更新 platform：

```javascript
useEffect(() => {
  const updatePlatform = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await UserService.updatePlatformInfo();
    }
  };
  updatePlatform();
}, []);
```

---

## 📊 最終結果

### user_settings 表（11 欄位）

```
✅ id, user_id
✅ language, theme
✅ platform, last_active_at  ← 你需要的欄位
✅ timezone, date_format, time_format, week_start
✅ notifications_enabled, reminder_settings, privacy_settings
✅ created_at, updated_at
```

### 查詢平台分布

```sql
-- 查看各平台用戶數
SELECT
  platform,
  COUNT(*) as user_count
FROM public.user_settings
GROUP BY platform
ORDER BY user_count DESC;

-- 查看最近活躍用戶
SELECT
  us.user_id,
  u.email,
  us.platform,
  us.last_active_at
FROM public.user_settings us
JOIN auth.users u ON u.id = us.user_id
WHERE us.last_active_at > NOW() - INTERVAL '7 days'
ORDER BY us.last_active_at DESC;
```

---

## ⏱️ 預估時間

- SQL Migration: 5 分鐘
- 修復 userService.js: 10 分鐘
- 測試: 15 分鐘

**總計**: 30 分鐘

---

## ✅ 優勢

1. **超級簡單** - 不改變核心架構
2. **最小變更** - 只移除不必要的欄位
3. **低風險** - 不影響現有功能
4. **滿足需求** - 完全符合你的需求

---

## 下一步

確認這個簡化方案符合你的需求嗎？

如果確認，我會：

1. 創建簡化的 migration SQL
2. 確保 userService 正確更新 platform
3. 測試 web 和 iOS 平台
