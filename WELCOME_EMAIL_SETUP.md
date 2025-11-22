# 歡迎郵件自動化設定指南

## ✅ 已完成

- Edge Function `send-welcome-email` 已成功部署
- 歡迎郵件模板已嵌入 Function 中

## 🔧 最後一步：設定 Auth Hook

請依照以下步驟在 Supabase Dashboard 中設定 Auth Hook：

### 步驟 1: 前往 Auth Hooks 頁面

開啟此連結：
https://supabase.com/dashboard/project/ajbusqpjsjcuzzxuueij/auth/hooks

### 步驟 2: 啟用 Hook

1. 找到 **"Send Email"** 區塊
2. 點擊 **"Enable Hook"** 或 **"Add a new hook"**

### 步驟 3: 設定 Hook

填入以下資訊：

- **Hook name**: `send-welcome-email`
- **Type**: `HTTP Request`
- **Method**: `POST`
- **URL**: `https://ajbusqpjsjcuzzxuueij.supabase.co/functions/v1/send-welcome-email`
- **Trigger**: 選擇 **"User signed up"** 或 **"auth.users.created"**

### 步驟 4: 儲存設定

點擊 **"Save"** 或 **"Create"**

---

## 🧪 測試

設定完成後，您可以：

1. 在您的 App 中建立一個新的測試帳號
2. 檢查該帳號的信箱，應該會收到歡迎郵件

---

## 📝 注意事項

- 歡迎郵件會在用戶**註冊成功後**自動發送
- 如果用戶已經取消訂閱，仍會收到歡迎郵件（這是正常的，因為這是第一封信）
- 您可以在 [Resend Dashboard](https://resend.com/emails) 查看發送紀錄
- 您可以在 [Supabase Functions Logs](https://supabase.com/dashboard/project/ajbusqpjsjcuzzxuueij/logs/edge-functions) 查看執行紀錄
