# 表格結構確認

## 📊 涉及的表格

### 1. `public.user_settings` (你的用戶設定表格)

- **用途**: 儲存用戶的個人化設定
- **現有欄位**: `id`, `user_id`, `language`, `theme`, `notifications_enabled`, `created_at`, `updated_at`
- **新增欄位**: `display_name`, `platform`, `user_agent`, `last_active_at`

### 2. `auth.users` (Supabase 認證用戶表格)

- **用途**: Supabase 內建的認證用戶資料
- **包含**: 用戶 ID、email、Google OAuth 資料等
- **注意**: 這是 Supabase 的系統表格，我們只能讀取，不能修改

### 3. 查詢方式 (直接 JOIN)

- **用途**: 直接使用 JOIN 查詢結合 `user_settings` 和 `auth.users` 的資料
- **好處**: 無需額外視圖，直接查詢現有表格

## 🔗 關聯關係

```
auth.users (id) ←→ public.user_settings (user_id)
```

- `user_settings.user_id` 外鍵關聯到 `auth.users.id`
- 當用戶刪除時，相關的設定也會被刪除 (CASCADE)

## ✅ 確認事項

- ✅ 表格名稱正確：`public.user_settings` 和 `auth.users`
- ✅ 外鍵關聯正確：`user_id` 關聯到 `auth.users.id`
- ✅ 查詢方式簡化：直接使用 JOIN 查詢
- ✅ RLS 政策正確：用戶只能存取自己的資料

## 🚀 下一步

1. 執行 `supabase_migration_add_display_name_platform.sql`
2. 執行 `test_user_settings_structure.sql` 驗證結構
3. 測試用戶登入和資料更新
