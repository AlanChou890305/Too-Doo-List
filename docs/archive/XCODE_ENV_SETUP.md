# Xcode 環境變數設定指南

## 📋 概述

使用 Xcode 建置 iOS App 時，環境變數的載入順序是：

```
1. .env.local（本地開發，最高優先級）
2. Xcode Scheme 中的 Environment Variables（建置時）
3. app.config.js 中的 Constants.expoConfig
```

**重要提示：**

- ⚠️ 如果你有 `.env.local` 文件，它會優先於 Xcode Scheme 的設定
- 📝 建置 Production/Staging 時，建議**暫時刪除或重新命名** `.env.local` 文件
- ✅ 或者確保 `.env.local` 與你要建置的環境一致

---

## 🔑 需要設定的環境變數

### Production 環境（正式版）

在 Xcode 的 **Environment Variables** 中設定：

```
Name: EXPO_PUBLIC_APP_ENV
Value: production

Name: EXPO_PUBLIC_SUPABASE_URL
Value: https://ajbusqpjsjcuzzxuueij.supabase.co

Name: EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: [從 Supabase Dashboard 獲取]
```

### Staging 環境（測試版）

在 Xcode 的 **Environment Variables** 中設定：

```
Name: EXPO_PUBLIC_APP_ENV
Value: staging

Name: EXPO_PUBLIC_SUPABASE_URL_DEV
Value: https://qerosiozltqrbehctxdn.supabase.co

Name: EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV
Value: [從 Supabase Dashboard 獲取]
```

---

## 📍 如何設定（步驟說明）

### 步驟 1: 打開 Scheme 編輯器

1. 在 Xcode 中，點擊頂部裝置選擇器旁邊的 Scheme 下拉選單
2. 選擇 **Edit Scheme...**

或使用快捷鍵：`Product` → `Scheme` → `Edit Scheme...`

### 步驟 2: 添加環境變數

1. 在左側選擇 **Run**
2. 點擊上方的 **Arguments** 標籤
3. 展開 **Environment Variables** 區域
4. 點擊左下角的 **+** 按鈕添加新變數
5. 輸入 **Name** 和 **Value**

### 步驟 3: 重複添加所有變數

逐一添加所需的環境變數（見上方清單）

### 步驟 4: 確認設定

添加完成後，應該看到類似這樣的列表：

```
✅ EXPO_PUBLIC_APP_ENV
✅ EXPO_PUBLIC_SUPABASE_URL (或 EXPO_PUBLIC_SUPABASE_URL_DEV)
✅ EXPO_PUBLIC_SUPABASE_ANON_KEY (或 EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV)
```

### 步驟 5: 關閉並保存

點擊右下角的 **Close** 按鈕

---

## 🔍 如何獲取 Supabase API 金鑰

### Production 環境

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇 **to-do-production** 專案
3. 點擊左側的 **Settings**（齒輪圖示）
4. 點擊 **API**
5. 在 **Project API keys** 區塊中：
   - **Project URL** → 這就是 `EXPO_PUBLIC_SUPABASE_URL` 的值
   - **anon public** → 複製這個 key（點擊右側的眼睛圖示顯示）

### Staging 環境

1. 選擇 **to-do-staging** 專案
2. 點擊左側的 **Settings**
3. 點擊 **API**
4. 在 **Project API keys** 區塊中：
   - **Project URL** → 這就是 `EXPO_PUBLIC_SUPABASE_URL_DEV` 的值
   - **anon public** → 複製這個 key

---

## 📊 環境變數對照表

| 環境           | EXPO_PUBLIC_APP_ENV | Supabase URL                               | Supabase Key | Supabase Project |
| -------------- | ------------------- | ------------------------------------------ | ------------ | ---------------- |
| **Production** | `production`        | `https://ajbusqpjsjcuzzxuueij.supabase.co` | anon key     | to-do-production |
| **Staging**    | `staging`           | `https://qerosiozltqrbehctxdn.supabase.co` | anon key     | to-do-staging    |

---

## ✅ 檢查清單

建置前確認：

### Production Build

- [ ] 已獲取 Production Supabase API 金鑰
- [ ] 已設定 `EXPO_PUBLIC_APP_ENV = production`
- [ ] 已設定 `EXPO_PUBLIC_SUPABASE_URL`
- [ ] 已設定 `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Bundle ID 正確：`com.cty0305.too.doo.list`

### Staging Build

- [ ] 已獲取 Staging Supabase API 金鑰
- [ ] 已設定 `EXPO_PUBLIC_APP_ENV = staging`
- [ ] 已設定 `EXPO_PUBLIC_SUPABASE_URL_DEV`
- [ ] 已設定 `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV`
- [ ] Bundle ID 正確：`com.cty0305.too.doo.list.staging`

---

## 🚨 常見問題

### Q1: 為什麼需要設定這些環境變數？

**A:** 因為 App 需要在運行時知道要連接到哪個 Supabase 專案：

- Production → 連接到正式資料庫
- Staging → 連接到測試資料庫

### Q2: 環境變數會被打包進 App 嗎？

**A:** 是的。在 Xcode Scheme 中設定的環境變數會被打包進最終的 App。

### Q3: 可以安全地分享這些金鑰嗎？

**A:** Supabase 的 `anon` key 是公開的（前端使用），相對安全，但仍建議：

- ✅ 不要提交到公開的 Git 倉庫
- ✅ 定期輪換金鑰
- ✅ 使用 RLS (Row Level Security) 保護資料

### Q4: 為什麼 Production 和 Staging 使用不同的變數名？

**A:** 這是為了避免混淆：

- Production 使用：

  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

- Staging 使用：
  - `EXPO_PUBLIC_SUPABASE_URL_DEV`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV`

這樣可以清楚區分兩個環境。

### Q5: 設定後需要重新 Build 嗎？

**A:** 是的。修改環境變數後需要：

1. 清理 Build: `Product` → `Clean Build Folder` (Shift+Cmd+K)
2. 重新 Archive: `Product` → `Archive`

---

## 💡 提示

1. **使用不同的 Scheme**

   - 建議為 Production 和 Staging 分別創建不同的 Scheme
   - 這樣可以避免每次都手動修改環境變數

2. **處理 .env.local 衝突**

   - ⚠️ **最重要**：建置前檢查是否有 `.env.local` 文件
   - 如果存在，建議暫時重命名為 `.env.local.backup`
   - 建置完成後再恢復
   - 或確保 `.env.local` 的內容與你要建置的環境一致

3. **檢查設定**

   - 每次建置前都檢查環境變數是否正確
   - 可以在代碼中加上 console.log 輸出當前環境
   - 確認 Supabase URL 和環境正確

4. **安全考慮**

   - 不要在 Xcode Scheme 設定中儲存敏感資訊（如實際的 API key）
   - 考慮使用 Xcode Config 文件管理不同環境

5. **Debug 技巧**
   - 在 App 啟動時添加 console.log 輸出：
     ```javascript
     console.log("🔍 Environment:", process.env.EXPO_PUBLIC_APP_ENV);
     console.log(
       "🔍 Supabase URL:",
       process.env.EXPO_PUBLIC_SUPABASE_URL ||
         process.env.EXPO_PUBLIC_SUPABASE_URL_DEV
     );
     ```
   - 這樣可以在運行時確認實際使用的環境變數

---

## 📚 相關文件

- `QUICK_START_BUILD.md` - 快速建置指南
- `BUILD_ENVIRONMENTS_XCODE.md` - 詳細建置環境說明
- `ENVIRONMENT_VARIABLES.md` - 環境變數完整說明
