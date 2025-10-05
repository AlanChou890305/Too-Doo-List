# Supabase 專案設定指南

## 🚀 創建新的 Supabase 專案

### 步驟 1: 前往 Supabase Dashboard

1. 訪問 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登入你的帳號
3. 點擊 **"New Project"**

### 步驟 2: 設定專案資訊

```
Project Name: Too Doo List
Database Password: [設定一個強密碼，至少 12 個字符]
Region: [選擇離你最近的區域，如 Asia Pacific (Singapore)]
```

### 步驟 3: 等待專案創建

- 專案創建需要 2-3 分鐘
- 創建完成後，你會看到專案儀表板

### 步驟 4: 獲取專案憑證

創建完成後，前往 **Settings** > **API**：

- **Project URL**: `https://xxxxx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 步驟 5: 更新環境變數

將新的憑證更新到 `.env` 文件中：

```
EXPO_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
```

## 🔧 設定 Google OAuth

### 步驟 6: 啟用 Google Provider

1. 在 Supabase Dashboard 中，前往 **Authentication** > **Providers**
2. 找到 **Google** 並點擊 **"Enable"**
3. 填入從 GCP 獲取的憑證：
   - **Client ID**: [從 GCP 複製]
   - **Client Secret**: [從 GCP 複製]

### 步驟 7: 設定重定向 URL

在 **Site URL** 和 **Redirect URLs** 中添加：

```
Site URL: http://localhost:8082
Redirect URLs:
- too-doo-list://auth/callback
- http://localhost:8082/auth/callback
```

## 🧪 測試設定

### 步驟 8: 更新應用程式

1. 更新 `.env` 文件中的 Supabase 憑證
2. 重新啟動應用程式：
   ```bash
   npx expo start --web --port 8082
   ```

### 步驟 9: 測試 Google SSO

1. 訪問 `http://localhost:8082`
2. 點擊 "Sign in with Google"
3. 檢查登入流程是否正常

## 📋 檢查清單

- [ ] 創建新的 Supabase 專案
- [ ] 獲取新的專案憑證
- [ ] 更新 `.env` 文件
- [ ] 在 Supabase 中啟用 Google Provider
- [ ] 設定重定向 URL
- [ ] 測試 Google SSO 功能



