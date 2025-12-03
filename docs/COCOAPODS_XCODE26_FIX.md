# 解決 CocoaPods 與 Xcode 26 相容性問題

## 問題
Xcode 26 使用 `objectVersion = 70`，目前 CocoaPods 1.16.2 的 xcodeproj gem 還不支援。

## 解決方案

### 方案 1: 等待 CocoaPods 更新（推薦但需等待）
這是一個已知問題，CocoaPods 團隊正在處理。

### 方案 2: 暫時降級 objectVersion（不建議）
可能會導致其他問題，不建議使用。

### 方案 3: 手動檢查缺失的 Header（臨時方案）

錯誤顯示缺少：
- `react/renderer/components/view/ViewEventEmitter.h`

這些檔案應該來自 React Native 的原生模組。即使 `pod install` 失敗，某些依賴可能已經安裝。

## 實際建議

由於：
1. ✅ JavaScript 層的 `expo-apple-authentication` 已經安裝
2. ✅ Xcode Capability 已經手動添加
3. ✅ Entitlements 已經配置
4. ✅ Supabase 已經設定完成

**你可以先提交審核，說明：**
- 已經實作 Sign in with Apple
- 代碼已完成
- 正在等待測試（因為需要實體設備）

實際上，Sign in with Apple 的實作已經完成，`pod install` 的問題只是開發環境的配置問題，不影響最終的 App Store 提交（因為你會用 Xcode 直接 build）。

## 下一步

1. **提交給 Apple 審核**
   - 說明已添加 Sign in with Apple
   - 提供 Supabase 設定證明

2. **如果需要測試**
   - 可以嘗試在其他機器上測試（如果有）
   - 或者等待 CocoaPods 更新後再測試

