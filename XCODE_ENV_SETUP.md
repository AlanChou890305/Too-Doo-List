# Xcode Scheme 環境變數設定指南

## ⚠️ 重要：Archive 前必須設定

在進行 Xcode Archive 之前，**必須**在 Scheme 中設定環境變數，否則 App 可能無法正確連接到 Supabase 資料庫。

---

## 📋 設定步驟

### 步驟 1: 開啟 Scheme 編輯器

1. 開啟 Xcode
2. 開啟 `ios/ToDo.xcworkspace`
3. 點擊頂部裝置選擇器旁邊的 **Scheme 下拉選單**
4. 選擇 **Edit Scheme...**

   **快捷方式：** `Product` → `Scheme` → `Edit Scheme...`

### 步驟 2: 添加環境變數

1. 在左側選擇 **Run**
2. 點擊上方的 **Arguments** 標籤
3. 展開 **Environment Variables** 區域
4. 點擊左下角的 **+** 按鈕添加新變數

### 步驟 3: 添加以下環境變數

逐一添加以下三個環境變數：

#### 變數 1: EXPO_PUBLIC_APP_ENV
```
Name: EXPO_PUBLIC_APP_ENV
Value: production
```

#### 變數 2: EXPO_PUBLIC_SUPABASE_URL
```
Name: EXPO_PUBLIC_SUPABASE_URL
Value: https://ajbusqpjsjcuzzxuueij.supabase.co
```

#### 變數 3: EXPO_PUBLIC_SUPABASE_ANON_KEY
```
Name: EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYnVzcXBqc2pjdXp6eHV1ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNjY2NTksImV4cCI6MjA0NDc0MjY1OX0.1Aw4OcBWPZTiRbGJDLpMmBPWQcZYMmVvFqMxdKHgAuU
```

### 步驟 4: 確認設定

添加完成後，應該看到類似這樣的列表：

```
✅ EXPO_PUBLIC_APP_ENV = production
✅ EXPO_PUBLIC_SUPABASE_URL = https://ajbusqpjsjcuzzxuueij.supabase.co
✅ EXPO_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 步驟 5: 儲存並關閉

1. 確認所有變數都已正確添加
2. 點擊 **Close** 按鈕

---

## 🔍 驗證設定

### 方法 1: 檢查 Scheme 檔案

環境變數會儲存在：
```
ios/ToDo.xcodeproj/xcshareddata/xcschemes/ToDo - 待辦清單.xcscheme
```

### 方法 2: 在 App 中檢查

在 App 啟動時，檢查 console log 應該會看到：
```
🌍 Environment: Production
```

---

## ❓ 常見問題

### Q1: 為什麼需要設定這些環境變數？

**A:** 雖然代碼中有 fallback 值，但在 Xcode Archive 時，環境變數的優先級更高。設定環境變數可以確保：
- App 使用正確的 Production 環境
- 連接到正確的 Supabase 資料庫
- 避免使用到錯誤的配置

### Q2: 環境變數會被打包進 App 嗎？

**A:** 是的。在 Xcode Scheme 中設定的環境變數會被打包進最終的 App 中。

### Q3: 如果忘記設定會怎樣？

**A:** App 可能會：
- 使用代碼中的 fallback 值（通常沒問題）
- 但為了確保一致性，建議還是設定環境變數

### Q4: 設定後需要重新 Build 嗎？

**A:** 是的。修改環境變數後需要：
1. **Clean Build Folder**: `Product` → `Clean Build Folder` (Shift+Cmd+K)
2. 重新 **Archive**: `Product` → `Archive`

### Q5: 可以只設定 EXPO_PUBLIC_APP_ENV 嗎？

**A:** 建議設定所有三個變數，以確保：
- 環境明確為 Production
- Supabase URL 和 Key 正確
- 避免任何可能的配置錯誤

---

## 💡 提示

1. **每次 Archive 前檢查**
   - 養成習慣，每次 Archive 前都檢查環境變數是否正確設定

2. **使用 Shared Scheme**
   - 確保 Scheme 是 Shared 狀態，這樣設定會被 Git 追蹤
   - 在 Scheme 編輯器中勾選 **Shared** 選項

3. **團隊協作**
   - 如果團隊成員也需要 Archive，確保他們也知道要設定這些環境變數
   - 或者將設定好的 Scheme 檔案提交到 Git

4. **備份設定**
   - 可以將環境變數設定記錄在文檔中（但不要提交敏感資訊到公開倉庫）

---

## ✅ 檢查清單

在 Archive 前確認：

- [ ] 已開啟 Xcode Scheme 編輯器
- [ ] 已添加 `EXPO_PUBLIC_APP_ENV = production`
- [ ] 已添加 `EXPO_PUBLIC_SUPABASE_URL`
- [ ] 已添加 `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 所有變數前面都有 ✅ 標記
- [ ] 已點擊 Close 儲存設定
- [ ] 已執行 Clean Build Folder
- [ ] 準備進行 Archive

