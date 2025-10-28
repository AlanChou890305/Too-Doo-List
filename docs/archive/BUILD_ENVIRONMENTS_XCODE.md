# Build 環境說明 (Xcode 版本)

## 🎯 概述

本專案支援使用 Xcode 本地建置兩種主要的環境：

1. **Production** - 正式版本，供 TestFlight 測試
2. **Staging** - 開發版本，供內部測試新功能

---

## 📱 Production Build (正式版)

### 前置準備

1. **確保 iOS 專案已生成**

   ```bash
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   ```

2. **打開 Xcode 專案**
   ```bash
   cd ios
   open ToDo.xcworkspace
   # 或直接
   open Too-Doo-List.xcworkspace
   ```

### 建立 Production Build

#### 步驟 1: 在 Xcode 中設定

1. 選擇 **Product > Scheme > Edit Scheme**
2. 選擇 **Run** 方案
3. 在 **Info** 標籤中，將 **Build Configuration** 設為 **Release**

#### 步驟 2: 設定環境變數

1. 選擇 **Product > Scheme > Edit Scheme**
2. 選擇 **Run** > **Arguments** 標籤
3. 在 **Environment Variables** 中新增：
   ```
   EXPO_PUBLIC_APP_ENV = production
   ```

#### 步驟 3: 設定 Signing & Capabilities

1. 選擇專案 > Target
2. 在 **Signing & Capabilities** 標籤：
   - ✅ **Automatically manage signing**
   - 選擇你的 **Team** (需要 Apple Developer Account)

#### 步驟 4: Archive

1. 選擇 **Product > Archive**
2. 等待 Archive 完成（約 5-10 分鐘）
3. 在 **Organizer** 視窗中會看到新的 Archive

#### 步驟 5: 上傳到 TestFlight

1. 在 **Organizer** 中選擇剛建立的 Archive
2. 點擊 **Distribute App**
3. 選擇 **TestFlight & App Store**
4. 選擇 **Upload**
5. 跟隨步驟完成上傳

---

## 🧪 Staging Build (開發版)

### 建立 Staging Build

#### 步驟 1: 創建 Staging Scheme

1. 選擇 **Product > Scheme > New Scheme**
2. 名稱輸入：`ToDo Staging`
3. 點擊 **OK**

#### 步驟 2: 設定 Staging Configuration

1. 選擇 **Product > Scheme > Edit Scheme**
2. 選擇剛創建的 `ToDo Staging` scheme
3. 選擇 **Run** 方案
4. 在 **Info** 標籤中，將 **Build Configuration** 設為 **Debug** 或創建新的

#### 步驟 3: 設定環境變數

1. 在 **Staging Scheme** 的 **Arguments** 標籤中
2. 新增 Environment Variables：
   ```
   EXPO_PUBLIC_APP_ENV = staging
   ```

#### 步驟 4: Archive Staging 版本

1. 確保選擇了 `ToDo Staging` scheme
2. 選擇 **Product > Archive**
3. 完成後上傳到 TestFlight（同上傳步驟）

---

## 🔄 版本管理

### 當前版本

查看當前版本號：

```bash
# package.json
cat package.json | grep version

# app.config.js
grep "version:" app.config.js
```

### 更新版本

在開始建置前，需要更新版本號：

1. **package.json**

   ```bash
   npm version patch  # 1.9.1 → 1.9.2
   # 或
   npm version minor  # 1.9.1 → 1.10.0
   # 或
   npm version major  # 1.9.1 → 2.0.0
   ```

2. **app.config.js**

   - 手動更新 `version` 欄位

3. **Xcode Project**
   - 在 Xcode 中，選擇 Target > General
   - 更新 **Version** 和 **Build** 號碼
   - Version: 例如 `1.9.1`
   - Build: 例如 `1`（每次建置自動遞增，或手動設定）

---

## 📋 快速開始指南

### 建立 Production 版本

```bash
# 1. 確保代碼是最新的
git pull origin main

# 2. 更新版本（可選）
npm version patch

# 3. 更新 app.config.js 的版本號

# 4. 生成/更新 iOS 專案
npx expo prebuild --clean
cd ios && pod install && cd ..

# 5. 打開 Xcode
cd ios
open ToDo.xcworkspace

# 6. 在 Xcode 中：
#    - 選擇正確的 Team
#    - 確認環境變數設定
#    - Product > Archive
#    - 上傳到 TestFlight

# 7. 等待處理完成後，在 App Store Connect 新增測試人員
```

### 建立 Staging 版本

```bash
# 1. 確保有 Staging Scheme（參考上方步驟）

# 2. 在 Xcode 中：
#    - 選擇 "ToDo Staging" scheme
#    - 確認環境變數設定為 staging
#    - Product > Archive
#    - 上傳到 TestFlight

# 3. 在 App Store Connect 中，這個 build 會與 Production 分開管理
```

---

## 🚨 常見問題

### Q1: 找不到 .xcworkspace 文件

**解決方案**：

```bash
# 生成 iOS 專案
npx expo prebuild --clean
cd ios && pod install && cd ..
```

### Q2: Signing 錯誤

**解決方案**：

1. 確保已登入 Xcode 中的 Apple ID
2. 在 Signing & Capabilities 中選擇正確的 Team
3. 確保 Bundle Identifier 正確

### Q3: Archive 選項是灰色的

**解決方案**：

1. 確保選擇了正確的 Target（Device 或 Any iOS Device）
2. 不要選擇 Simulator
3. 在 Scheme 編輯器中確認 Build Configuration 設定正確

### Q4: Pod install 失敗

**解決方案**：

```bash
# 清除並重新安裝
cd ios
rm -rf Pods Podfile.lock
pod install
```

### Q5: 如何區分 Production 和 Staging 版本？

**✅ 已自動配置！**

在 `app.config.js` 中已設定：

- **Production**: App 名稱 = "To Do", Bundle ID = `com.cty0305.too.doo.list`
- **Staging**: App 名稱 = "To Do Staging", Bundle ID = `com.cty0305.too.doo.list.staging`

這樣設定後：

- ✅ 兩個 App 可以在同一裝置上並存
- ✅ 手機上會顯示為兩個不同的 App
- ✅ Production 顯示為 "To Do"
- ✅ Staging 顯示為 "To Do Staging"

---

## 🎨 App 名稱設定

### 自動配置

在 `app.config.js` 中已自動配置了不同環境的 App 名稱：

- **Production 環境**：

  - App 名稱：`To Do`
  - Bundle ID：`com.cty0305.too.doo.list`
  - 顯示在手機上為：**To Do**

- **Staging 環境**：
  - App 名稱：`To Do Staging`
  - Bundle ID：`com.cty0305.too.doo.list.staging`
  - 顯示在手機上為：**To Do Staging**

### 在手機上安裝後

兩個版本會顯示為獨立的 App：

- 📱 **To Do** - 正式版本
- 📱 **To Do Staging** - 測試版本

可以同時安裝，互不干擾！

---

## ⚙️ 自動化腳本（可選）

創建一個腳本簡化流程：

```bash
#!/bin/bash
# scripts/build-xcode-production.sh

echo "🚀 Building Production Version with Xcode"
echo "========================================"

# 檢查版本
echo "📦 Current version:"
cat package.json | grep version

# 更新版本
read -p "Update version? (patch/minor/major/n): " version_choice
case $version_choice in
    patch) npm version patch ;;
    minor) npm version minor ;;
    major) npm version major ;;
    *) echo "Keeping current version" ;;
esac

# Prebuild
echo "🔨 Running prebuild..."
npx expo prebuild --clean

# Pod install
echo "📦 Installing pods..."
cd ios && pod install && cd ..

# 打開 Xcode
echo "📱 Opening Xcode..."
cd ios
open ToDo.xcworkspace

echo "✅ Done! Now in Xcode:"
echo "1. Select correct team"
echo "2. Check environment variables"
echo "3. Product > Archive"
echo "4. Upload to TestFlight"
```

---

## 📱 TestFlight 使用

### 上傳後等待處理

- ⏱️ 等待時間：約 5-30 分鐘
- 📧 處理完成後會收到 Email 通知

### 新增測試人員

1. 前往 [App Store Connect](https://appstoreconnect.apple.com)
2. 選擇你的 App
3. 進入 **TestFlight** 標籤
4. 選擇對應的 Build（Production 或 Staging）
5. 點擊 **內部測試** 或 **外部測試**
6. 新增測試人員

### 區分 Production 和 Staging

- 可以為不同環境創建不同的 TestFlight Group
- 例如：`Production Testers` 和 `Staging Testers`
- 分別邀請不同的測試人員

---

## ✅ 建置前檢查清單

### Production Build

- [ ] 代碼已提交到 Git
- [ ] 版本號已更新
- [ ] 所有功能測試通過
- [ ] 沒有已知的嚴重 bug
- [ ] Xcode 中 Team 已選擇
- [ ] 環境變數設定正確（production）
- [ ] Archive 成功
- [ ] 上傳到 TestFlight 成功

### Staging Build

- [ ] 創建了 Staging Scheme
- [ ] 環境變數設定為 staging
- [ ] Archive 成功
- [ ] 上傳到 TestFlight 成功

---

## 💡 提示和技巧

1. **保持簽名檔案同步**

   - 使用 **Automatically manage signing**
   - 確保所有裝置都能正常簽名

2. **定期清理 Build**

   ```bash
   # 在 Xcode 中
   Product > Clean Build Folder (Shift+Cmd+K)
   ```

3. **檢查 Build 設定**

   - 確保 Release 配置使用正確的優化設定
   - Debug 配置用於開發

4. **使用 Symbol Files**
   - 上傳到 App Store Connect 時勾選 "Include bitcode symbols"
   - 有助於 crash 報告分析

---

## 📚 相關文檔

- `TESTFLIGHT_SETUP.md` - TestFlight 詳細設定
- `XCODE_BUILD_GUIDE.md` - Xcode 建置詳細指南
- `BUILD_ENVIRONMENTS.md` - EAS Build 版本

---

## 🆚 Xcode vs EAS Build

| 項目     | Xcode (本地)   | EAS Build (雲端)   |
| -------- | -------------- | ------------------ |
| 建置位置 | 本地 Mac       | Expo 雲端          |
| 建置速度 | 快（本地資源） | 較慢（雲端排隊）   |
| 免費額度 | 無限制         | 30 builds/月       |
| 成本     | $99/年 (Apple) | 超出免費額度需付費 |
| 自動化   | 需手動操作     | 可自動化 CI/CD     |
| 最佳用途 | 定期發布       | 頻繁建置           |
