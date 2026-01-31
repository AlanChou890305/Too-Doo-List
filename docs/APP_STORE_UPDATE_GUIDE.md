# App Store 更新指南 - AdMob 整合版本

本指南說明如何將包含 AdMob 廣告整合的新版本更新到 App Store。

## 📋 更新前檢查清單

### 1. AdMob 配置檢查

在更新到 App Store 之前，請確認：

- [ ] **已設置 AdMob 帳戶並創建應用程式**
- [ ] **已獲取 iOS App ID**（格式：`ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`）
- [ ] **已創建 Banner 廣告單元並獲取廣告單元 ID**
- [ ] **已更新 `app.config.js` 中的 `iosAppId`**
- [ ] **已更新 `src/services/adService.js` 中的 `PRODUCTION_AD_UNIT_IDS`**

### 2. 版本號更新

當前版本：`1.2.3` (Build: 11)

下次更新建議：`1.2.4` (Build: 12) 或 `1.3.0` (Build: 12)

## 📦 OTA 更新（EAS Update，僅改 JS 時）

若只修改 **JavaScript**（例如修 bug、改文案、改樣式），**不需送審**，可用 OTA 推給已安裝用戶：

1. 修改程式後，在專案根目錄執行：
   ```bash
   eas update --branch production --message "修復行事曆日期對齊"
   ```
2. 用戶下次**開啟 App**（或本次若尚未關閉會自動重載）即會套用更新。
3. **注意**：若改了 native（如 `app.config.js` 的 plugins、權限、iOS 專案），必須重新 `eas build` 並送審；OTA 只更新 JS bundle。
4. `app.config.js` 的 `runtimeVersion` 需與目前上架 binary 一致，OTA 才會套用；若曾重新建置並上架，需同步更新 `runtimeVersion`。

## 🚀 更新步驟（送審新版本時）

### Step 1: 更新 AdMob 配置（如果尚未完成）

#### 1.1 更新 `app.config.js`

在 `app.config.js` 中找到 AdMob 插件配置，替換為您的實際 App ID：

```javascript
[
  "react-native-google-mobile-ads",
  {
    iosAppId: "ca-app-pub-6912116995419220~XXXXXXXXXX", // 替換為您的實際 App ID
  },
],
```

#### 1.2 更新 `src/services/adService.js`

在 `src/services/adService.js` 中找到 `PRODUCTION_AD_UNIT_IDS`，替換為您的實際廣告單元 ID：

```javascript
const PRODUCTION_AD_UNIT_IDS = {
  ios: {
    banner: "ca-app-pub-6912116995419220/XXXXXXXXXX", // 替換為您的實際 Banner ID
    // ...
  },
  // ...
};
```

**注意**：如果尚未設置 AdMob，可以暫時使用測試廣告（開發模式會自動使用測試廣告）。

### Step 2: 更新版本號

#### 選項 A: 使用 npm scripts（推薦）

```bash
# Patch version (1.2.2 -> 1.2.3)
npm run version:patch

# 或 Minor version (1.2.2 -> 1.3.0)
npm run version:minor
```

這會自動更新：

- `package.json` 中的版本號
- `app.config.js` 中的版本號

#### 選項 B: 手動更新

1. 更新 `app.config.js`：

   ```javascript
   version: "1.2.3", // 或您想要的版本號
   iosBuildNumber: "11", // 遞增 build number
   ```

2. 更新 `package.json`：
   ```json
   "version": "1.2.3"
   ```

### Step 3: 本地測試

在構建之前，建議先進行本地測試：

```bash
# 啟動開發伺服器
npm start

# 在 iOS 模擬器中測試
npm run ios
```

**測試重點**：

- ✅ 應用程式正常啟動
- ✅ 廣告是否正常顯示（或測試廣告）
- ✅ 核心功能正常運作
- ✅ 沒有 crash 或錯誤

### Step 4: 構建 Production 版本

#### 使用 EAS Build（推薦）

```bash
# 構建 iOS Production 版本
eas build --platform ios --profile production
```

**構建過程**：

1. EAS 會自動處理憑證和配置
2. 構建時間約 10-20 分鐘
3. 構建完成後會提供下載連結

**查看構建進度**：

- 終端會顯示進度
- 或訪問：https://expo.dev/accounts/[your-account]/projects/taskcal/builds

#### 使用 Xcode（本地構建）

```bash
# 1. 生成 iOS 專案
npx expo prebuild --clean --platform ios

# 2. 安裝依賴
cd ios && pod install && cd ..

# 3. 打開 Xcode
open ios/TaskCal.xcworkspace
```

在 Xcode 中：

1. 選擇 **Product > Scheme > TaskCal**
2. 選擇 **Product > Archive**
3. 等待 Archive 完成
4. 在 Organizer 中選擇 **Distribute App**

### Step 5: 提交到 App Store

#### 使用 EAS Submit（推薦）

```bash
# 自動提交最新構建
eas submit --platform ios --profile production
```

#### 使用 Xcode

1. 在 Xcode Organizer 中選擇 Archive
2. 點擊 **Distribute App**
3. 選擇 **App Store Connect**
4. 選擇 **Upload**
5. 跟隨步驟完成上傳

### Step 6: 在 App Store Connect 中處理

1. **登入 App Store Connect**
   - 前往 https://appstoreconnect.apple.com
   - 選擇您的應用程式

2. **等待構建處理**
   - 上傳後需要幾分鐘到幾小時處理
   - 在「TestFlight」或「App Store」標籤中查看

3. **更新版本資訊**（如果需要）
   - 版本號：`1.2.3`
   - 更新說明：描述新功能和改進

4. **提交審核**
   - 檢查所有資訊
   - 點擊「Submit for Review」

## 📝 更新說明範例

### 版本 1.2.3（或 1.3.0）

**新功能**：

- ✨ 整合 AdMob 廣告以支援應用程式持續開發
- 🐛 修復安全漏洞
- 🔧 效能優化

**廣告說明**（給審核人員）：

- 應用程式已整合 Google AdMob 廣告
- 廣告位置：日曆畫面底部和設定畫面底部
- 廣告不會干擾核心功能
- 符合 Apple 廣告政策

## ⚠️ 重要注意事項

### AdMob 相關

1. **測試模式**
   - 開發模式下會自動使用測試廣告
   - 生產環境需要使用實際的廣告單元 ID

2. **Apple 審核**
   - 確保廣告符合 Apple 的廣告政策
   - 廣告不應干擾用戶體驗
   - 確保有適當的錯誤處理

3. **隱私政策**
   - 如果收集廣告相關數據，需要在隱私政策中說明
   - 確保符合 GDPR 和其他隱私法規

### 版本號規則

- **Patch** (1.2.2 → 1.2.3): 小修復、安全更新
- **Minor** (1.2.2 → 1.3.0): 新功能（如 AdMob 整合）
- **Major** (1.2.2 → 2.0.0): 重大變更

### Build Number

- 每次提交到 App Store 都需要遞增 Build Number
- 即使版本號相同，Build Number 也必須遞增

## 🔍 疑難排解

### 構建失敗

1. **檢查 AdMob 配置**

   ```bash
   # 確認 app.config.js 中的配置正確
   cat app.config.js | grep -A 3 "react-native-google-mobile-ads"
   ```

2. **檢查依賴項**

   ```bash
   npm install
   cd ios && pod install && cd ..
   ```

3. **清理構建**

   ```bash
   # 清理 Expo 緩存
   npx expo start --clear

   # 清理 iOS 構建
   cd ios && xcodebuild clean && cd ..
   ```

### 廣告不顯示

- 開發模式：使用測試廣告單元 ID（自動）
- 生產模式：確保使用實際的廣告單元 ID
- 檢查網絡連接
- 查看控制台日誌

### App Store 審核被拒

常見原因：

- 廣告位置不當
- 缺少隱私政策說明
- 廣告干擾用戶體驗

解決方案：

- 調整廣告位置
- 更新隱私政策
- 提供詳細的審核說明

## 📚 相關資源

- [AdMob 設置指南](./ADMOB_SETUP.md)
- [app-ads.txt 設置指南](./ADMOB_APP_ADS_TXT.md)
- [EAS Build 文檔](https://docs.expo.dev/build/introduction/)
- [App Store 審核指南](https://developer.apple.com/app-store/review/guidelines/)

---

**最後更新**：2024 年
