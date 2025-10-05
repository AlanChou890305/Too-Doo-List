# Google OAuth 設定指南

## 🚀 創建 GCP 專案

### 1. 專案資訊

- **專案名稱**: Too Doo List - Task Management App
- **專案 ID**: too-doo-list-app
- **描述**: A modern task management application with Google SSO integration

### 2. 創建步驟

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 點擊專案選擇器 > "新建專案"
3. 填入專案資訊並創建

## 🔧 啟用必要 API

### 需要啟用的 API：

1. **Google+ API**

   - 路徑: APIs & Services > Library
   - 搜尋: "Google+ API"
   - 點擊啟用

2. **Google Identity API** (可選，但建議啟用)
   - 路徑: APIs & Services > Library
   - 搜尋: "Google Identity"
   - 點擊啟用

## 🔑 創建 OAuth 2.0 憑證

### 1. 前往憑證頁面

- 路徑: APIs & Services > Credentials
- 點擊 "+ CREATE CREDENTIALS" > "OAuth 2.0 Client ID"

### 2. 設定應用程式類型

- 選擇: **Web application**
- 名稱: `Too Doo List Web Client`

### 3. 設定重定向 URI

```
授權的重定向 URI:
- https://wswsuxoaxbrjxuvvsojo.supabase.co/auth/v1/callback
- http://localhost:8081/auth/callback (開發用)
```

### 4. 設定 JavaScript 來源 (可選)

```
授權的 JavaScript 來源:
- http://localhost:8081
- https://your-domain.com (生產環境)
```

## 📝 獲取憑證資訊

創建完成後，你會得到：

- **Client ID**: `249629959425-xxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxx`

## 🔗 在 Supabase 中設定

### 1. 前往 Supabase Dashboard

- 訪問: https://supabase.com/dashboard
- 選擇專案: `wswsuxoaxbrjxuvvsojo`

### 2. 設定 Google Provider

- 路徑: Authentication > Providers
- 找到 Google 並點擊 "Enable"
- 填入憑證資訊:
  - **Client ID**: (從 GCP 複製)
  - **Client Secret**: (從 GCP 複製)

### 3. 設定重定向 URL

在 Supabase 的 Site URL 和 Redirect URLs 中添加：

```
too-doo-list://auth/callback
http://localhost:8081/auth/callback
```

## ✅ 測試設定

### 1. 啟動應用程式

```bash
npx expo start --web
```

### 2. 測試登入

1. 打開 http://localhost:8081
2. 點擊 "Sign in with Google"
3. 檢查瀏覽器控制台是否有錯誤
4. 確認重定向是否正常工作

## 🐛 常見問題

### 問題 1: "redirect_uri_mismatch"

**解決方案**: 檢查 Supabase 和 GCP 中的重定向 URI 是否一致

### 問題 2: "invalid_client"

**解決方案**: 檢查 Client ID 和 Client Secret 是否正確複製

### 問題 3: "access_denied"

**解決方案**: 檢查 Google+ API 是否已啟用

## 📞 需要幫助？

如果遇到問題，請檢查：

1. GCP 專案是否已創建
2. 必要的 API 是否已啟用
3. OAuth 憑證是否已創建
4. Supabase 中的設定是否正確



