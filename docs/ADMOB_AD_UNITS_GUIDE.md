# AdMob 廣告單元建立指南

本指南說明如何在 AdMob 控制台為 TaskCal 建立廣告單元，並將 ID 填入專案。

---

## 您的 App ID（已設定）

| 平台 | App ID                                   |
| ---- | ---------------------------------------- |
| iOS  | `ca-app-pub-6912116995419220~3944964842` |

Android 若已建立 App，請在控制台取得 Android App ID 後填入 `app.config.js` 與 `adService.js`。

---

## 一、建立廣告單元步驟

### 1. 登入 AdMob

1. 前往 [AdMob 控制台](https://admob.google.com/)
2. 選取您的應用程式（TaskCal）

### 2. 新增廣告單元

1. 左側選單點 **「應用程式」** → 點選 **TaskCal（iOS）**
2. 點 **「廣告單元」** 分頁
3. 點 **「新增廣告單元」**
4. 選擇廣告格式：
   - **Banner**：橫幅（目前 App 有使用）
   - Interstitial、Rewarded 可之後再建

### 3. 設定廣告單元

- **廣告單元名稱**：使用下方「建議命名」欄位的名稱，方便日後管理
- **廣告單元 ID**：建立後會自動產生，格式為 `ca-app-pub-6912116995419220/數字`

建立完成後，把畫面上顯示的 **廣告單元 ID**（整串）複製下來，貼到專案中對應位置。

---

## 二、建議命名（複製貼上到 AdMob 名稱欄位）

建立時在 AdMob 的「廣告單元名稱」使用以下名稱，之後在程式裡對應註解即可。

### iOS

| 廣告格式     | 建議名稱                        | 用途說明                 |
| ------------ | ------------------------------- | ------------------------ |
| Banner       | `TaskCal - iOS - Banner - Main` | 設定頁、行事曆頁底部橫幅 |
| Interstitial | `TaskCal - iOS - Interstitial`  | 日後插頁廣告（可選）     |
| Rewarded     | `TaskCal - iOS - Rewarded`      | 日後獎勵廣告（可選）     |

### Android（若已上架 Google Play）

| 廣告格式     | 建議名稱                            | 用途說明                 |
| ------------ | ----------------------------------- | ------------------------ |
| Banner       | `TaskCal - Android - Banner - Main` | 設定頁、行事曆頁底部橫幅 |
| Interstitial | `TaskCal - Android - Interstitial`  | 日後插頁廣告（可選）     |
| Rewarded     | `TaskCal - Android - Rewarded`      | 日後獎勵廣告（可選）     |

目前 App 只使用 **Banner**，先建立 Banner 即可。

---

## 三、將廣告單元 ID 填入專案

1. 在 AdMob 建立完 **Banner** 後，複製產生的 **廣告單元 ID**（例：`ca-app-pub-6912116995419220/1234567890`）
2. 開啟 `src/services/adService.js`
3. 在 `PRODUCTION_AD_UNIT_IDS` 中，將對應平台的 `banner` 值替換為您複製的 ID：

```javascript
const PRODUCTION_AD_UNIT_IDS = {
  ios: {
    banner: "ca-app-pub-6912116995419220/您從控制台複製的數字",
    // interstitial、rewarded 可之後建立再填
  },
  android: {
    banner: "ca-app-pub-6912116995419220/您從控制台複製的數字",
  },
  web: { banner: "..." }, // 若有 Web 版再填
};
```

4. 存檔後，以 **Production build**（非 **DEV**）執行時會載入正式廣告。

---

## 四、檢查清單

- [ ] AdMob 已建立 iOS App（App ID: `ca-app-pub-6912116995419220~3944964842`）
- [ ] 已建立 iOS Banner 廣告單元，名稱：`TaskCal - iOS - Banner - Main`
- [ ] 已將 Banner 廣告單元 ID 貼到 `src/services/adService.js` 的 `PRODUCTION_AD_UNIT_IDS.ios.banner`
- [ ] （選填）已設定 app-ads.txt，見 [ADMOB_APP_ADS_TXT.md](./ADMOB_APP_ADS_TXT.md)

---

## 參考

- [AdMob 應用程式設定](https://support.google.com/admob/answer/9989985)
- [廣告單元 ID 說明](https://support.google.com/admob/answer/7356431)
