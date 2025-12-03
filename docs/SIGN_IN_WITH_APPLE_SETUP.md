# Sign in with Apple 設定指南

## ✅ 已完成項目

1. ✅ 已安裝 `expo-apple-authentication` 套件
2. ✅ 已在 `app.config.js` 中添加 `expo-apple-authentication` plugin
3. ✅ 已實作 `handleAppleSignIn` 函數
4. ✅ 已在登入畫面新增 Sign in with Apple 按鈕（僅 iOS 顯示）

## 📋 需要在 Supabase Dashboard 中配置

### 步驟 1: 啟用 Apple Provider

1. 前往 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇你的專案（Production）
3. 前往 **Authentication** > **Providers**
4. 找到 **Apple** 並點擊啟用

### 步驟 2: 配置 Client IDs

在 Apple Provider 設定中，添加以下 Bundle ID 到 **Client IDs** 欄位：

```
com.cty0305.too.doo.list
```

**重要：** 對於原生 iOS 應用，**不需要**配置 OAuth 設定（Services ID、Team ID、Secret Key）。只需要添加 Bundle IDs 到 Client IDs 列表即可。

### 步驟 3: 驗證設定

- ✅ **OAuth flow**: 不需要配置（僅用於 Web）
- ✅ **Client IDs**: 需要添加所有 Bundle IDs
- ✅ **Skip Nonce Check**: 可選（如果遇到 nonce 驗證問題可啟用）

## 📝 Apple Developer Console 設定

### 步驟 1: 確保 App ID 已啟用 Sign in with Apple

1. 前往 https://developer.apple.com/account/resources/identifiers/list/bundleId
2. 選擇你的 App ID（例如：`com.cty0305.too.doo.list`）
3. 確保 **Sign in with Apple** capability 已啟用

### 步驟 2: 檢查 Xcode 設定

在 Xcode 中：
1. 打開 `ios/ToDo.xcodeproj`
2. 選擇 Target > Signing & Capabilities
3. 確認 **Sign in with Apple** capability 已添加

## 🧪 測試

### 測試環境要求

⚠️ **重要：** Sign in with Apple 在 iOS 模擬器上**無法正常運作**，必須在**實體設備**上測試。

### 測試步驟

1. 運行 `npx expo prebuild` 重新生成原生代碼
2. 運行 `npx expo run:ios --device` 在實體設備上測試
3. 點擊 "Sign in with Apple" 按鈕
4. 完成 Apple 登入流程
5. 驗證用戶成功登入

## 🔍 故障排除

### 問題 1: "Sign in with Apple is not available on this device"

- **原因**: 設備不支援或未登入 Apple ID
- **解決**: 確保設備已登入 Apple ID，並且在 iOS 13.0+ 上運行

### 問題 2: Supabase 登入失敗

- **檢查**: Bundle ID 是否已添加到 Supabase Dashboard 的 Client IDs 列表
- **檢查**: App ID 是否已啟用 Sign in with Apple capability
- **檢查**: Xcode 中是否已添加 Sign in with Apple capability

### 問題 3: 在模擬器上無法測試

- **解決**: 這是正常現象，Apple Authentication 必須在實體設備上測試

## 📚 參考資料

- [Supabase Sign in with Apple 文檔](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Expo Apple Authentication 文檔](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

