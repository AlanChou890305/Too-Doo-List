# TestFlight 設定指南

## 🎯 目標

將你的 To Do app 部署到 TestFlight 供內部測試

---

## ⚠️ 重要：在開始之前

### 必須準備的項目

1. **Apple Developer Account** ($99/年)

   - 前往 https://developer.apple.com/programs/
   - 註冊並完成付款
   - 等待帳號啟用（通常 24-48 小時）

2. **App Store Connect 存取權限**

   - 登入 https://appstoreconnect.apple.com
   - 確認可以正常進入

3. **EAS 已登入** ✅
   - 你已經完成：`cty0305`

---

## 📋 Step-by-Step 設定流程

### Step 1: 設定 Apple Credentials

執行以下指令來設定 iOS credentials：

```bash
eas credentials
```

你會看到以下選項，請按順序選擇：

1. **Select platform**: 選擇 `iOS`
2. **Select build credentials**: 選擇 `Set up credentials for this build`
3. **What do you want to do?**: 選擇 `Set up`

EAS 會自動處理：

- 建立或使用現有的 Distribution Certificate
- 建立或使用現有的 Provisioning Profile
- 建立 Push Notification keys（如果需要）

### Step 2: 更新版本號（可選）

如果你想更新版本號：

```bash
# Patch version (1.0.1 -> 1.0.2)
npm run version:patch

# Minor version (1.0.1 -> 1.1.0)
npm run version:minor

# Major version (1.0.1 -> 2.0.0)
npm run version:major
```

當前版本：`1.0.1`

### Step 3: 建立 TestFlight Build

執行以下指令開始 build：

```bash
eas build --platform ios --profile preview
```

**互動問題回答指南**：

1. **iOS app only uses standard/exempt encryption?**

   - 回答：`No` (我們已經在 app.config.js 設定了)

2. **Would you like to automatically create credentials?**

   - 回答：`Yes`

3. **Select a team**（如果有多個團隊）

   - 選擇你的 Apple Developer Team

4. **Select a provisioning profile**
   - 選擇：`Let EAS handle it` 或現有的 profile

### Step 4: 等待 Build 完成

- ⏱️ **預計時間**: 10-20 分鐘
- 📊 **查看進度**: https://expo.dev/accounts/cty0305/projects/too-doo-list/builds
- 📧 **通知**: Build 完成後會收到 email

### Step 5: Build 完成後

Build 完成後，EAS 會自動：

1. ✅ 上傳到 App Store Connect
2. ✅ 處理 TestFlight 所需的合規性
3. ✅ 準備好供測試

---

## 🧪 在 TestFlight 中測試

### 設定 TestFlight

1. **登入 App Store Connect**

   - https://appstoreconnect.apple.com

2. **選擇你的 App**

   - 名稱：To Do
   - Bundle ID：com.cty0305.too.doo.list

3. **進入 TestFlight 標籤**

4. **新增內部測試人員**

   - 點擊「內部測試」
   - 點擊「+」新增測試人員
   - 輸入測試人員的 Apple ID email
   - 選擇 build 版本

5. **分享 TestFlight 連結**
   - 測試人員會收到 email
   - 或直接分享 TestFlight 公開連結

### 測試人員安裝步驟

1. 在 iPhone/iPad 上安裝 TestFlight app

   - https://apps.apple.com/app/testflight/id899247664

2. 點擊 email 中的連結或輸入邀請碼

3. 接受邀請並下載 app

4. 開始測試！

---

## 🐛 常見問題和解決方案

### Q1: "No credentials found"

**解決方案**:

```bash
eas credentials
# 選擇 iOS > Set up credentials > Set up
```

### Q2: "Bundle Identifier already exists"

**解決方案**:

- 確認你是該 Bundle ID 的擁有者
- 在 Apple Developer Portal 檢查 Identifiers

### Q3: "Distribution Certificate expired"

**解決方案**:

```bash
eas credentials
# 選擇 iOS > Distribution Certificate > Set up a new distribution certificate
```

### Q4: "Provisioning Profile invalid"

**解決方案**:

```bash
eas credentials
# 選擇 iOS > Provisioning Profile > Generate new profile
```

### Q5: Build 卡在 "Waiting for build to complete"

**解決方案**:

- 查看 https://expo.dev/accounts/cty0305/projects/too-doo-list/builds
- 檢查 build logs 找出錯誤
- 常見原因：credentials 問題、code signing 錯誤

---

## ✅ 檢查清單

### 開始 Build 前

- [ ] Apple Developer Account 已啟用
- [ ] EAS 已登入（cty0305）
- [ ] Bundle ID 正確：com.cty0305.too.doo.list
- [ ] app.config.js 已設定加密聲明
- [ ] 沒有語法錯誤（npm run lint）

### Build 期間

- [ ] Credentials 已設定
- [ ] Build 成功啟動
- [ ] 在 Expo dashboard 可以看到進度

### Build 完成後

- [ ] Build 狀態為 "Finished"
- [ ] 可以在 App Store Connect 看到 build
- [ ] TestFlight 處理完成（約 5-10 分鐘）

### TestFlight 測試

- [ ] 已新增內部測試人員
- [ ] 測試人員收到邀請
- [ ] App 可以在 TestFlight 安裝
- [ ] 基本功能正常運作

---

## 📞 需要幫助？

如果遇到問題：

1. **查看 Build Logs**

   ```bash
   eas build:list
   # 找到 build ID
   eas build:view <BUILD_ID>
   ```

2. **檢查 Credentials**

   ```bash
   eas credentials
   ```

3. **Expo 文件**

   - https://docs.expo.dev/build/introduction/
   - https://docs.expo.dev/build-reference/ios-capabilities/

4. **Apple 支援**
   - https://developer.apple.com/support/

---

## 🎉 下一步

TestFlight 測試成功後：

1. 收集測試回饋
2. 修復 bugs
3. 準備 App Store 截圖和資料
4. 建立 production build
5. 提交 App Store 審查

Good luck! 🚀
