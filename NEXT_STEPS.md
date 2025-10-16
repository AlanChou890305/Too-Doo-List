# 🎯 接下來要做什麼

**最後更新**: 2025-10-16  
**版本**: 1.6.0  
**狀態**: ✅ Repository 已更新，準備上架

---

## ✅ 已完成

### 代碼和配置

- [x] ✅ 更新 Vercel URL 為 `to-do-mvp.vercel.app`
- [x] ✅ 設定 Associated Domains
- [x] ✅ 設定 iOS Deployment Target (13.0+)
- [x] ✅ 修復 TestFlight 重複導航問題
- [x] ✅ 實現 URL Routing

### OAuth 配置

- [x] ✅ Google Cloud Console Web Client 配置
- [x] ✅ Supabase Redirect URLs 配置
- [x] ✅ Google OAuth 登入測試（Web 和 iOS）

### 文檔和整理

- [x] ✅ 創建 App Store 上架檢查清單
- [x] ✅ 創建快速上架指南
- [x] ✅ 清理不必要的文檔（刪除 12 個）
- [x] ✅ 更新 Repository

---

## 📋 立即要做（準備上架）

### 1. 生成 App Icon（15 分鐘）⚠️

```bash
# 執行 App Icon 生成腳本
./scripts/generate-app-icon.sh

# 或手動調整
sips -z 1024 1024 assets/logo.png --out assets/icon-1024.png
```

**檢查項目**：

- [ ] 尺寸：1024 x 1024 像素
- [ ] 格式：PNG
- [ ] 無透明背景
- [ ] 無 alpha channel

**完成後**：

- [ ] 更新 `app.config.js` 中的 `icon` 路徑

---

### 2. 準備 App Store 截圖（1-2 小時）⚠️

**所需截圖**：

- [ ] 6.5" Display (1290 x 2796): 至少 3 張
- [ ] 5.5" Display (1242 x 2208): 至少 3 張

**建議截圖內容**：

1. 登入頁面（展示 Google Sign In）
2. 任務列表/日曆視圖
3. 新增/編輯任務
4. 設定頁面（多語系和主題切換）
5. 任務詳情

**製作方式**：

```bash
# 方法 1: iOS Simulator
open -a Simulator
# 選擇 iPhone 14 Pro Max
# 執行 App 並截圖 (Cmd + S)

# 方法 2: 使用 TestFlight 實機截圖
```

---

### 3. 檢查 Apple Developer Account（5 分鐘）⚠️

- [ ] 確認已註冊 Apple Developer Program ($99/年)
- [ ] 確認帳號狀態為 active
- [ ] 登入 https://developer.apple.com/ 確認

**如果還沒註冊**：

1. 前往 https://developer.apple.com/programs/
2. 點擊 "Enroll"
3. 完成註冊流程（需要信用卡）
4. 等待審核（通常 24-48 小時）

---

### 4. 執行 Production Build（20 分鐘）⚠️

```bash
# 確認已登入 EAS
eas whoami

# 如果未登入
eas login

# 執行 iOS Production Build
eas build --platform ios --profile production

# 等待 build 完成（10-20 分鐘）
# 完成後會收到 Email 通知
```

---

### 5. 在 App Store Connect 創建 App（30 分鐘）⚠️

1. **登入 App Store Connect**

   - https://appstoreconnect.apple.com

2. **創建新 App**

   - 點擊 "My Apps" → "+" → "New App"
   - 平台：iOS
   - 名稱：To Do
   - 語言：繁體中文（主要）
   - Bundle ID：com.cty0305.too.doo.list
   - SKU：TODOO001（或任何唯一識別碼）

3. **上傳 Build**

   ```bash
   eas submit --platform ios --profile production
   ```

4. **填寫 App Store 資訊**

   - 參考 `QUICK_FIX_FOR_APP_STORE.md` 中的範本
   - 上傳截圖
   - 填寫描述和關鍵字
   - 設定隱私政策 URL: `https://to-do-mvp.vercel.app/privacy`

5. **填寫隱私問卷**

   - 參考 `APP_STORE_SUBMISSION_CHECKLIST.md` 第 12 節

6. **提交審核**
   - 檢查所有資訊
   - 點擊 "Submit for Review"

---

## 📚 參考文檔

### 必讀

- 📖 `QUICK_FIX_FOR_APP_STORE.md` - 逐步操作指南
- 📋 `APP_STORE_SUBMISSION_CHECKLIST.md` - 完整檢查清單
- 📊 `PROJECT_STATUS.md` - 專案狀態總覽

### 設定指南

- 🔑 `GOOGLE_OAUTH_SETUP.md` - Google OAuth 設定
- 🗄️ `SUPABASE_SETUP.md` - Supabase 設定
- 🚀 `TESTFLIGHT_SETUP.md` - TestFlight 設定

---

## ⏱️ 時間預估

| 任務                   | 時間         | 狀態      |
| ---------------------- | ------------ | --------- |
| 生成 App Icon          | 15 分鐘      | ⚠️ 待完成 |
| 準備截圖               | 1-2 小時     | ⚠️ 待完成 |
| 檢查 Apple Developer   | 5 分鐘       | ⚠️ 待完成 |
| Production Build       | 20 分鐘      | ⚠️ 待完成 |
| App Store Connect 設定 | 30 分鐘      | ⚠️ 待完成 |
| **總計**               | **3-4 小時** |           |

**審核時間**: 通常 24-48 小時

---

## 🎯 今天的目標

### 最低目標（1 小時）

- [ ] 生成 App Icon
- [ ] 檢查 Apple Developer Account
- [ ] 準備至少 3 張截圖

### 理想目標（3-4 小時）

- [ ] 完成所有截圖
- [ ] 執行 Production Build
- [ ] 完成 App Store Connect 設定
- [ ] 提交審核

---

## 💡 提示

### 如果遇到問題

1. **App Icon 問題**

   ```bash
   # 檢查尺寸
   sips -g pixelWidth -g pixelHeight assets/logo.png

   # 如果不是 1024x1024，執行腳本
   ./scripts/generate-app-icon.sh
   ```

2. **Build 失敗**

   - 檢查 `eas.json` 配置
   - 確認環境變數正確
   - 查看 Expo Dashboard 的 build logs

3. **截圖問題**

   - 使用 Simulator 或 Figma 製作
   - 確保尺寸完全符合要求
   - 可以添加文字說明（可選）

4. **OAuth 問題**
   - 檢查 Supabase Redirect URLs
   - 檢查 Google Cloud Console 配置
   - 參考 `GOOGLE_OAUTH_SETUP.md`

---

## ✅ 完成後

提交審核後：

1. **等待審核**

   - 通常 24-48 小時
   - 檢查 Email 通知

2. **如果被拒絕**

   - 閱讀拒絕原因
   - 根據反饋修改
   - 重新提交

3. **如果通過**

   - 🎉 恭喜！App 上架了
   - 設定自動發布或手動發布
   - 開始推廣你的 App

4. **後續維護**
   - 監控 Supabase 和 Vercel 使用量
   - 收集用戶反饋
   - 規劃 v1.7.0 功能

---

## 🚀 準備好了嗎？

現在就開始吧！從生成 App Icon 開始：

```bash
./scripts/generate-app-icon.sh
```

**祝你上架順利！** 🎊
