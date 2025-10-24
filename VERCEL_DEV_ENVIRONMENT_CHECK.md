# Vercel Dev 環境變數檢查清單

## 你的 Vercel Dev 專案應該有以下環境變數：

### 必要環境變數

```
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL_DEV=https://ajbusqpjsjcuzzxuueij.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=你的_dev_anon_key
```

### 可選環境變數

```
EXPO_PUBLIC_API_BASE_URL_DEV=https://dev-api.yourdomain.com
```

## 檢查步驟：

1. **登入 Vercel Dashboard**

   - 前往 https://vercel.com/dashboard
   - 找到 `to-do-dev` 專案

2. **檢查環境變數**

   - 點擊專案 → Settings → Environment Variables
   - 確認是否有上述環境變數
   - 檢查變數名稱是否完全正確（大小寫敏感）

3. **檢查專案設定**

   - 確認 Production Branch 是 `develop`
   - 確認 Build Command 是 `npm run build`
   - 確認 Output Directory 是 `dist`

4. **重新部署**
   - 如果環境變數有修改，需要重新部署
   - 可以手動觸發部署或推送新的 commit

## 常見問題：

1. **環境變數名稱錯誤**

   - 應該是 `EXPO_PUBLIC_APP_ENV` 不是 `EXPO_PUBLIC_APP_ENVIRONMENT`
   - 應該是 `EXPO_PUBLIC_SUPABASE_URL_DEV` 不是 `EXPO_PUBLIC_SUPABASE_URL_DEVELOPMENT`

2. **環境變數值錯誤**

   - `EXPO_PUBLIC_APP_ENV` 應該是 `development`（小寫）
   - Supabase URL 和 Key 必須是 dev 專案的

3. **專案連接到錯誤分支**
   - 確認 Production Branch 是 `develop` 不是 `main`

## 調試步驟：

1. **檢查 console 輸出**

   - 打開 https://to-do-dev-alan.vercel.app
   - 按 F12 打開開發者工具
   - 查看 Console 標籤
   - 應該看到以 `🔍 APP DEBUG` 開頭的調試資訊

2. **如果沒有看到調試資訊**

   - 環境變數沒有正確設定
   - 專案可能連接到錯誤的分支
   - 需要重新部署

3. **如果看到調試資訊但 SSO 還是跳轉到 staging**
   - 檢查 Supabase URL 是否正確
   - 檢查 Supabase 專案的 redirect URL 設定
