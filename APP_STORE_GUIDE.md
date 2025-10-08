# App Store 上架完整指南

## 📋 前置準備

### 1. 必要帳號和工具

- [ ] **Apple Developer Account** ($99/年) - https://developer.apple.com
- [ ] **Expo Account** (免費) - https://expo.dev
- [ ] **App Store Connect 存取權限**

### 2. 需要準備的資料

- [ ] App 名稱（英文）: "To Do"
- [ ] Bundle Identifier: `com.cty0305.too.doo.list`
- [ ] App Icon (1024x1024px)
- [ ] App 截圖 (iPhone 6.7" & 6.5")
- [ ] App 描述（繁體中文、英文）
- [ ] 關鍵字
- [ ] 隱私政策 URL
- [ ] 支援 URL

---

## 🚀 階段 1: TestFlight 內部測試 (1-2 天)

### Step 1.1: 更新專案版本

```bash
# 更新版本號為測試版
npm run version:patch  # 會變成 1.0.2
```

### Step 1.2: 安裝 EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Step 1.3: 配置 iOS Build

```bash
# 建立 iOS credentials
eas credentials
```

### Step 1.4: 建立 TestFlight Build

```bash
# 建立 iOS 內部測試版
eas build --platform ios --profile preview

# 等待 build 完成（約 10-15 分鐘）
# Build 完成後會自動上傳到 App Store Connect
```

### Step 1.5: 在 App Store Connect 設定 TestFlight

1. 登入 https://appstoreconnect.apple.com
2. 選擇你的 App
3. 進入「TestFlight」標籤
4. 新增「內部測試人員」
5. 分享 TestFlight 連結給測試者

### Step 1.6: 收集測試回饋

- 使用 Google Form 或 App 內建回饋功能
- 追蹤 Crash 報告
- 記錄所有 bugs 和改進建議

---

## 📦 階段 2: 準備 App Store 資料 (2-3 天)

### Step 2.1: 準備 App Icon

- **要求**: 1024x1024px, PNG, 無透明度, 無圓角
- **目前檔案**: `assets/logo.png`
- **檢查**: 確保符合 Apple 規範

### Step 2.2: 準備 App 截圖

**必要尺寸**:

- iPhone 6.7" (1290 x 2796) - iPhone 14 Pro Max, 15 Pro Max
- iPhone 6.5" (1242 x 2688) - iPhone 11 Pro Max, XS Max

**建議內容**:

1. 登入畫面（展示 Google SSO）
2. 主要任務列表
3. 行事曆檢視
4. 新增/編輯任務
5. 設定頁面

**工具**:

```bash
# 使用 iOS Simulator 截圖
xcrun simctl io booted screenshot screenshot.png
```

### Step 2.3: 撰寫 App 描述

**App 標題** (30 字元以內):

```
To Do - Simple Task Manager
```

**副標題** (30 字元以內):

```
Organize Daily Tasks Easily
```

**描述** (4000 字元以內):

```
Transform your productivity with To Do!

✨ KEY FEATURES:
• Quick Google Sign-In - Start in seconds
• Clean & Intuitive Interface - Focus on what matters
• Calendar Integration - Plan your days ahead
• Smart Task Organization - Never miss a deadline
• Offline Support - Work anywhere, anytime
• Cross-Platform Sync - Access from any device

📱 SIMPLE & POWERFUL:
To Do combines simplicity with powerful features. Add tasks with just a tap, set times and links, and watch your productivity soar. Our clean design keeps you focused on getting things done.

🔒 SECURE & PRIVATE:
Your data is encrypted and securely stored. We respect your privacy and never share your information.

🌟 PERFECT FOR:
• Daily task management
• Work project tracking
• Personal goal setting
• Team collaboration
• Student assignments
• Life organization

Download To Do today and start achieving more!

---
Privacy Policy: [你的隱私政策 URL]
Terms of Service: [你的服務條款 URL]
```

**關鍵字** (100 字元，逗號分隔):

```
task,todo,list,productivity,calendar,organize,planner,goals,reminder,work
```

### Step 2.4: 準備法律文件

需要建立：

1. **隱私政策** (Privacy Policy)
2. **服務條款** (Terms of Service)

建議使用工具：

- https://www.termsfeed.com
- https://www.privacypolicies.com

---

## 🏗️ 階段 3: 建立正式版 Build (1 天)

### Step 3.1: 最終代碼檢查

```bash
# 確保沒有 console.log
# 確保所有功能正常
# 執行 linter
npm run lint

# 測試 production build
npx expo export:web
```

### Step 3.2: 更新版本號

```bash
# 更新到正式版本
npm version 1.0.0
```

### Step 3.3: 建立 Production Build

```bash
# 建立 iOS production build
eas build --platform ios --profile production

# 等待 build 完成（約 10-15 分鐘）
```

### Step 3.4: 自動提交到 App Store

```bash
# 自動提交（需要先設定 credentials）
eas submit --platform ios --latest

# 或手動從 App Store Connect 選擇 build
```

---

## 📝 階段 4: App Store Connect 設定 (1 天)

### Step 4.1: 建立 App 記錄

1. 登入 App Store Connect
2. 點擊「我的 App」→「+」→「新增 App」
3. 填寫基本資訊：
   - **平台**: iOS
   - **名稱**: To Do
   - **主要語言**: 繁體中文
   - **Bundle ID**: com.cty0305.too.doo.list
   - **SKU**: too-doo-list-001

### Step 4.2: 填寫 App 資訊

**「App 資訊」標籤**:

- 隱私政策 URL
- 類別: 生產力工具
- 副類別: 商業
- 內容權限: (根據你的內容選擇)

**「定價與供應狀況」**:

- 價格: 免費
- 供應地區: 選擇你要上架的國家/地區

### Step 4.3: 準備供審查

**「App 審查資訊」**:

- 登入資訊（如需要）：
  - 測試帳號: test@example.com
  - 測試密碼: TestPassword123
- 備註: 說明 app 的主要功能
- 聯絡資訊

**「版本資訊」**:

- 版本號: 1.0.0
- 此版本的新功能: "Initial release"
- 推廣文字 (170 字元)
- 描述
- 關鍵字
- 支援 URL
- 行銷 URL (optional)

### Step 4.4: 上傳媒體資源

1. App Icon (已在 build 中包含)
2. App 截圖（各尺寸）
3. App 預覽影片（optional）

### Step 4.5: 選擇 Build

1. 在「建置版本」區段
2. 選擇剛上傳的 build
3. 填寫「出口合規性資訊」

---

## 🚦 階段 5: 提交審查 (5-7 天等待)

### Step 5.1: 最終檢查

- [ ] 所有必填欄位已填寫
- [ ] 截圖已上傳
- [ ] Build 已選擇
- [ ] 法律文件連結有效
- [ ] App 符合審查指南

### Step 5.2: 提交審查

1. 點擊「提交以供審查」
2. 回答審查問卷
3. 確認提交

### Step 5.3: 等待審查結果

- **審查中**: 通常 1-3 天
- **需要更多資訊**: 儘快回應
- **被拒絕**: 修正問題後重新提交
- **準備銷售**: 可以發布了！

---

## ✅ 審查通過後

### 發布選項

1. **自動發布**: 審查通過後立即上架
2. **手動發布**: 審查通過後你手動發布
3. **排程發布**: 設定特定日期時間發布

### 發布後工作

1. 監控 App Store 評價
2. 追蹤下載數據
3. 修復 Crash 和 Bugs
4. 規劃下一版本更新

---

## 🔧 實用指令整理

```bash
# 登入 EAS
eas login

# 建立測試版
eas build --platform ios --profile preview

# 建立正式版
eas build --platform ios --profile production

# 提交到 App Store
eas submit --platform ios --latest

# 檢查 build 狀態
eas build:list

# 更新版本
npm run version:patch  # 1.0.0 -> 1.0.1
npm run version:minor  # 1.0.0 -> 1.1.0
npm run version:major  # 1.0.0 -> 2.0.0
```

---

## 📞 支援資源

- **Apple Developer**: https://developer.apple.com/support/
- **Expo Docs**: https://docs.expo.dev/
- **App Store 審查指南**: https://developer.apple.com/app-store/review/guidelines/
- **TestFlight 說明**: https://developer.apple.com/testflight/

---

## ⚠️ 常見問題

### Q: Build 失敗怎麼辦？

A: 檢查 `eas build:list` 的錯誤訊息，通常是 credentials 或 dependencies 問題

### Q: 審查被拒絕？

A: 仔細閱讀拒絕原因，修正後重新提交。常見原因：

- 缺少隱私政策
- App 功能不完整
- UI 問題
- Crash 或 bugs

### Q: 需要多久才能上架？

A:

- TestFlight: 幾小時
- App Store 首次審查: 1-7 天
- 更新審查: 1-3 天

### Q: 費用是多少？

A:

- Apple Developer: $99/年
- Expo (免費方案可用)
- App 免費上架（免費 app）

---

## 🎯 下一步建議

1. **立即開始**: 註冊 Apple Developer Account
2. **本週完成**: TestFlight 測試版
3. **2 週內**: 提交 App Store 審查
4. **1 個月內**: 正式上架

Good luck! 🚀
