# 部署 Delete User Edge Function

## 問題說明

**目前狀態**：❌ 舊的實作只刪除用戶數據（tasks, settings, profile），但**不會刪除 Supabase Auth 帳號本身**。用戶仍然可以重新登入。

**修復後**：✅ 新的實作會完整刪除：

1. 所有用戶數據（tasks, settings, profile）
2. **Supabase Auth 帳號本身**（無法再登入）

---

## 部署步驟

### 1. 安裝 Supabase CLI

```bash
npm install -g supabase
```

### 2. 登入 Supabase

```bash
supabase login
```

### 3. 連結專案

**Staging 環境：**

```bash
supabase link --project-ref qerosiozltqrbehctxdn
```

**Production 環境：**

```bash
supabase link --project-ref ajbusqpjsjcuzzxuueij
```

### 4. 部署 Edge Function

```bash
supabase functions deploy delete-user
```

### 5. 設置環境變數

在 Supabase Dashboard → Edge Functions → delete-user → Settings 中設置：

- `SUPABASE_URL`：自動提供
- `SUPABASE_ANON_KEY`：自動提供
- `SUPABASE_SERVICE_ROLE_KEY`：從 Settings → API 複製 **service_role** key

---

## 測試

部署完成後，在 Expo Go 或 Web 測試：

1. 登入帳號
2. 進入 Settings
3. 點擊 "Delete Account"
4. 確認刪除
5. 驗證：
   - ✅ 自動登出
   - ✅ 回到 Splash 頁面
   - ✅ 嘗試重新登入（應該可以登入，但數據為空）
   - ✅ 在 Supabase Dashboard → Authentication → Users 確認用戶已被刪除

---

## 兩個環境都需要部署

記得在 **Staging** 和 **Production** 環境都部署：

```bash
# Staging
supabase link --project-ref qerosiozltqrbehctxdn
supabase functions deploy delete-user

# Production
supabase link --project-ref ajbusqpjsjcuzzxuueij
supabase functions deploy delete-user
```

---

## 故障排除

如果遇到錯誤：

1. **檢查 Edge Function 日誌**：
   Supabase Dashboard → Edge Functions → delete-user → Logs

2. **檢查 Service Role Key**：
   確保在 Edge Function 環境變數中正確設置

3. **檢查權限**：
   確保 Supabase 專案有權限刪除 Auth 用戶

---

## 重要提示

⚠️ **在部署 Edge Function 之前，刪除帳號功能不會真正刪除 Auth 帳號！**

部署後，功能才會完整生效並符合 Apple 的 Guideline 5.1.1(v) 要求。
