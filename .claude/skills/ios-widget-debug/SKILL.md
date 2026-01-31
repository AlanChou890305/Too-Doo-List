# iOS Widget 除錯技能

這個技能專門處理 iOS Widget 相關問題，包括資料不同步、顯示錯誤、build 失敗等。

## 觸發方式
使用者會用 `/ios-widget-debug` 來呼叫這個技能。

## 常見問題類型

### 1. Widget 資料不同步
**症狀**: Widget 顯示舊資料或空白

**診斷步驟**:
1. 檢查 `src/services/widgetService.js` 的 `updateWidget()` 是否被正確呼叫
2. 檢查 Shared Group Preferences 的 App Group ID 是否一致：
   - React Native: `widgetService.js` 中的 `APP_GROUP`
   - iOS: `TaskCal.entitlements` 和 `TaskCalWidget.entitlements`
3. 檢查傳遞的資料格式是否正確（JSON 格式、欄位名稱）
4. 檢查 `TaskCalWidget.swift` 的資料解析邏輯

**解決方案模板**:
- 確認 `updateWidget()` 在所有資料變更點都有呼叫
- 確認 entitlements 的 App Group ID 一致
- 用 `console.log` 印出傳遞給 Widget 的資料
- 用 Xcode 的 Console 看 Widget 接收到的資料

### 2. Widget Build 失敗
**症狀**: Xcode 編譯錯誤

**診斷步驟**:
1. 讀取使用者提供的 error log
2. 找出錯誤類型：
   - Swift 語法錯誤
   - 缺少依賴/Framework
   - Provisioning Profile 問題
   - Bundle ID 衝突

**解決方案模板**:
- Swift 語法錯誤 → 提供修正後的 code
- Framework 缺少 → 提醒檢查 Xcode target 的 Frameworks
- Provisioning → 提醒這不是 code 問題，需要在 Xcode 設定

### 3. Widget 顯示錯誤
**症狀**: Widget 有顯示，但內容不正確

**診斷步驟**:
1. 用 `Read` 讀取 `ios/TaskCalWidget/TaskCalWidget.swift`
2. 檢查 Timeline 產生邏輯
3. 檢查 View 的顯示邏輯
4. 確認資料解析是否正確

**解決方案模板**:
- 提供修正後的 Swift code
- 解釋為什麼會顯示錯誤
- 提供驗證方式

## 工作流程

### 步驟 1: 收集資訊
向使用者詢問（如果沒提供）：
- 問題現象（截圖更好）
- 是否有 error log（Xcode / Metro）
- 最近改了什麼檔案
- 之前 Widget 是否正常

### 步驟 2: 診斷問題
1. 讀取相關檔案：
   - `src/services/widgetService.js`
   - `ios/TaskCalWidget/TaskCalWidget.swift`
   - `ios/TaskCal/TaskCal.entitlements`
   - `ios/TaskCalWidget/Info.plist`
2. 用 `Grep` 找 `updateWidget` 的呼叫點
3. 分析問題根因

### 步驟 3: 提供解決方案
- 如果是 code 問題 → 直接修正
- 如果是設定問題 → 提供步驟指引
- 如果需要重新 build → 明確告知指令

### 步驟 4: 驗證方式
提供具體驗證步驟：
```markdown
## 驗證步驟
1. 用 Xcode 開啟專案：`open ios/TaskCal.xcworkspace`
2. 選擇 TaskCalWidget scheme
3. 點擊 Run（目標選擇 Widget）
4. 在模擬器/裝置上確認 Widget 顯示
```

## 輸出格式

```markdown
## 🔍 問題診斷：[問題類型]

### 根本原因
[解釋為什麼會出現這個問題]

### 解決方案
[提供具體修改步驟或 code]

### 相關檔案
- 檔案路徑:行號 - 說明

### 驗證方式
1. [步驟 1]
2. [步驟 2]
...

### 預防措施
[避免未來再發生的建議]
```

## 快速參考

### Widget 資料流
```
React Native Component
  ↓ (呼叫)
widgetService.updateWidget()
  ↓ (寫入)
Shared Group Preferences (App Group)
  ↓ (讀取)
TaskCalWidget.swift (Timeline Provider)
  ↓ (渲染)
Widget UI
```

### 常用檔案位置
- Widget Service: `src/services/widgetService.js`
- Widget Swift: `ios/TaskCalWidget/TaskCalWidget.swift`
- App Entitlements: `ios/TaskCal/TaskCal.entitlements`
- Widget Entitlements: `ios/TaskCalWidget/TaskCalWidget.entitlements`
- Widget Info: `ios/TaskCalWidget/Info.plist`

### 常用 Debug 指令
```bash
# 檢查 App Group ID
grep -r "group\." ios/*.entitlements

# 檢查 updateWidget 呼叫點
grep -r "updateWidget" src/

# Build Widget
cd ios && xcodebuild -workspace TaskCal.xcworkspace -scheme TaskCalWidget -configuration Debug
```

## 注意事項
- Widget 問題常常需要實機測試（模擬器可能不準）
- App Group ID 必須完全一致（包括大小寫）
- Widget 有 cache，改完 code 要「移除 Widget 再重新加入」才會更新
