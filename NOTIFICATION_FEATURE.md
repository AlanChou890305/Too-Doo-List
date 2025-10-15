# 任務提醒通知功能 (v1.4.0)

## 功能概述

✅ **自動提醒：** 任務開始前 30 分鐘自動發送通知  
✅ **智能管理：** 完成或刪除任務時自動取消通知  
✅ **多語系支援：** 繁體中文 / English  
✅ **跨平台：** iOS & Android（需原生構建）

---

## 用戶體驗

### 創建任務時
1. 設定任務時間（例如：15:00）
2. 儲存任務
3. 系統自動安排提醒（14:30）

### 收到通知時
- **標題：** 「任務提醒」/ "Task Reminder"
- **內容：** 任務文字
- **時間：** 任務開始前 30 分鐘

### 完成任務時
- 標記完成 → 自動取消通知
- 刪除任務 → 自動取消通知

---

## 技術實作

### 核心技術
- **expo-notifications**: 本地推送通知
- **Platform 檢測**: 僅在原生平台啟用（Web 不支援）
- **自動權限請求**: App 啟動時自動請求通知權限

### 檔案變更

#### 新增檔案
- `src/services/notificationService.js` - 通知服務模組
- `XCODE_BUILD_GUIDE.md` - Xcode 構建指南
- `NOTIFICATION_FEATURE.md` - 功能說明文件

#### 修改檔案
- `App.js`
  - 導入通知服務
  - 在 App 啟動時請求通知權限
  - 在 `saveTask()` 中安排通知
  - 在 `deleteTask()` 中取消通知
  - 在 `toggleTaskChecked()` 中取消通知
  - 新增多語系翻譯（taskReminder 等）

- `app.config.js`
  - 添加 `expo-notifications` 插件
  - 更新版本號至 1.4.0
  - 配置通知圖示和顏色

- `package.json`
  - 更新版本號至 1.4.0

---

## 構建與部署

### ⚠️ 重要：需要原生構建

此功能需要新增原生模組，**不能純 OTA 更新**。

### 構建方式

**方式 1：Xcode 本地構建（推薦，免費）**
```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
open ios/ToDo.xcworkspace
# 在 Xcode 中 Build & Run
```

詳細步驟請參考：[XCODE_BUILD_GUIDE.md](./XCODE_BUILD_GUIDE.md)

**方式 2：EAS Build（需要 credits）**
```bash
eas build --platform ios --profile production
```

---

## 測試指南

### 測試環境
- ✅ iOS 真機（推薦）
- ✅ Android 真機
- ❌ iOS/Android 模擬器（不支援本地通知）

### 測試步驟

1. **授予權限**
   - 首次啟動時點擊「允許」通知

2. **創建測試任務**
   - 日期：今天
   - 時間：當前時間 + 31 分鐘
   - 內容：「測試通知」

3. **驗證通知**
   - 等待 1 分鐘
   - 應收到通知

4. **測試取消**
   - 創建任務後立即完成
   - 確認不會收到通知

### Debug 日誌

在 Xcode Console 或 Metro Bundler 中查找：
```
✅ Notification permissions granted
✅ Notification scheduled for task: 測試通知
   Task time: 2025-10-15 15:00:00
   Reminder time: 2025-10-15 14:30:00
   Notification ID: xxx-xxx-xxx
```

---

## API 參考

### notificationService.js

```javascript
// 請求通知權限
registerForPushNotificationsAsync() → Promise<boolean>

// 安排任務通知
scheduleTaskNotification(task, reminderText) → Promise<string|null>

// 取消通知
cancelTaskNotification(notificationId) → Promise<void>

// 取消所有通知
cancelAllNotifications() → Promise<void>

// 獲取所有已安排的通知
getAllScheduledNotifications() → Promise<Array>
```

### 任務資料結構（新增欄位）

```javascript
{
  id: string,
  title: string,
  date: string,        // YYYY-MM-DD
  time: string,        // HH:MM
  checked: boolean,
  link: string,
  note: string,
  notificationId: string  // 新增：通知 ID
}
```

---

## 限制與注意事項

### 平台限制
- ❌ Web 平台不支援本地通知
- ❌ 模擬器不支援本地通知
- ✅ iOS/Android 真機完全支援

### 通知條件
- 必須設定任務時間
- 提醒時間必須在未來（> 當前時間）
- 用戶必須授予通知權限

### 資料庫
- `notificationId` 欄位已加入 Supabase tasks 表
- 需要執行資料庫遷移（如尚未執行）

---

## 版本歷程

### v1.4.0 (2025-10-15)
- ✨ 新增：任務提醒通知功能
- ✨ 新增：任務開始前 30 分鐘自動提醒
- ✨ 新增：完成/刪除任務自動取消通知
- 🔧 改善：多語系支援通知文字
- 📦 新增：expo-notifications 依賴

---

## 下一步計劃

### 可能的功能增強
- [ ] 自訂提醒時間（15/30/60 分鐘）
- [ ] 重複通知（每日/每週任務）
- [ ] 通知音效自訂
- [ ] 通知中心快速操作（完成/延後）

---

## 相關文件

- [Xcode 構建指南](./XCODE_BUILD_GUIDE.md) - 詳細的本地構建步驟
- [Expo Notifications 文檔](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [專案開發規則](./README.md) - 版本控制與多語系規範


