# Xcode Bundle ID 設定指南

## 🎯 問題說明

**問題：** 切換 Scheme 時，Bundle ID 沒有改變。

**原因：** Bundle ID 是在 **Target** 層級設定的，不是在 Scheme 層級。Scheme 只是告訴 Xcode 如何建置，而 Bundle ID 是 App 的唯一識別碼，需要在 Target 設定中修改。

## 📝 解決方案

### 方案 A: 手動修改 Bundle ID（簡單但容易出錯）

**建置 Production 時：**

1. 選擇 **ToDo** Scheme
2. 在左側 Project Navigator 中選擇專案
3. 選擇 **TARGETS** 下的 Target（通常是 "ToDo" 或專案名稱）
4. 選擇 **General** 標籤
5. 在 **Identity** 區域找到 **Bundle Identifier**
6. 設定為：`com.cty0305.too.doo.list`
7. Archive 並上傳

**建置 Staging 時：**

1. 選擇 **ToDo Staging** Scheme
2. 重複上述步驟
3. 設定為：`com.cty0305.too.doo.list.staging`
4. Archive 並上傳

⚠️ **注意：** 每次切換時都需要手動修改，容易出錯。

### 方案 B: 不適用於 Expo 專案

⚠️ **注意：** 這個方案不適用於 Expo 專案，因為 Expo 會自動管理 Bundle ID。

對於 Expo 專案，**不要手動創建新的 Target**，而是：

1. **確保 `app.config.js` 配置正確**

   - Production: `bundleIdentifier: "com.cty0305.too.doo.list"`
   - Staging: `bundleIdentifier: "com.cty0305.too.doo.list.staging"`

2. **每次建置前執行 `expo prebuild --clean`**

   ```bash
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   ```

3. **在 Xcode 中修改 Bundle ID**
   - 完成 prebuild 後，在 Xcode 中打開專案
   - 修改 Bundle ID（見方案 A）

### 方案 C: 使用 Build Configuration（較複雜但最靈活）

透過不同的 Build Configuration 來切換 Bundle ID：

1. 選擇專案 → **Info** 標籤
2. 在 **Configurations** 區域點擊 **+** 新增一個 Configuration
3. 命名為 `Staging`
4. 為每個 Configuration 設定不同的 Bundle ID

### 方案 D: 使用 Script（自動化）

在 **Build Phases** 中添加一個 **Run Script** 來根據環境自動修改：

```bash
# 根據 Scheme 名稱動態設定 Bundle ID
if [ "${CONFIGURATION}" == "Release-Staging" ]; then
    /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.cty0305.too.doo.list.staging" "${INFOPLIST_FILE}"
else
    /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.cty0305.too.doo.list" "${INFOPLIST_FILE}"
fi
```

## ✅ 推薦做法（適用於 Expo 專案）

**對於 Expo 專案的最佳流程：**

### 重要：Expo 會自動從 `app.config.js` 生成 Bundle ID

在 `app.config.js` 中已經根據環境自動設定不同的 Bundle ID：

```javascript
// Production
production: {
  bundleIdentifier: "com.cty0305.too.doo.list",
}

// Staging
staging: {
  bundleIdentifier: "com.cty0305.too.doo.list.staging",
}
```

### 建置流程

#### 建置 Production

1. **設定環境變數**

   ```bash
   export EXPO_PUBLIC_APP_ENV=production
   ```

2. **執行 prebuild**

   ```bash
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   ```

   這會自動從 `app.config.js` 讀取 Production 的 Bundle ID

3. **打開 Xcode**

   ```bash
   cd ios && open ToDo.xcworkspace
   ```

4. **確認 Bundle ID**

   - 在 Xcode 中檢查 Bundle ID 應該是 `com.cty0305.too.doo.list`
   - 如果不同，手動修改

5. **Archive**

#### 建置 Staging

1. **設定環境變數**

   ```bash
   export EXPO_PUBLIC_APP_ENV=staging
   ```

2. **執行 prebuild**

   ```bash
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   ```

   這會自動從 `app.config.js` 讀取 Staging 的 Bundle ID

3. **打開 Xcode**

   ```bash
   cd ios && open ToDo.xcworkspace
   ```

4. **確認 Bundle ID**

   - 在 Xcode 中檢查 Bundle ID 應該是 `com.cty0305.too.doo.list.staging`
   - 如果不同，手動修改

5. **Archive**

---

## 📝 為何在 Xcode 中無法直接修改 Bundle ID？

**原因：** 因為 Expo 使用變數來管理 Bundle ID：

```xml
<!-- ios/ToDo/Info.plist -->
<key>CFBundleIdentifier</key>
<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
```

這個 `$(PRODUCT_BUNDLE_IDENTIFIER)` 是在 **Target Build Settings** 中設定的，由 Expo prebuild 自動管理。

**解決方法：** 每次建置前執行 `expo prebuild --clean`，確保使用正確的配置。

---

## 🌐 Associated Domains 設定

### 問題：Associated Domains 都一樣？

**之前的問題：**

- Production 和 Staging 都使用 `applinks:to-do-staging.vercel.app`
- 這不對！應該根據環境使用不同的網域

**現在已修正：**

| 環境           | Bundle ID                          | Associated Domain                   |
| -------------- | ---------------------------------- | ----------------------------------- |
| **Production** | `com.cty0305.too.doo.list`         | `applinks:to-do-mvp.vercel.app`     |
| **Staging**    | `com.cty0305.too.doo.list.staging` | `applinks:to-do-staging.vercel.app` |

**為什麼需要不同的 Associated Domain？**

- Production 應該連接到正式的 Web 版：`to-do-mvp.vercel.app`
- Staging 應該連接到測試的 Web 版：`to-do-staging.vercel.app`
- 這樣可以確保深度連結（Deep Links）指向正確的環境

### 建置前的檢查流程

#### Production Build 檢查清單

1. [ ] Scheme 選擇：**ToDo**
2. [ ] Bundle Identifier 檢查：
   - 在 Xcode 中確認顯示：`com.cty0305.too.doo.list`
3. [ ] 環境變數檢查：
   - `EXPO_PUBLIC_APP_ENV = production`
   - `EXPO_PUBLIC_SUPABASE_URL = https://ajbusqpjsjcuzzxuueij.supabase.co`
4. [ ] Archive

#### Staging Build 檢查清單

1. [ ] Scheme 選擇：**ToDo Staging**
2. [ ] Bundle Identifier 檢查：
   - 在 Xcode 中確認顯示：`com.cty0305.too.doo.list.staging`
3. [ ] 環境變數檢查：
   - `EXPO_PUBLIC_APP_ENV = staging`
   - `EXPO_PUBLIC_SUPABASE_URL_DEV = https://qerosiozltqrbehctxdn.supabase.co`
4. [ ] Archive

## 🔍 如何檢查 Bundle ID？

在 Xcode 中：

1. 選擇專案
2. 選擇 TARGETS → [你的 Target 名稱]
3. 選擇 **General** 標籤
4. 在 **Identity** 區域查看 **Bundle Identifier**

或在 `ios/[ProjectName]/Info.plist` 文件中查看：

```xml
<key>CFBundleIdentifier</key>
<string>com.cty0305.too.doo.list</string>
```

## 💡 為什麼需要不同的 Bundle ID？

不同的 Bundle ID 讓 iOS 系統將兩個版本視為不同的 App：

- ✅ 可以同時安裝
- ✅ 資料完全隔離
- ✅ 各自獨立的通知和設定

## 🚨 常見問題

### Q1: 忘記改 Bundle ID 會有什麼後果？

**後果：**

- 如果用 Staging 的 Bundle ID 上傳到已經上架 Production 的 App，會被拒絕
- 兩個版本可能會覆蓋彼此

### Q2: 改 Bundle ID 會影響什麼？

**影響：**

- App 在手機上的安裝會被視為不同的 App
- 資料不會互通
- 需要重新授權（首次安裝時）

### Q3: 如何快速切換 Bundle ID？

**建議：**

- 在 Xcode 中複製 Project 設定
- 使用 Script 自動化
- 或者建立一個檢查清單，每次建置前確認

---

## 📚 相關文件

- `XCODE_SCHEME_SETUP.md` - Scheme 設定指南
- `QUICK_START_BUILD.md` - 快速建置指南
- `TROUBLESHOOTING_ENV_VARS.md` - 故障排除
