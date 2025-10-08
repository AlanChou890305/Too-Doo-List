# 🚀 下一步：建立 TestFlight Build

## ✅ 已完成的準備工作

1. ✅ EAS CLI 已更新到最新版本
2. ✅ `eas.json` 配置已修正
3. ✅ `app.config.js` 已添加加密聲明
4. ✅ 隱私政策和服務條款已部署
5. ✅ 所有文件指南已建立

---

## 📋 現在你需要做的（重要！）

### Step 1: 在終端機執行以下指令

```bash
eas build --platform ios --profile preview
```

### Step 2: 回答互動式問題

當系統提示時，請按照以下回答：

#### 問題 1: Apple Team 選擇
```
? Select an Apple Team:
```
**回答**: 選擇你的 Apple Developer Team（通常會自動偵測）

#### 問題 2: iOS Distribution Certificate
```
? Would you like to automatically set up Distribution Certificate?
```
**回答**: 選擇 `Yes` (或按 Enter)

#### 問題 3: Provisioning Profile
```
? Would you like to automatically generate a Provisioning Profile?
```
**回答**: 選擇 `Yes` (或按 Enter)

---

## ⏱️ Build 過程

1. **設定 Credentials**: 約 2-3 分鐘
2. **上傳代碼**: 約 1-2 分鐘  
3. **Cloud Build**: 約 10-15 分鐘
4. **處理和上傳**: 約 2-3 分鐘

**總計**: 約 15-20 分鐘

---

## 📊 監控 Build 進度

### 方法 1: 在終端機查看
```bash
# 列出所有 builds
eas build:list

# 查看最新 build 的詳細資訊
eas build:view
```

### 方法 2: 在網頁查看（推薦）
打開瀏覽器前往：
```
https://expo.dev/accounts/cty0305/projects/too-doo-list/builds
```

---

## ✅ Build 成功後的步驟

### 1. 等待 App Store Connect 處理
- Build 會自動上傳到 App Store Connect
- 處理時間：約 5-10 分鐘
- 你會收到 email 通知

### 2. 設定 TestFlight
1. 前往 https://appstoreconnect.apple.com
2. 選擇你的 App "To Do"
3. 點擊 "TestFlight" 標籤
4. 你的 build 會出現在這裡

### 3. 新增測試人員
1. 點擊 "內部測試" 或 "外部測試"
2. 點擊 "+" 新增測試人員
3. 輸入測試人員的 Apple ID email
4. 他們會收到 TestFlight 邀請

---

## 🐛 如果遇到問題

### 問題 1: "No credentials found"
**解決方案**:
```bash
eas credentials
# 選擇: iOS > Set up credentials > Set up
```

### 問題 2: "Bundle Identifier not found"
**解決方案**:
1. 前往 https://developer.apple.com/account/resources/identifiers/list
2. 檢查 `com.cty0305.too.doo.list` 是否存在
3. 如果不存在，創建一個新的 App ID

### 問題 3: Build 失敗
**解決方案**:
1. 查看錯誤訊息
2. 檢查 build logs：
   ```bash
   eas build:view
   ```
3. 參考 `TESTFLIGHT_SETUP.md` 中的常見問題

---

## 📱 測試人員安裝指南

分享給你的測試人員：

### 1. 安裝 TestFlight
- iPhone/iPad: https://apps.apple.com/app/testflight/id899247664
- 或在 App Store 搜索 "TestFlight"

### 2. 接受邀請
- 打開 email 中的邀請連結
- 或在 TestFlight 中輸入邀請碼

### 3. 安裝和測試
- 點擊 "安裝"
- 開始測試 To Do app
- 提供回饋

---

## 🎯 收集測試回饋

### 建議使用 Google Form
建立一個簡單的 Google Form 包含：
- 測試人員姓名
- 設備型號（iPhone 15, iPad Pro 等）
- iOS 版本
- 發現的問題或建議
- 評分（1-5 星）

### 或使用 TestFlight 內建回饋
測試人員可以在 TestFlight app 中直接提交回饋和截圖。

---

## 📝 下一個里程碑

完成 TestFlight 測試後：

1. **修復 Bugs** - 根據測試回饋修正問題
2. **準備截圖** - 參考 `scripts/prepare-screenshots.md`
3. **填寫 App Store 資料** - 參考 `APP_STORE_METADATA.md`
4. **建立 Production Build**
   ```bash
   eas build --platform ios --profile production
   ```
5. **提交 App Store 審查**

---

## 🚀 立即開始

**在你的終端機中執行：**

```bash
eas build --platform ios --profile preview
```

然後按照提示回答問題。

Good luck! 🎉

---

## 📞 需要幫助？

- **Expo 文件**: https://docs.expo.dev/build/introduction/
- **TestFlight 指南**: `TESTFLIGHT_SETUP.md`
- **App Store 指南**: `APP_STORE_GUIDE.md`

