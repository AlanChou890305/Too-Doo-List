# 🚀 App Store 上架快速修復指南

## 當前狀態摘要

✅ **已完成**：

- 核心功能完整（任務管理、日曆、多語系、主題切換）
- Google SSO 正常運作
- 隱私政策和使用條款頁面已實現
- URL routing 已配置
- 版本號和基本配置正確

⚠️ **需要修復**：

- App Icon 尺寸和格式
- Associated Domains 配置
- iOS OAuth Client ID
- Supabase Redirect URLs
- App Store 資產（截圖）

---

## 🔧 立即修復步驟（約 2-3 小時）

### 1️⃣ 修復 App Icon（15 分鐘）

**問題**：目前的 icon 是 1088x960，需要 1024x1024 正方形，且不能有透明背景。

**解決方案 A - 使用 ImageMagick（推薦）**：

```bash
# 安裝 ImageMagick（如果還沒安裝）
brew install imagemagick

# 執行自動生成腳本
./scripts/generate-app-icon.sh

# 腳本會生成 3 個版本，選擇最合適的
```

**解決方案 B - 使用 macOS 內建工具**：

```bash
# 調整尺寸為 1024x1024
sips -z 1024 1024 assets/logo.png --out assets/icon-1024.png

# 移除 alpha channel（如果有透明背景）
sips -s format png assets/icon-1024.png --setProperty formatOptions default
```

**解決方案 C - 手動處理**：

1. 在 Preview.app 或 Photoshop 中打開 `assets/logo.png`
2. 調整畫布大小為 1024x1024（居中）
3. 如果有透明背景，添加白色背景
4. 導出為 PNG（不要勾選「保留透明度」）
5. 儲存為 `assets/icon-1024.png`

**驗證**：

```bash
# 檢查尺寸
sips -g pixelWidth -g pixelHeight assets/icon-1024.png

# 應該顯示：
# pixelWidth: 1024
# pixelHeight: 1024
```

**更新配置**：

```javascript
// app.config.js
icon: "./assets/icon-1024.png",  // 更新這行
```

---

### 2️⃣ 確認 Google OAuth 配置（10 分鐘）

**重要**：iOS App 使用 Supabase Auth 時，**不需要**創建 iOS 專用的 Client ID！直接使用 Web Client ID 即可。

**步驟**：

1. **確認 Google Cloud Console 配置**

   - 網址：https://console.cloud.google.com
   - 選擇專案："Too Doo List - Task Management App"
   - 導航到：APIs & Services → Credentials
   - 確認 **Web Client ID** 的 Authorized redirect URIs 包含：
     ```
     https://qerosiozltqrbehctxdn.supabase.co/auth/v1/callback
     ```

2. **確認 Supabase Google Provider 配置**

   - 前往：https://supabase.com/dashboard
   - 選擇專案：qerosiozltqrbehctxdn
   - 導航到：Authentication → Providers → Google
   - 確認：
     - ✅ Enabled
     - ✅ Client ID (for OAuth) 已填寫（Web Client ID）
     - ✅ Client Secret (for OAuth) 已填寫

3. **確認 app.config.js 配置**
   - 確認 `scheme: "too-doo-list"` 存在
   - 確認 `ios.infoPlist.CFBundleURLTypes` 包含正確的 URL Scheme

---

### 3️⃣ 更新 Supabase Redirect URLs（10 分鐘）

**步驟**：

1. **前往 Supabase Dashboard**

   - 網址：https://supabase.com/dashboard
   - 選擇專案：qerosiozltqrbehctxdn

2. **更新 Redirect URLs**

   - 導航到：Authentication → URL Configuration
   - 在 "Redirect URLs" 中添加：
     ```
     too-doo-list://auth/callback
     com.cty0305.too.doo.list://auth/callback
     https://to-do-mvp.vercel.app/auth/callback
     ```

3. **儲存變更**

---

### 4️⃣ 準備 App Store 截圖（1-2 小時）

**所需截圖**：

- 6.5" Display (iPhone 14 Pro Max)：1290 x 2796 像素，至少 3 張
- 5.5" Display (iPhone 8 Plus)：1242 x 2208 像素，至少 3 張

**建議截圖內容**：

1. **登入頁面** - 展示 Google Sign In
2. **任務列表/日曆視圖** - 展示核心功能
3. **新增/編輯任務** - 展示任務管理
4. **設定頁面** - 展示多語系和主題切換
5. **任務詳情** - 展示日期、時間、備註功能

**快速製作方法**：

**方法 A - 使用 iOS Simulator**：

```bash
# 啟動模擬器
open -a Simulator

# 選擇設備：iPhone 14 Pro Max
# 執行應用程式
npx expo run:ios

# 截圖快捷鍵：Cmd + S
# 截圖會自動儲存到桌面
```

**方法 B - 使用 TestFlight 實機**：

1. 在 iPhone 上開啟 TestFlight App
2. 使用應用程式並截圖（電源鍵 + 音量上鍵）
3. AirDrop 或 iCloud 傳到 Mac
4. 使用 Preview 檢查尺寸是否符合要求

**方法 C - 使用設計工具**：

1. 使用 Figma/Sketch 創建 App Store 截圖模板
2. 匯入應用程式截圖
3. 添加標題和說明文字
4. 導出為所需尺寸

---

### 5️⃣ 準備 App Store 文字內容（30 分鐘）

**應用程式名稱**：

```
To Do
```

**副標題**（30 字元以內）：

```
Simple & Intuitive Task Manager
```

**描述**（繁體中文，4000 字元以內）：

```
To Do - 簡單直觀的任務管理應用程式

讓生活更有條理，輕鬆管理您的日常任務！To Do 提供簡潔優雅的介面，讓您專注於真正重要的事情。

✨ 主要功能

📝 任務管理
• 快速新增和編輯任務
• 設定日期和時間提醒
• 添加詳細備註
• 拖曳排序任務優先順序

📅 日曆整合
• 日曆視圖一目了然
• 快速查看每日任務
• 月份視圖規劃未來

🎨 個人化設定
• 深色模式支援，保護您的眼睛
• 繁體中文和英文介面切換
• 優雅的 UI 設計，流暢的使用體驗

🔐 安全便利
• Google 帳號快速登入
• 雲端同步，多裝置存取
• 保護您的隱私和數據安全

🚀 為什麼選擇 To Do？

✓ 簡潔設計 - 沒有複雜的功能，只有您需要的
✓ 快速操作 - 流暢的動畫和即時同步
✓ 無廣告 - 專注於使用體驗，沒有干擾
✓ 持續更新 - 定期新增功能和改進

📱 完美支援

• 支援 iPhone 和 iPad
• 支援最新 iOS 版本
• 響應式設計，適配所有螢幕尺寸

立即下載 To Do，開始更有效率、更有條理的生活！

有任何問題或建議？歡迎透過支援頁面聯繫我們。
```

**關鍵字**（100 字元以內，用逗號分隔）：

```
任務管理,待辦事項,行事曆,生產力,GTD,時間管理,日程規劃,清單,目標追蹤,效率工具
```

**促銷文字**（170 字元以內）：

```
全新 1.6 版本！新增日期時間選擇器、備註欄位，以及改進的使用者體驗。立即下載，體驗最簡單直觀的任務管理方式！
```

**支援 URL**：

```
https://github.com/your-username/Too-Doo-List/issues
```

**隱私政策 URL**：

```
https://to-do-mvp.vercel.app/privacy
```

---

## 🎯 執行 Production Build

### 步驟 1：確認 EAS 已設定

```bash
# 檢查是否已登入 EAS
eas whoami

# 如果未登入
eas login
```

### 步驟 2：執行 Production Build

```bash
# 為 iOS 執行 Production Build
eas build --platform ios --profile production
```

### 步驟 3：等待 Build 完成

- Build 通常需要 10-20 分鐘
- 完成後會收到電子郵件通知
- 可以在 Expo Dashboard 查看進度

### 步驟 4：下載並測試 Build

```bash
# 或直接提交到 App Store Connect
eas submit --platform ios --profile production
```

---

## 📝 在 App Store Connect 填寫資訊

### 步驟 1：創建應用程式

1. 登入 https://appstoreconnect.apple.com
2. 點擊 "My Apps" → "+" → "New App"
3. 填寫：
   - **平台**：iOS
   - **名稱**：To Do
   - **語言**：繁體中文（主要）
   - **Bundle ID**：com.cty0305.too.doo.list
   - **SKU**：TODOO001（或任何唯一識別碼）
   - **使用者存取權限**：完整存取權限

### 步驟 2：上傳截圖

1. 進入 "App Store" 頁籤
2. 選擇 "6.5-Inch Display"
3. 上傳至少 3 張截圖（1290 x 2796）
4. 選擇 "5.5-Inch Display"
5. 上傳至少 3 張截圖（1242 x 2208）

### 步驟 3：填寫描述

1. 貼上上面準備的描述文字
2. 填寫關鍵字
3. 填寫支援 URL 和隱私政策 URL

### 步驟 4：填寫隱私問卷

Apple 會詢問以下問題，請據實回答：

**數據收集**：

- ✅ 姓名（從 Google 帳號）
- ✅ Email 地址（從 Google 帳號）
- ✅ 使用者 ID
- ✅ 產品互動（任務內容）
- ✅ 其他使用者內容（備註）

**數據用途**：

- ✅ 應用程式功能
- ✅ 產品個性化

**數據與使用者的關聯**：

- ✅ 是，數據與使用者身份相關聯

**數據用於追蹤**：

- ❌ 否，不用於追蹤

### 步驟 5：選擇 Build

1. 在 "Build" 區段，點擊 "+"
2. 選擇剛才上傳的 Build
3. 點擊 "完成"

### 步驟 6：審核資訊

填寫聯絡資訊和審核備註：

**審核備註**：

```
感謝審核我們的應用程式！

關於 Google 登入測試：
- 應用程式使用 Google OAuth 進行身份驗證
- 可以使用任何有效的 Google 帳號進行測試
- 測試帳號：test@example.com / password123（如果需要）

主要測試流程：
1. 點擊 "Sign in with Google" 按鈕
2. 選擇 Google 帳號並完成驗證
3. 登入後可以新增、編輯、刪除任務
4. 可以在日曆視圖中查看任務
5. 可以在設定中切換語言（英文/繁體中文）和主題（淺色/深色）

應用程式功能：
- 任務管理（CRUD 操作）
- 日曆整合
- 多語系支援
- 深色模式
- 雲端同步（透過 Supabase）

如有任何問題，請隨時聯繫我們。謝謝！
```

### 步驟 7：提交審核

1. 檢查所有資訊是否完整
2. 點擊 "Add for Review"
3. 選擇 "Automatically release this version"（自動發布）或 "Manually release this version"（手動發布）
4. 點擊 "Submit for Review"

---

## ⏱️ 時間預估

| 任務                   | 時間            | 狀態          |
| ---------------------- | --------------- | ------------- |
| 修復 App Icon          | 15 分鐘         | ⚠️ 待完成     |
| 配置 iOS OAuth         | 30 分鐘         | ⚠️ 待完成     |
| 更新 Redirect URLs     | 10 分鐘         | ⚠️ 待完成     |
| 準備截圖               | 1-2 小時        | ⚠️ 待完成     |
| 準備文字內容           | 30 分鐘         | ✅ 已提供範本 |
| Production Build       | 20 分鐘         | ⚠️ 待完成     |
| 填寫 App Store Connect | 30 分鐘         | ⚠️ 待完成     |
| **總計**               | **約 3-4 小時** |               |

審核時間：通常 24-48 小時

---

## ✅ 最終檢查清單

在提交前，請確認：

- [ ] App Icon 已更新為 1024x1024 無透明背景
- [ ] Associated Domains 已設定為 `applinks:too-doo-list.vercel.app`
- [ ] iOS OAuth Client ID 已創建並配置
- [ ] Supabase Redirect URLs 已更新
- [ ] 至少準備 6 張截圖（3 張 6.5"，3 張 5.5"）
- [ ] App Store 描述和關鍵字已填寫
- [ ] 隱私政策 URL 可以訪問
- [ ] 支援 URL 已設定
- [ ] 隱私問卷已完整填寫
- [ ] Production Build 已執行並測試
- [ ] 審核備註已填寫

---

## 🎉 完成後

提交審核後：

1. **等待審核**：通常 24-48 小時
2. **檢查 Email**：Apple 會發送審核狀態更新
3. **準備回應**：如果被拒絕，根據反饋修改並重新提交
4. **慶祝！**：審核通過後，App 就會在 App Store 上架

---

## 📞 需要幫助？

如果遇到問題：

1. 查看 `APP_STORE_SUBMISSION_CHECKLIST.md` 完整清單
2. 參考 Apple 的 [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
3. 查看 Expo 文檔：https://docs.expo.dev/submit/ios/

---

**祝你上架順利！🚀**
