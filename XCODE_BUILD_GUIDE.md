# Xcode 本地構建指南

## 功能說明

**v1.4.0 新增功能：任務提醒通知**
- 自動在任務時間前 30 分鐘發送提醒通知
- 完成或刪除任務時自動取消通知
- 僅在原生 iOS/Android 平台可用

---

## 為什麼需要本地構建？

本次更新新增了 `expo-notifications` 原生模組，需要：
- ✅ 原生代碼構建（不能純 OTA 更新）
- ✅ 使用 Xcode 本地構建（免費，不消耗 EAS credits）

---

## 步驟 1：安裝依賴

```bash
cd /Users/hububble/Desktop/Too-Doo-List
npm install
```

---

## 步驟 2：Prebuild 原生項目

```bash
npx expo prebuild --clean
```

這個命令會：
- 生成或更新 `ios/` 和 `android/` 目錄
- 配置 expo-notifications 插件
- 設定 iOS 推送通知權限

**預期輸出：**
```
✔ Created native projects | /ios, /android
✔ Updated package.json
✔ Config synced
```

---

## 步驟 3：安裝 iOS 依賴（CocoaPods）

```bash
cd ios
pod install
cd ..
```

**預期輸出：**
```
Installing expo-notifications (x.x.x)
...
Pod installation complete! There are XX dependencies...
```

---

## 步驟 4：使用 Xcode 打開項目

```bash
open ios/ToDo.xcworkspace
```

⚠️ **重要：** 
- 必須打開 `.xcworkspace`，不是 `.xcodeproj`
- 否則 CocoaPods 依賴將無法載入

---

## 步驟 5：配置 Xcode

### 5.1 選擇 Team
1. 在 Xcode 左側選擇 **ToDo** 專案
2. 選擇 **Signing & Capabilities** 標籤
3. 在 **Team** 下拉選單選擇你的 Apple Developer 帳號
4. 確認 **Bundle Identifier**: `com.cty0305.too.doo.list`

### 5.2 檢查通知權限
在 **Signing & Capabilities** 中應該會看到：
- ✅ **Push Notifications** capability（自動添加）
- ✅ **Background Modes** → Remote notifications（如需要）

如果沒有，點擊 `+ Capability` 手動添加 **Push Notifications**。

---

## 步驟 6：選擇構建目標

在 Xcode 頂部工具欄：
- **目標設備：** 選擇你的 iPhone 或 iOS 模擬器
- **方案：** ToDo

### 真機測試（推薦）
1. 用 USB 線連接 iPhone
2. 在裝置上信任這台電腦
3. 選擇你的 iPhone 作為目標

### 模擬器測試
1. 選擇任意 iOS 模擬器（如 iPhone 15 Pro）
2. ⚠️ 模擬器**不支援**推送通知，僅能測試基本功能

---

## 步驟 7：Build & Run

點擊 Xcode 左上角的 **播放按鈕 (▶️)** 或按 `Cmd + R`

**首次構建可能需要 5-10 分鐘**

構建成功後，app 會自動安裝到你的設備並啟動。

---

## 步驟 8：測試通知功能

### 測試步驟：

1. **授予通知權限**
   - 首次啟動時會彈出通知權限請求
   - 點擊 **允許**

2. **創建測試任務**
   - 日期：今天或明天
   - 時間：當前時間 + 31 分鐘（例如現在 14:00，設定 14:31）
   - 任務內容：「測試通知」

3. **等待通知**
   - 任務時間前 30 分鐘（14:01）應該收到通知
   - 通知標題：「任務提醒」或 "Task Reminder"
   - 通知內容：「測試通知」

4. **測試通知取消**
   - 創建另一個任務
   - 在通知發送前標記為完成或刪除
   - 確認不會收到通知

---

## 常見問題

### Q1: `pod install` 失敗
```bash
# 更新 CocoaPods
sudo gem install cocoapods
pod repo update

# 清理後重試
cd ios
pod deintegrate
pod install
```

### Q2: Xcode 簽名錯誤
- 確認你已登入 Apple Developer 帳號
- 在 Xcode → Preferences → Accounts 中檢查
- 如果是免費帳號，Bundle ID 可能需要改成唯一的

### Q3: 模擬器中通知不工作
- 這是正常的，iOS 模擬器不支援本地推送通知
- 必須使用真機測試

### Q4: 真機上沒有收到通知
1. 檢查通知權限：設定 → 通知 → To Do
2. 檢查任務時間是否在未來
3. 檢查 Xcode Console 日誌是否有錯誤
4. 確認時間設定正確（需要 > 當前時間 + 30 分鐘）

---

## 之後的更新

### 純 JavaScript 更新（可用 OTA）
如果之後的更新不涉及原生模組：
```bash
# 更新代碼後
eas update --branch production
```

### 涉及原生模組（需要重新構建）
如果添加新的原生依賴：
```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
# 然後在 Xcode 中重新構建
```

---

## 發布到 TestFlight

構建成功後，如需發布到 TestFlight：

### 方案 A：使用 Xcode Archive（免費）
1. 在 Xcode 中選擇 **Product → Archive**
2. 等待 Archive 完成
3. 在 Organizer 中選擇 **Distribute App**
4. 選擇 **TestFlight & App Store**
5. 跟隨步驟上傳到 App Store Connect

### 方案 B：使用 EAS Build（需要 credits）
```bash
eas build --platform ios --profile production
```

---

## 檢查清單

構建前確認：
- [ ] `npm install` 完成
- [ ] `npx expo prebuild --clean` 成功
- [ ] `pod install` 完成
- [ ] 版本號已更新至 1.4.0
- [ ] Xcode 中 Team 已設定
- [ ] Push Notifications capability 已添加

測試前確認：
- [ ] 使用真機（模擬器無法測試通知）
- [ ] 已授予通知權限
- [ ] 任務時間設定在未來 30+ 分鐘
- [ ] 裝置時間設定正確

---

## 相關檔案

- 通知服務：`src/services/notificationService.js`
- 主程式邏輯：`App.js`（搜尋 `scheduleTaskNotification`）
- 配置檔案：`app.config.js`（plugins 中的 expo-notifications）

---

## 需要協助？

如遇到問題，檢查：
1. Xcode Console 日誌
2. Metro Bundler 輸出
3. `npx expo-env-info` 環境資訊


