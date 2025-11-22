# Supabase Edge Functions 部署指南

## 步驟 1: 登入 Supabase CLI

```bash
npx supabase login
```

這會開啟瀏覽器讓您授權。

---

## 步驟 2: 連結本地專案到 Supabase

```bash
npx supabase link --project-ref ajbusqpjsjcuzzxuueij
```

系統會要求您輸入資料庫密碼（您在建立專案時設定的密碼）。

---

## 步驟 3: 設定 Resend API Key (Secret)

```bash
npx supabase secrets set RESEND_API_KEY=re_XfFVsnNG_FsrnFjy1pf2KzSNLRxQU6rZF
```

---

## 步驟 4: 部署 Edge Functions

```bash
npx supabase functions deploy send-update-email --no-verify-jwt
npx supabase functions deploy unsubscribe --no-verify-jwt
```

---

## 步驟 5: 測試發送

建立一個 `.env` 檔案在專案根目錄：

```env
SUPABASE_URL=https://ajbusqpjsjcuzzxuueij.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<您的 Service Role Key>
```

然後執行測試：

```bash
node scripts/send-email.js --template=update-v1.1.1 --subject="ToDo 1.1.1 更新通知" --test=your@email.com
```

---

## 取得 Service Role Key

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/ajbusqpjsjcuzzxuueij/settings/api)
2. 複製 `service_role` (secret) 的值
3. 貼到 `.env` 檔案中

---

## 注意事項

- `--no-verify-jwt` 表示這個 Function 不需要用戶登入就能呼叫（因為我們用 Service Role Key 驗證）
- Service Role Key 是敏感資訊，絕對不要 commit 到 Git！
