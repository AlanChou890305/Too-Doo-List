# 在 Xcode 中手動添加 Sign in with Apple Capability

## 📝 步驟說明

### 1. 打開 Xcode Workspace

```bash
open ios/ToDo.xcworkspace
```

### 2. 為 Production Target 添加 Capability

1. 在 Xcode 左側專案導航器中，選擇 **ToDo** 專案（最頂部的藍色圖標）
2. 選擇 **ToDo** target（不是 "ToDo Staging"）
3. 點擊頂部的 **Signing & Capabilities** 標籤
4. 點擊左上角的 **+ Capability** 按鈕
5. 搜尋並選擇 **Sign In with Apple**
6. Xcode 會自動將此 capability 添加到 entitlements 檔案

### 3. 為 Staging Target 添加 Capability

1. 同樣在專案導航器中選擇 **ToDo** 專案
2. 選擇 **ToDo Staging** target
3. 點擊頂部的 **Signing & Capabilities** 標籤
4. 點擊左上角的 **+ Capability** 按鈕
5. 搜尋並選擇 **Sign In with Apple**
6. Xcode 會自動將此 capability 添加到 Staging entitlements 檔案

### 4. 驗證設定

確認兩個 target 的 **Signing & Capabilities** 中都有：

- ✅ Sign In with Apple capability
- ✅ 正確的 Bundle Identifier
- ✅ 正確的 Team 設定

## 🔍 檢查 entitlements 檔案

添加後，兩個 entitlements 檔案應該包含：

**ios/ToDo/ToDo.entitlements:**

```xml
<key>com.apple.developer.applesignin</key>
<array>
    <string>Default</string>
</array>
```

**ios/ToDo-Staging/ToDo-Staging.entitlements** (如果存在，或共用 ToDo-Staging.entitlements):

```xml
<key>com.apple.developer.applesignin</key>
<array>
    <string>Default</string>
</array>
```

## ⚠️ 注意事項

- 這樣做**不會**影響你現有的 target 和 scheme 設定
- 只是添加一個新的 capability
- 你的所有自定義設定都會保留
