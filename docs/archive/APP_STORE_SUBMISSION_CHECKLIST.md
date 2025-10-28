# App Store 上架檢查清單

## 📋 檢查日期：2025-10-16

---

## ✅ 1. 應用程式基本資訊

| 項目                  | 狀態 | 詳細資訊                         |
| --------------------- | ---- | -------------------------------- |
| **應用程式名稱**      | ✅   | To Do                            |
| **Bundle Identifier** | ✅   | com.cty0305.too.doo.list         |
| **版本號**            | ✅   | 1.6.0                            |
| **最低 iOS 版本**     | ⚠️   | 未明確設定（建議設定 iOS 13.0+） |

---

## ✅ 2. App Icon

| 項目         | 狀態 | 詳細資訊                              |
| ------------ | ---- | ------------------------------------- |
| **圖標文件** | ✅   | assets/logo.png                       |
| **圖標尺寸** | ⚠️   | 1088 x 960 (非正方形，建議 1024x1024) |
| **圖標格式** | ✅   | PNG                                   |
| **透明背景** | ⚠️   | 需要檢查（App Store 不允許透明背景）  |

### 🔧 建議修復：

```bash
# 調整為正方形 1024x1024
sips -z 1024 1024 assets/logo.png --out assets/icon-1024.png
```

---

## ✅ 3. 隱私政策和使用條款

| 項目             | 狀態 | 詳細資訊                   |
| ---------------- | ---- | -------------------------- |
| **隱私政策頁面** | ✅   | App 內已實現 PrivacyScreen |
| **使用條款頁面** | ✅   | App 內已實現 TermsScreen   |
| **隱私政策 URL** | ⚠️   | 需要提供公開 URL           |
| **使用條款 URL** | ⚠️   | 需要提供公開 URL           |

### 🔧 建議：

Apple 要求在 App Store Connect 中提供隱私政策的公開 URL：

- `https://to-do-mvp.vercel.app/privacy`
- `https://to-do-mvp.vercel.app/terms`

**已完成 ✅**: App 已配置 URL routing，可以直接訪問這些頁面

---

## ✅ 4. 應用程式功能完整性

| 項目           | 狀態 | 詳細資訊                 |
| -------------- | ---- | ------------------------ |
| **Google SSO** | ✅   | 已實現並測試             |
| **任務管理**   | ✅   | 新增、編輯、刪除功能完整 |
| **日曆整合**   | ✅   | Calendar 頁面已實現      |
| **多語系支援** | ✅   | 英文、繁體中文           |
| **深色模式**   | ✅   | 已實現主題切換           |
| **通知功能**   | ⚠️   | 已配置但需測試           |

---

## ✅ 5. 授權和憑證

| 項目                             | 狀態 | 詳細資訊                           |
| -------------------------------- | ---- | ---------------------------------- |
| **Apple Developer Account**      | ❓   | 需確認是否已註冊                   |
| **iOS Distribution Certificate** | ❓   | 需要創建                           |
| **App ID**                       | ❓   | 需要在 Apple Developer Portal 創建 |
| **Provisioning Profile**         | ❓   | 需要創建 Production profile        |

---

## ✅ 6. Google OAuth 配置

| 項目                      | 狀態 | 詳細資訊                           |
| ------------------------- | ---- | ---------------------------------- |
| **GCP 專案**              | ✅   | Too Doo List - Task Management App |
| **OAuth Client ID (Web)** | ✅   | 已創建                             |
| **OAuth Client ID (iOS)** | ⚠️   | 需要創建 iOS 類型的 Client ID      |
| **Redirect URI**          | ✅   | Supabase callback URL 已配置       |

### 🔧 需要創建 iOS OAuth Client ID：

1. 前往 Google Cloud Console
2. 創建新的 OAuth 2.0 Client ID
3. 類型選擇：**iOS**
4. Bundle ID: `com.cty0305.too.doo.list`
5. 獲取 iOS Client ID 並配置到 app

---

## ✅ 7. Supabase 配置

| 項目                | 狀態 | 詳細資訊                                 |
| ------------------- | ---- | ---------------------------------------- |
| **專案 URL**        | ✅   | https://qerosiozltqrbehctxdn.supabase.co |
| **Anon Key**        | ✅   | 已配置                                   |
| **Google Provider** | ✅   | 已啟用                                   |
| **Redirect URLs**   | ⚠️   | 需要添加 iOS deep link                   |

### 🔧 需要添加的 Redirect URLs：

```
too-doo-list://auth/callback
com.cty0305.too.doo.list://auth/callback
```

---

## ✅ 8. Deep Linking 配置

| 項目                   | 狀態 | 詳細資訊                      |
| ---------------------- | ---- | ----------------------------- |
| **URL Scheme**         | ✅   | too-doo-list://               |
| **Bundle URL Scheme**  | ✅   | com.cty0305.too.doo.list://   |
| **Associated Domains** | ✅   | applinks:to-do-mvp.vercel.app |

### 🔧 需要修復：

在 `app.config.js` 中更新：

```javascript
associatedDomains: ["applinks:to-do-mvp.vercel.app"];
```

---

## ✅ 9. App Store 所需資產

| 項目                     | 狀態 | 詳細資訊                  |
| ------------------------ | ---- | ------------------------- |
| **App Icon (1024x1024)** | ⚠️   | 需要創建                  |
| **截圖 (6.5" iPhone)**   | ❌   | 需要準備                  |
| **截圖 (5.5" iPhone)**   | ❌   | 需要準備                  |
| **iPad 截圖**            | ❌   | 需要準備（如果支援 iPad） |
| **App Preview 影片**     | ❌   | 可選                      |

### 📱 所需截圖尺寸：

- **6.5" Display (iPhone 14 Pro Max)**: 1290 x 2796 (至少 3 張，最多 10 張)
- **5.5" Display (iPhone 8 Plus)**: 1242 x 2208 (至少 3 張，最多 10 張)
- **iPad Pro (12.9")**: 2048 x 2732 (如果支援 iPad)

---

## ✅ 10. App Store 資訊

| 項目             | 狀態 | 內容建議                                |
| ---------------- | ---- | --------------------------------------- |
| **應用程式名稱** | ✅   | To Do                                   |
| **副標題**       | ❌   | 建議："Simple & Intuitive Task Manager" |
| **描述**         | ⚠️   | 需要準備                                |
| **關鍵字**       | ❌   | 需要準備                                |
| **促銷文字**     | ❌   | 需要準備                                |
| **支援 URL**     | ❌   | 建議使用 GitHub Issues 或 Email         |
| **行銷 URL**     | ❌   | 可選                                    |

### 📝 描述範例（繁體中文）：

```
To Do - 簡單直觀的任務管理應用程式

讓生活更有條理，輕鬆管理您的日常任務！

主要功能：
✓ 快速新增和管理任務
✓ 日期和時間管理
✓ 日曆整合視圖
✓ 備註欄位支援
✓ Google 帳號快速登入
✓ 深色模式支援
✓ 繁體中文和英文介面
✓ 雲端同步，多裝置存取

特色：
• 簡潔優雅的設計
• 流暢的使用體驗
• 無廣告干擾
• 保護您的隱私

立即下載，開始更有效率的生活！
```

### 📝 關鍵字建議：

```
任務管理,待辦事項,行事曆,生產力,GTD,時間管理,日程規劃,清單,目標追蹤,效率工具
```

---

## ✅ 11. 應用程式審核資訊

| 項目         | 狀態 | 詳細資訊                     |
| ------------ | ---- | ---------------------------- |
| **聯絡資訊** | ❌   | 需要提供審核聯絡人           |
| **示範帳號** | ⚠️   | 建議提供 Google 測試帳號     |
| **審核備註** | ❌   | 需要說明 Google SSO 測試方式 |

### 📝 審核備註範例：

```
感謝審核我們的應用程式！

關於 Google 登入：
- 應用程式使用 Google OAuth 進行身份驗證
- 請使用提供的測試帳號進行登入測試
- 或者可以使用任何有效的 Google 帳號

主要測試流程：
1. 點擊 "Sign in with Google" 按鈕
2. 選擇 Google 帳號並完成驗證
3. 成功登入後可以新增、編輯、刪除任務
4. 可以在日曆視圖中查看任務
5. 可以在設定中切換語言和主題

如有任何問題，請隨時聯繫我們。
```

---

## ✅ 12. 隱私和數據使用

| 項目             | 狀態 | 詳細資訊                             |
| ---------------- | ---- | ------------------------------------ |
| **隱私政策 URL** | ✅   | https://to-do-mvp.vercel.app/privacy |
| **數據收集聲明** | ❌   | 需要填寫 Apple 隱私問卷              |
| **第三方 SDK**   | ⚠️   | Google OAuth, Supabase, Expo         |
| **數據加密**     | ✅   | Supabase 使用 HTTPS                  |

### 📋 Apple 隱私問卷需要說明：

- ✅ **收集的數據類型**：
  - 姓名 (從 Google 帳號獲取)
  - Email (從 Google 帳號獲取)
  - 使用者 ID
  - 任務內容
  - 使用偏好設定 (語言、主題)
- ✅ **數據用途**：
  - 身份驗證
  - App 功能
  - 產品個性化
- ✅ **數據是否與使用者關聯**：是
- ✅ **數據是否用於追蹤**：否

---

## ✅ 13. 技術要求

| 項目                       | 狀態 | 詳細資訊              |
| -------------------------- | ---- | --------------------- |
| **不使用已棄用的 API**     | ✅   | 使用最新 Expo SDK 54  |
| **64-bit 支援**            | ✅   | React Native 預設支援 |
| **IPv6 相容性**            | ✅   | Expo 預設支援         |
| **App Transport Security** | ✅   | 所有連線使用 HTTPS    |
| **不使用私有 API**         | ✅   | 僅使用公開 API        |

---

## ✅ 14. EAS Build 配置

| 項目                 | 狀態 | 詳細資訊             |
| -------------------- | ---- | -------------------- |
| **eas.json**         | ✅   | 已配置               |
| **Production Build** | ❌   | 需要執行             |
| **Build Version**    | ⚠️   | 需要設定 buildNumber |

### 🔧 需要更新 `eas.json`：

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildNumber": "1"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://qerosiozltqrbehctxdn.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "..."
      }
    }
  }
}
```

---

## 🚀 上架前必須完成的任務

### ⚠️ 高優先級（必須完成）

1. **修復 App Icon**

   - [ ] 調整為 1024x1024 正方形
   - [ ] 確認沒有透明背景
   - [ ] 確認沒有 alpha channel

2. **配置 Associated Domains**

   - [ ] 更新 `app.config.js` 中的 `associatedDomains`
   - [ ] 在 Apple Developer Portal 設定 Universal Links

3. **創建 iOS OAuth Client ID**

   - [ ] 在 GCP 創建 iOS 類型的 Client ID
   - [ ] 配置 Bundle ID

4. **更新 Supabase Redirect URLs**

   - [ ] 添加 `too-doo-list://auth/callback`
   - [ ] 添加 `com.cty0305.too.doo.list://auth/callback`

5. **準備 App Store 資產**

   - [ ] 截圖 (6.5" Display) x 3-10 張
   - [ ] 截圖 (5.5" Display) x 3-10 張
   - [ ] App Icon 1024x1024

6. **準備 App Store 資訊**

   - [ ] 應用程式描述（中英文）
   - [ ] 關鍵字
   - [ ] 支援 URL
   - [ ] 隱私政策 URL

7. **填寫隱私問卷**

   - [ ] 在 App Store Connect 填寫完整的隱私數據使用說明

8. **執行 Production Build**
   - [ ] `eas build --platform ios --profile production`
   - [ ] 測試 Production build

### ✅ 中優先級（建議完成）

1. **設定最低 iOS 版本**

   - [ ] 在 `app.config.js` 添加 `deploymentTarget`

2. **準備審核資訊**

   - [ ] 提供測試帳號（Google 帳號）
   - [ ] 撰寫審核備註

3. **文檔完善**
   - [ ] 更新 README.md
   - [ ] 確保隱私政策和使用條款內容完整

### 📝 低優先級（可選）

1. **App Preview 影片**

   - [ ] 錄製應用程式演示影片

2. **iPad 支援**
   - [ ] 測試 iPad 版本
   - [ ] 準備 iPad 截圖

---

## 📋 提交流程

### 步驟 1: 完成上述所有高優先級任務

### 步驟 2: 執行 Production Build

```bash
eas build --platform ios --profile production
```

### 步驟 3: 在 App Store Connect 創建應用程式

1. 登入 [App Store Connect](https://appstoreconnect.apple.com)
2. 點擊 "My Apps" → "+" → "New App"
3. 填寫基本資訊
4. 選擇 Bundle ID: `com.cty0305.too.doo.list`

### 步驟 4: 上傳 Build

```bash
eas submit --platform ios --profile production
```

### 步驟 5: 填寫 App Store 資訊

- 上傳截圖
- 填寫描述和關鍵字
- 設定價格（免費）
- 填寫隱私問卷

### 步驟 6: 提交審核

- 檢查所有資訊
- 點擊 "Submit for Review"

---

## ⏱️ 預估時間

| 任務                        | 預估時間      |
| --------------------------- | ------------- |
| 修復 App Icon               | 30 分鐘       |
| 配置 OAuth 和 Deep Linking  | 1-2 小時      |
| 準備截圖和資產              | 2-3 小時      |
| 填寫 App Store 資訊         | 1-2 小時      |
| 執行和測試 Production Build | 1-2 小時      |
| 提交審核                    | 30 分鐘       |
| **總計**                    | **6-10 小時** |

審核時間：通常 24-48 小時

---

## ✅ 最終檢查清單

在提交審核前，請確認：

- [ ] App Icon 正確且符合規範
- [ ] 所有功能都正常運作
- [ ] Google SSO 登入流程順暢
- [ ] 沒有 crash 或嚴重 bug
- [ ] 隱私政策和使用條款可以訪問
- [ ] 截圖和資產已上傳
- [ ] App Store 資訊完整
- [ ] 隱私問卷已填寫
- [ ] 審核備註清楚說明測試方式
- [ ] Production Build 已測試
- [ ] 所有 URL 和 Redirect URI 已正確配置

---

## 🎯 結論

**目前狀態**: ⚠️ **接近完成，但還需要完成一些關鍵任務**

**核心功能**: ✅ 完整且運作正常
**配置問題**: ⚠️ 需要修復 App Icon、Associated Domains、iOS OAuth
**資產準備**: ❌ 需要準備截圖和完整的 App Store 資訊

**建議**: 完成上述「高優先級」任務後，即可提交審核。預計需要 6-10 小時的額外工作時間。

---

**最後更新**: 2025-10-16
**檢查者**: AI Assistant
**版本**: 1.6.0
