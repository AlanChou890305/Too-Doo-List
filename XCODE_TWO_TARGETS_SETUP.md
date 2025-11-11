# Xcode 兩個 Target/Scheme 設定指南

## 📋 目標

在 Xcode 中建立兩個 Target 和 Scheme：

1. **To Do** (Production) - Bundle ID: `com.cty0305.too.doo.list`
2. **To Do Staging** (Staging) - Bundle ID: `com.cty0305.too.doo.list.staging`

---

## 步驟 1: 打開 Xcode 專案

```bash
cd ios
open *.xcworkspace
```

如果沒有 workspace，先執行：

```bash
cd ios
export LANG=en_US.UTF-8
pod install
open *.xcworkspace
```

---

## 步驟 2: 複製 Target 建立 ToDoStaging

1. 在 Xcode 左側 **Project Navigator** 中，選擇專案名稱（最上層）
2. 在中央區域，選擇 **TARGETS** 下的 **ToDo**
3. 右鍵點擊 **ToDo** → 選擇 **Duplicate**
4. 會出現一個新的 Target：**ToDo copy**
5. 將 **ToDo copy** 重新命名為 **ToDoStaging**：
   - 選擇 **ToDo copy** → 按 `Enter` 鍵 → 輸入 `ToDoStaging`

---

## 步驟 3: 設定 ToDoStaging Target 的 Bundle ID

1. 選擇 **ToDoStaging** Target
2. 選擇 **General** 標籤
3. 在 **Identity** 區域，找到 **Bundle Identifier**
4. 修改為：`com.cty0305.too.doo.list.staging`

---

## 步驟 4: 設定 ToDoStaging Target 的 Display Name

1. 在 **ToDoStaging** Target 的 **General** 標籤
2. 找到 **Display Name**（或編輯 `ToDo/Info.plist`）
3. 設定為：`To Do Staging`

**注意：** 如果沒有 Display Name 欄位，需要編輯 `Info.plist`：

- 在 Project Navigator 中找到 `ToDo/Info.plist`
- 找到 `CFBundleDisplayName` 或新增它
- 設定為：`To Do Staging`

但由於兩個 Target 共用同一個 `Info.plist`，建議：

- 在 Xcode 中，選擇 **ToDoStaging** Target → **Build Settings**
- 搜尋 `INFOPLIST_KEY_CFBundleDisplayName`
- 設定為：`To Do Staging`

---

## 步驟 5: 確認兩個 Target 的 Sign in with Apple Capability

### 檢查 ToDo Target (Production)

1. 選擇 **ToDo** Target
2. 選擇 **Signing & Capabilities** 標籤
3. 確認：
   - ✅ **Sign in with Apple** capability 已添加
   - ✅ 選擇正確的 **Team**

### 檢查 ToDoStaging Target (Staging)

1. 選擇 **ToDoStaging** Target
2. 選擇 **Signing & Capabilities** 標籤
3. 確認：
   - ✅ **Sign in with Apple** capability 已添加
   - ✅ 選擇正確的 **Team**

---

## 步驟 6: 建立兩個 Scheme

### 建立 "To Do" Scheme (Production)

1. 在 Xcode 頂部，點擊 Scheme 下拉選單（目前顯示 "ToDo"）
2. 選擇 **Edit Scheme...**
3. 在左側選擇 **ToDo**
4. 點擊左下角的 **Duplicate Scheme** 按鈕
5. 名稱輸入：`To Do`
6. 點擊 **OK**

### 建立 "To Do Staging" Scheme (Staging)

1. 在 Scheme 下拉選單中，選擇 **Manage Schemes...**
2. 找到 **ToDo** scheme
3. 點擊 **Duplicate**（或選擇 **ToDoStaging** Target 來建立新 Scheme）
4. 名稱輸入：`To Do Staging`
5. 在 **Shared** 欄位打勾（讓它可以被 Git 追蹤）
6. 確認 **Target** 選擇為 **ToDoStaging**
7. 點擊 **Close**

---

## 步驟 7: 設定環境變數

### 設定 "To Do" Scheme 的環境變數（Production）

1. 在 Scheme 下拉選單中，選擇 **To Do** → **Edit Scheme...**
2. 選擇 **Run** → **Arguments** 標籤
3. 在 **Environment Variables** 區域，點擊 **+** 添加以下變數：

```
Name: EXPO_PUBLIC_APP_ENV
Value: production

Name: EXPO_PUBLIC_SUPABASE_URL
Value: https://ajbusqpjsjcuzzxuueij.supabase.co

Name: EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYnVzcXBqc2pjdXp6eHV1ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDIwNDgsImV4cCI6MjA3NjgxODA0OH0.yiz9ZWafK1kM0HeK80xw7jISqi57WrAkZzybgiH4Byo
```

4. 點擊 **Close**

### 設定 "To Do Staging" Scheme 的環境變數（Staging）

1. 在 Scheme 下拉選單中，選擇 **To Do Staging** → **Edit Scheme...**
2. 選擇 **Run** → **Arguments** 標籤
3. 在 **Environment Variables** 區域，點擊 **+** 添加以下變數：

```
Name: EXPO_PUBLIC_APP_ENV
Value: staging

Name: EXPO_PUBLIC_SUPABASE_URL_STAGING
Value: https://qerosiozltqrbehctxdn.supabase.co

Name: EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcm9zaW96bHRxcmJlaGN0eGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTQyNzAsImV4cCI6MjA3NTIzMDI3MH0.gEzTwpl79HbrQ0KeYRvEji45vdI7SbOhZVc_wpih91E
```

4. 點擊 **Close**

---

## 步驟 8: 確認設定

### 檢查清單

#### ToDo Target (Production)

- [ ] Bundle Identifier: `com.cty0305.too.doo.list`
- [ ] Display Name: `To Do`
- [ ] Sign in with Apple capability 已添加
- [ ] Team 已選擇

#### ToDoStaging Target (Staging)

- [ ] Bundle Identifier: `com.cty0305.too.doo.list.staging`
- [ ] Display Name: `To Do Staging`
- [ ] Sign in with Apple capability 已添加
- [ ] Team 已選擇

#### "To Do" Scheme (Production)

- [ ] Target 選擇：**ToDo**
- [ ] 環境變數：
  - `EXPO_PUBLIC_APP_ENV = production`
  - `EXPO_PUBLIC_SUPABASE_URL = https://ajbusqpjsjcuzzxuueij.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...`

#### "To Do Staging" Scheme (Staging)

- [ ] Target 選擇：**ToDoStaging**
- [ ] 環境變數：
  - `EXPO_PUBLIC_APP_ENV = staging`
  - `EXPO_PUBLIC_SUPABASE_URL_STAGING = https://qerosiozltqrbehctxdn.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING = eyJhbGci...`

---

## 步驟 9: 測試

### 測試 Production 版本

1. 在 Scheme 下拉選單中選擇 **To Do**
2. 連接設備（不是模擬器）
3. 選擇您的設備
4. 點擊 **Run** 按鈕（或按 `Cmd + R`）
5. 確認 App 名稱顯示為 "To Do"
6. 測試 Google 和 Apple 登入

### 測試 Staging 版本

1. 在 Scheme 下拉選單中選擇 **To Do Staging**
2. 連接設備（不是模擬器）
3. 選擇您的設備
4. 點擊 **Run** 按鈕（或按 `Cmd + R`）
5. 確認 App 名稱顯示為 "To Do Staging"
6. 測試 Google 和 Apple 登入

---

## ✅ 完成！

現在您可以在 Xcode 中快速切換兩個 Scheme：

- **To Do** - Production 版本
- **To Do Staging** - Staging 版本

兩個 App 可以同時安裝在同一設備上，互不干擾！

---

## 🚨 常見問題

### Q1: 如何確認目前使用的是哪個 Scheme？

在 Xcode 頂部的 Scheme 下拉選單中可以看到當前選擇的 Scheme。

### Q2: 兩個 App 可以同時安裝嗎？

是的！因為 Bundle ID 不同，兩個 App 可以同時安裝在同一設備上。

### Q3: 環境變數沒有生效？

確保：

1. 在正確的 Scheme 中設定環境變數
2. 環境變數名稱正確（大小寫敏感）
3. 重新運行應用程式

### Q4: Sign in with Apple 無法使用？

確保：

1. 兩個 Target 都有 **Sign in with Apple** capability
2. 在 Apple Developer Console 中，兩個 App ID 都已啟用 Sign in with Apple
3. 在 Supabase Dashboard 中，Client IDs 包含兩個 Bundle ID
