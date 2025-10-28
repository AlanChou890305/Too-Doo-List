# 快速建置指南

## 🎯 目標

在你的手機上建立兩個版本的 App：

- 📱 **To Do** - 正式版本
- 📱 **To Do Staging** - 測試版本

---

## ⚡ 快速開始

### 前置步驟：獲取 Supabase API 金鑰

在建置前，請先準備好 Supabase API 金鑰：

#### Production 環境

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇 **to-do-production** 專案
3. 前往 **Settings** → **API**
4. 複製：
   - **Project URL**: `https://ajbusqpjsjcuzzxuueij.supabase.co`
   - **anon public key**: `eyJhbGci...`

#### Staging 環境

1. 選擇 **to-do-staging** 專案
2. 前往 **Settings** → **API**
3. 複製：
   - **Project URL**: `https://qerosiozltqrbehctxdn.supabase.co`
   - **anon public key**: `eyJhbGci...`

### 1. 更新代碼和環境

```bash
# 確保代碼是最新的
git pull origin main

# ⚠️ 重要：檢查 .env.local 文件
if [ -f .env.local ]; then
  echo "⚠️ 警告：發現 .env.local 文件"
  echo "建議暫時重新命名，避免覆蓋 Xcode Scheme 的環境變數"
  read -p "是否要重新命名為 .env.local.backup? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    mv .env.local .env.local.backup
    echo "✅ 已重新命名為 .env.local.backup"
  fi
fi

# 清理並重新生成 iOS 專案
npx expo prebuild --clean
cd ios && pod install && cd ..
```

### 2. 打開 Xcode

```bash
cd ios
open ToDo.xcworkspace
```

---

## 📱 建立 Production 版本（正式版）

### 步驟 1: 設定 Production

1. 在 Xcode 頂部確認選擇了正確的 Scheme（預設應該是 `ToDo`）
2. 確認選擇了 **Any iOS Device** 或你的真機（不是模擬器）

### 步驟 2: 設定環境變數

1. 選擇 **Product > Scheme > Edit Scheme**
2. 選擇 **Run** > **Arguments** 標籤
3. 在 **Environment Variables** 區域，新增以下變數：

#### Production 環境變數

```
Name: EXPO_PUBLIC_APP_ENV
Value: production

Name: EXPO_PUBLIC_SUPABASE_URL
Value: https://ajbusqpjsjcuzzxuueij.supabase.co

Name: EXPO_PUBLIC_SUPABASE_ANON_KEY
Value: [你的 Production Anon Key]
```

> **重要**: `EXPO_PUBLIC_SUPABASE_ANON_KEY` 請從 Supabase Dashboard 獲取

### 步驟 3: 設定簽名

1. 選擇專案 > Target
2. 在 **Signing & Capabilities** 標籤：
   - ✅ **Automatically manage signing**
   - 選擇你的 **Team**（需要 Apple Developer Account）

### 步驟 4: Archive

1. 選擇 **Product > Archive**
2. 等待完成（約 5-10 分鐘）

### 步驟 5: 上傳到 TestFlight

1. 在 Organizer 中選擇 Archive
2. 點擊 **Distribute App**
3. 選擇 **TestFlight & App Store**
4. 選擇 **Upload**
5. 跟隨步驟完成

### 結果

- ✅ App 名稱：**To Do**
- ✅ Bundle ID: `com.cty0305.too.doo.list`
- ✅ 在手機上顯示為：**To Do**

---

## 🧪 建立 Staging 版本（測試版）

### 重要：先建立 Production 版本完成後再進行！

### 步驟 1: 設定環境變數為 Staging

1. 選擇 **Product > Scheme > Edit Scheme**
2. 選擇 **Run** > **Arguments** 標籤
3. 在 **Environment Variables** 區域，新增以下變數：

#### Staging 環境變數

```
Name: EXPO_PUBLIC_APP_ENV
Value: staging

Name: EXPO_PUBLIC_SUPABASE_URL_DEV
Value: https://qerosiozltqrbehctxdn.supabase.co

Name: EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV
Value: [你的 Staging Anon Key]
```

> **重要**: `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV` 請從 Supabase Dashboard 獲取

### 步驟 2: 設定簽名（不同的 Bundle ID）

1. 選擇專案 > Target
2. 在 **Signing & Capabilities** 標籤：
   - 找到 **Bundle Identifier**
   - 改為：`com.cty0305.too.doo.list.staging`
   - ✅ **Automatically manage signing**
   - 選擇你的 **Team**

### 步驟 3: Archive

1. 選擇 **Product > Archive**
2. 等待完成

### 步驟 4: 上傳到 TestFlight

1. 在 Organizer 中選擇新的 Archive
2. 點擊 **Distribute App**
3. 選擇 **TestFlight & App Store**
4. 選擇 **Upload**
5. 跟隨步驟完成

### 結果

- ✅ App 名稱：**To Do Staging**
- ✅ Bundle ID: `com.cty0305.too.doo.list.staging`
- ✅ 在手機上顯示為：**To Do Staging**

---

## 📱 在手機上安裝

### 等待處理完成

- ⏱️ 等待時間：約 5-30 分鐘
- 📧 Apple 處理完成後會收到 Email 通知

### 新增測試人員

1. 前往 [App Store Connect](https://appstoreconnect.apple.com)
2. 選擇你的 App
3. 進入 **TestFlight** 標籤
4. 你應該會看到兩個不同的 Build：
   - **Production Build** - Bundle ID: `com.cty0305.too.doo.list`
   - **Staging Build** - Bundle ID: `com.cty0305.too.doo.list.staging`

### 邀請測試人員

#### Production（正式版）

1. 選擇 Production Build（Bundle ID: `com.cty0305.too.doo.list`）
2. 點擊 **內部測試** 或 **外部測試**
3. 新增測試人員

#### Staging（測試版）

1. 選擇 Staging Build（Bundle ID: `com.cty0305.too.doo.list.staging`）
2. 點擊 **內部測試** 或 **外部測試**
3. 新增測試人員（可以是相同或不同的人）

### 測試人員安裝

測試人員在 TestFlight 中會看到：

- 📱 **To Do** - 正式版本
- 📱 **To Do Staging** - 測試版本

兩個可以同時安裝，互不干擾！

---

## 🔄 版本更新

### 更新版本號

在建立新版本前：

```bash
# 更新版本（可選）
npm version patch  # 1.9.1 → 1.9.2
# 或
npm version minor  # 1.9.1 → 1.10.0
```

### 同時更新兩個檔案

1. **package.json** - 自動更新（執行 `npm version` 時）
2. **app.config.js** - 手動更新版本號

---

## 🚨 常見問題

### Q1: 兩個 App 會共用資料嗎？

**不會**。因為 Bundle ID 不同，它們是兩個完全獨立的 App：

- Production: 使用正式環境的 Supabase
- Staging: 使用測試環境的 Supabase
- 資料完全分離

### Q2: 可以同時安裝嗎？

**可以！** 因為 Bundle ID 不同，iOS 會將它們視為兩個不同的 App。

### Q3: 如何區分 Production 和 Staging？

**App 名稱不同**：

- Production: **To Do**
- Staging: **To Do Staging**

在你的手機上會顯示為兩個不同的 App。

### Q4: 需要在 App Store Connect 創建兩個 App 嗎？

**不需要**。兩個 build 可以在同一個 App 的 TestFlight 中管理，但因為 Bundle ID 不同，它們會被視為不同的內部測試版本。

### Q5: 如何只更新其中一個版本？

在 Xcode 中：

1. 設定對應的環境變數（production 或 staging）
2. 設定對應的 Bundle ID
3. Archive 並上傳

---

## ✅ 檢查清單

### Production Build

- [ ] 環境變數設定為 `production`
- [ ] Bundle ID: `com.cty0305.too.doo.list`
- [ ] Team 已選擇
- [ ] Archive 成功
- [ ] 上傳到 TestFlight 成功

### Staging Build

- [ ] 環境變數設定為 `staging`
- [ ] Bundle ID: `com.cty0305.too.doo.list.staging`
- [ ] Team 已選擇
- [ ] Archive 成功
- [ ] 上傳到 TestFlight 成功

---

## 💡 提示

1. **先建 Production 再建 Staging**，避免設定混亂
2. **每次建置前檢查環境變數**，確保設定正確
3. **使用不同的 TestFlight Group**，管理不同的測試人員
4. **記錄每個 Build 的版本號**，方便追蹤

---

## 📚 相關文件

- `BUILD_ENVIRONMENTS_XCODE.md` - 詳細的建置指南
- `TESTFLIGHT_SETUP.md` - TestFlight 設定
- `XCODE_BUILD_GUIDE.md` - Xcode 建置指南
