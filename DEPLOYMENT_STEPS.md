# 🚀 Vercel 部署完整步驟

## 第一步：準備檔案

✅ **已完成**：

- `vercel.json` - Vercel 配置檔案
- `VERCEL_SETUP.md` - 詳細設定指南
- `src/config/urls.js` - URL 配置檔案
- 更新 `App.js` 中的 redirect URL 邏輯
- 備份 `netlify.toml` 為 `netlify.toml.backup`

## 第二步：提交到 GitHub

```bash
# 提交所有變更
git add .
git commit -m "[feat] 遷移到 Vercel 託管 (v1.2.5)

- 新增 vercel.json 配置檔案
- 更新 redirect URL 邏輯支援 Vercel
- 創建 URL 配置檔案
- 備份 Netlify 配置檔案
- 新增 Vercel 部署指南"

git push origin main
```

## 第三步：在 Vercel 部署

### 3.1 註冊並連接 GitHub

1. 前往 [vercel.com](https://vercel.com)
2. 使用 GitHub 帳號註冊/登入
3. 點擊 "New Project"
4. 選擇您的 `Too-Doo-List` repository
5. 點擊 "Import"

### 3.2 設定專案配置

在 Vercel Dashboard 中設定：

**Framework Preset**: `Other`
**Build Command**: `npx expo export --platform web --output-dir dist`
**Output Directory**: `dist`
**Install Command**: `npm install`

### 3.3 設定環境變數

進入 Settings → Environment Variables，新增：

| Name                            | Value                              | Environment                      |
| ------------------------------- | ---------------------------------- | -------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | `https://your-project.supabase.co` | Production, Preview, Development |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `your-supabase-anon-key`           | Production, Preview, Development |

### 3.4 部署

1. 點擊 "Deploy"
2. 等待建置完成（約 2-5 分鐘）
3. 記錄您的 Vercel 域名（例如：`your-app.vercel.app`）

## 第四步：更新 App.js 中的域名

部署完成後，您會得到一個 Vercel 域名，需要更新 App.js：

```bash
# 使用 sed 命令替換域名（將 YOUR_VERCEL_DOMAIN 替換為實際域名）
sed -i '' 's/your-vercel-domain\.vercel\.app/YOUR_ACTUAL_VERCEL_DOMAIN/g' App.js
```

或者手動編輯 App.js，將兩處 `your-vercel-domain.vercel.app` 替換為實際的 Vercel 域名。

## 第五步：更新第三方服務配置

### 5.1 Google Cloud Console

1. 進入 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 導航到 "APIs & Services" → "Credentials"
4. 編輯您的 OAuth 2.0 Client ID
5. 更新 "Authorized redirect URIs"：
   - 新增：`https://YOUR_VERCEL_DOMAIN.vercel.app/auth/callback`
   - 保留舊的 Netlify URL 作為備用（可選）

### 5.2 Supabase Dashboard

1. 進入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 導航到 "Authentication" → "URL Configuration"
4. 更新設定：
   - **Site URL**: `https://YOUR_VERCEL_DOMAIN.vercel.app`
   - **Redirect URLs**: `https://YOUR_VERCEL_DOMAIN.vercel.app/auth/callback`

## 第六步：測試部署

### 6.1 Web 版本測試

1. 訪問 `https://YOUR_VERCEL_DOMAIN.vercel.app`
2. 點擊 "Google Sign In"
3. 完成登入流程
4. 確認成功進入主頁面

### 6.2 TestFlight 版本測試

1. 在 TestFlight 中開啟 app
2. 點擊 "Google Sign In"
3. 完成登入流程
4. 確認成功回到 app（不在 browser 中）

## 第七步：提交最終版本

測試成功後，提交域名更新：

```bash
git add App.js
git commit -m "[fix] 更新 Vercel 域名配置 (v1.2.6)"
git push origin main
```

## 🔧 故障排除

### 如果部署失敗：

1. 檢查 Vercel 的 Function Logs
2. 確認環境變數是否正確設定
3. 檢查 `vercel.json` 語法是否正確

### 如果 SSO 不工作：

1. 確認 Google Cloud Console 的 redirect URI 已更新
2. 確認 Supabase 的 URL 設定已更新
3. 檢查 `public/auth/callback.html` 是否正確部署

### 如果需要回滾到 Netlify：

1. 重新命名 `netlify.toml.backup` 為 `netlify.toml`
2. 更新 App.js 中的 redirect URL 回到 Netlify
3. 重新部署到 Netlify

## 📞 支援

如果遇到問題：

- 檢查 Vercel 的 Build Logs
- 檢查瀏覽器的 Network Tab
- 檢查 TestFlight 的 Console Logs
- 參考 `VERCEL_SETUP.md` 的詳細設定
