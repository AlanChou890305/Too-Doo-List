# AdMob 廣告整合指南

本指南說明如何在 TaskCal 應用程式中設置和使用 Google AdMob 廣告。

## 📋 目錄

1. [前置準備](#前置準備)
2. [AdMob 帳戶設置](#admob-帳戶設置)
3. [安裝依賴](#安裝依賴)
4. [配置廣告單元 ID](#配置廣告單元-id)
5. [廣告位置](#廣告位置)
6. [測試廣告](#測試廣告)
7. [生產環境部署](#生產環境部署)
8. [最佳實踐](#最佳實踐)
9. [疑難排解](#疑難排解)

## 前置準備

在開始之前，請確保您已經：

- ✅ 擁有 Google AdMob 帳戶（如果沒有，請前往 [AdMob 官網](https://admob.google.com/) 註冊）
- ✅ 應用程式已在 App Store 上架（AdMob 需要應用程式 ID）
- ✅ 已安裝 Node.js 和 Expo CLI

## AdMob 帳戶設置

### 1. 創建 AdMob 帳戶

1. 前往 [Google AdMob](https://admob.google.com/)
2. 使用您的 Google 帳戶登入
3. 完成帳戶設置流程

### 2. 添加應用程式

1. 在 AdMob 控制台中，點擊「應用程式」→「新增應用程式」
2. 選擇平台（iOS）
3. 輸入應用程式名稱和 Bundle ID：`com.cty0305.too.doo.list`
4. 記錄您的 **App ID**（格式：`ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`）

### 3. 創建廣告單元

為每個廣告類型創建廣告單元：

#### Banner 廣告（橫幅廣告）
1. 點擊「廣告單元」→「新增廣告單元」
2. 選擇「橫幅廣告」
3. 輸入名稱（例如：`TaskCal - Banner - iOS`）
4. 記錄廣告單元 ID（格式：`ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX`）

#### Interstitial 廣告（插頁式廣告，可選）
1. 選擇「插頁式廣告」
2. 輸入名稱（例如：`TaskCal - Interstitial - iOS`）
3. 記錄廣告單元 ID

#### Rewarded 廣告（獎勵式廣告，可選）
1. 選擇「獎勵廣告」
2. 輸入名稱（例如：`TaskCal - Rewarded - iOS`）
3. 記錄廣告單元 ID

## 安裝依賴

已安裝的套件：

```json
{
  "expo-ads-admob": "~13.0.0",
  "react-native-google-mobile-ads": "^14.0.0"
}
```

如果尚未安裝，請執行：

```bash
npm install react-native-google-mobile-ads expo-ads-admob
```

## 配置廣告單元 ID

### 1. 更新 `app.config.js`

在 `app.config.js` 中，找到 AdMob 插件配置並替換為您的實際 App ID：

```javascript
[
  "react-native-google-mobile-ads",
  {
    iosAppId: "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX", // 替換為您的 iOS App ID
  },
],
```

### 2. 更新 `src/services/adService.js`

在 `src/services/adService.js` 中，找到 `PRODUCTION_AD_UNIT_IDS` 並替換為您的實際廣告單元 ID：

```javascript
const PRODUCTION_AD_UNIT_IDS = {
  ios: {
    banner: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX", // 替換為您的 iOS Banner ID
    interstitial: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX", // 替換為您的 iOS Interstitial ID
    rewarded: "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX", // 替換為您的 iOS Rewarded ID
  },
  // ...
};
```

## 廣告位置

目前廣告已整合在以下位置：

### 1. CalendarScreen（日曆畫面）
- **位置**：任務區域底部
- **類型**：Banner 廣告
- **檔案**：`App.js` (約第 7600 行)

### 2. SettingScreen（設定畫面）
- **位置**：設定選項底部（刪除帳戶按鈕之後）
- **類型**：Banner 廣告
- **檔案**：`App.js` (約第 4940 行)

## 測試廣告

### 開發模式

應用程式在開發模式（`__DEV__ === true`）下會自動使用 Google 提供的測試廣告單元 ID。這些測試廣告不會產生收入，但可以用來驗證廣告顯示是否正常。

### 測試設備

在 AdMob 控制台中，將您的測試設備添加到測試設備列表：

1. 前往 AdMob 控制台 →「設定」→「應用程式設定」
2. 找到「測試設備」部分
3. 添加您的設備 ID

### 驗證廣告顯示

1. 運行應用程式：`npm start` 或 `expo start`
2. 檢查控制台日誌，應該看到：
   ```
   AdMob initialized successfully
   Banner ad loaded: [ad object]
   ```

## 生產環境部署

### 1. 更新配置

確保所有廣告單元 ID 都已更新為生產環境的 ID：

- ✅ `app.config.js` 中的 `iosAppId`
- ✅ `src/services/adService.js` 中的 `PRODUCTION_AD_UNIT_IDS`

### 2. 禁用測試模式

在 `src/services/adService.js` 中，確保測試模式已關閉：

```javascript
static isTestMode = false; // 生產環境設為 false
```

或者保持 `__DEV__` 檢查，這樣在生產構建中會自動使用生產廣告。

### 3. 構建應用程式

```bash
# iOS 構建
eas build --platform ios
```

### 4. 提交審核

在提交到 App Store 之前，確保：

- ✅ 廣告符合 Apple 的廣告政策
- ✅ 廣告不會干擾用戶體驗
- ✅ 已正確處理廣告載入失敗的情況

## 最佳實踐

### 1. 用戶體驗

- ✅ **不要過度顯示廣告**：只在適當的位置顯示廣告
- ✅ **避免干擾核心功能**：確保廣告不會阻擋重要的 UI 元素
- ✅ **提供關閉選項**：考慮為付費用戶提供移除廣告的選項

### 2. 廣告載入

- ✅ **錯誤處理**：廣告載入失敗時不應影響應用程式功能
- ✅ **載入時機**：在適當的時機載入廣告，避免影響應用程式啟動速度

### 3. 收入優化

- ✅ **A/B 測試**：測試不同的廣告位置和類型
- ✅ **監控數據**：定期查看 AdMob 控制台的收入數據
- ✅ **優化填充率**：確保廣告請求的填充率盡可能高

### 4. 隱私合規

- ✅ **GDPR 合規**：如果面向歐洲用戶，確保符合 GDPR 要求
- ✅ **COPPA 合規**：如果應用程式面向兒童，需要遵守 COPPA 規定
- ✅ **隱私政策**：在隱私政策中說明廣告數據收集

## 疑難排解

### 廣告不顯示

1. **檢查廣告單元 ID**：確保使用的是正確的廣告單元 ID
2. **檢查網絡連接**：確保設備有網絡連接
3. **查看控制台日誌**：檢查是否有錯誤訊息
4. **驗證 AdMob 帳戶**：確保 AdMob 帳戶已完全設置

### 常見錯誤

#### "Ad failed to load"
- 檢查廣告單元 ID 是否正確
- 確認 AdMob 帳戶狀態正常
- 檢查網絡連接

#### "AdMob not initialized"
- 確保 `AdService.initialize()` 已正確調用
- 檢查 `app.config.js` 中的配置

### 獲取幫助

- [AdMob 官方文檔](https://developers.google.com/admob)
- [React Native Google Mobile Ads 文檔](https://github.com/invertase/react-native-google-mobile-ads)
- [Expo AdMob 文檔](https://docs.expo.dev/versions/latest/sdk/ads-admob/)

## 下一步

1. ✅ 完成 AdMob 帳戶設置
2. ✅ 獲取 App ID 和廣告單元 ID
3. ✅ 更新配置文件
4. ✅ 測試廣告顯示
5. ✅ 構建並部署到生產環境
6. ✅ 監控廣告收入和用戶反饋

## 注意事項

⚠️ **重要**：
- 在生產環境中，務必使用您自己的廣告單元 ID，不要使用測試 ID
- 確保遵守 Apple 和 Google 的廣告政策
- 定期檢查 AdMob 控制台以監控廣告狀態和收入

---

**最後更新**：2024年
