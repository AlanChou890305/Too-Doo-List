# Supabase Apple Provider 設定值

## 📋 正式站 (Production)

**Supabase Project ID:** `ajbusqpjsjcuzzxuueij`

### Apple Provider 設定值

#### Enable Sign in with Apple

- ✅ **啟用** (勾選)

#### Client IDs

```
com.cty0305.too.doo.list
```

**說明:** 正式站支援的 Bundle ID

- `com.cty0305.too.doo.list` (Production 版本)

#### Secret Key (for OAuth)

```
留空
```

**說明:**

- 如果**只使用原生 iOS 應用**，不需要填寫 Secret Key
- 如果需要支援 **Web OAuth**，需要生成 Apple OAuth Secret Key（每 6 個月需要重新生成）

#### Allow users without an email

- ✅ **啟用** (建議勾選)

**說明:** 允許 Apple 不返回 email 時仍能完成登入

#### Callback URL (for OAuth)

```
https://ajbusqpjsjcuzzxuueij.supabase.co/auth/v1/callback
```

**說明:** 這是 Supabase 自動生成的 callback URL，需要在 Apple Developer Console 的 Services ID 中註冊（如果使用 Web OAuth）

---

## 🔑 重要說明

### 關於 Secret Key

如果你**只使用原生 iOS 應用**：

- ✅ **不需要**填寫 Secret Key
- ✅ **只需要**在 Client IDs 中添加 Bundle IDs
- ✅ OAuth 設定可以留空

如果你需要**同時支援 Web 登入**：

- ⚠️ **需要**生成 Apple OAuth Secret Key
- ⚠️ **需要**在 Apple Developer Console 設定 Services ID
- ⚠️ Secret Key 每 6 個月會過期，需要重新生成

### 關於 Client IDs

這些 Bundle IDs 必須對應：

- ✅ Xcode 專案中的 Bundle Identifier
- ✅ Apple Developer Console 中的 App ID
- ✅ App ID 必須已啟用 Sign in with Apple capability

### 關於 Callback URL

- 📝 這個 URL 是 Supabase 自動生成的
- 📝 **原生 iOS 應用不需要**在 Apple Developer Console 註冊這個 URL
- 📝 **Web OAuth 才需要**在 Services ID 中註冊這個 URL

---

## 📝 設定步驟

### 步驟 1: 設定正式站 (Production)

1. 前往 Supabase Dashboard
2. 選擇 **to-do-production** 專案 (`ajbusqpjsjcuzzxuueij`)
3. 前往 **Authentication** > **Providers** > **Apple**
4. 啟用 **Sign in with Apple**
5. 在 **Client IDs** 欄位輸入：
   ```
   com.cty0305.too.doo.list
   ```
6. **Secret Key** 留空（如果只用原生 iOS）
7. 啟用 **Allow users without an email**
8. 點擊 **Save**

---

## ✅ 驗證檢查清單

### Apple Developer Console

- [ ] App ID `com.cty0305.too.doo.list` 已啟用 Sign in with Apple

### Xcode 專案

- [ ] Production Target 已添加 Sign in with Apple capability

### Supabase Dashboard

- [ ] Production 專案的 Apple Provider 已啟用
- [ ] Production 專案的 Client IDs 已正確設定

---

## 🧪 測試

### 正式站測試

```bash
npx expo prebuild
npx expo run:ios --device --configuration Release
```

⚠️ **注意:** Sign in with Apple 必須在**實體設備**上測試，模擬器不支援。
