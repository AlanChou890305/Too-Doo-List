# Vercel 部署設定指南

## 🔧 Framework 設定

在 Vercel Dashboard 中設定：

- **Framework Preset**: `Other`
- **Build Command**: `npx expo export --platform web --output-dir dist`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🌍 環境變數設定

在 Vercel Dashboard → Settings → Environment Variables 中新增：

### 1. Supabase URL

- **Name**: `EXPO_PUBLIC_SUPABASE_URL`
- **Value**: `https://your-project.supabase.co`
- **Environment**: `Production`, `Preview`, `Development`

### 2. Supabase Anon Key

- **Name**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `your-supabase-anon-key`
- **Environment**: `Production`, `Preview`, `Development`

## 📝 設定步驟

1. **連接 GitHub Repository**

   - 在 Vercel Dashboard 點擊 "New Project"
   - 選擇您的 GitHub repository
   - 點擊 "Import"

2. **設定 Build 配置**

   - Framework Preset: `Other`
   - Build Command: `npx expo export --platform web --output-dir dist`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **新增環境變數**

   - 進入 Settings → Environment Variables
   - 新增上述兩個環境變數
   - 確保所有環境都勾選 (Production, Preview, Development)

4. **部署**
   - 點擊 "Deploy"
   - 等待建置完成

## 🔗 更新 Google Cloud Console

部署完成後，需要更新 Google Cloud Console 的授權重定向 URI：

### 新的 Redirect URI

- **Web 應用程式**: `https://your-vercel-domain.vercel.app/auth/callback`
- **iOS 應用程式**: `https://your-vercel-domain.vercel.app/auth/callback`

### 更新步驟

1. 進入 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 導航到 "APIs & Services" → "Credentials"
4. 編輯您的 OAuth 2.0 Client ID
5. 更新 "Authorized redirect URIs" 為新的 Vercel URL
6. 儲存變更

## 📱 更新 Supabase 設定

在 Supabase Dashboard 中更新 Site URL：

1. 進入 Supabase Dashboard
2. 選擇您的專案
3. 導航到 "Authentication" → "URL Configuration"
4. 更新 "Site URL" 為: `https://your-vercel-domain.vercel.app`
5. 更新 "Redirect URLs" 為: `https://your-vercel-domain.vercel.app/auth/callback`

## 🚀 測試部署

部署完成後測試：

1. 訪問 `https://your-vercel-domain.vercel.app`
2. 測試 Web 版本的 Google SSO
3. 測試 TestFlight 版本的 Google SSO
4. 確認都能正確回到應用程式

## 📞 支援

如果遇到問題：

- 檢查 Vercel 的 Function Logs
- 確認環境變數是否正確設定
- 驗證 Google Cloud Console 的 redirect URI
- 檢查 Supabase 的 URL 設定
