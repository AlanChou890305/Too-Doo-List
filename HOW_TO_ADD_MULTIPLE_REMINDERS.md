# 如何新增多個提醒時間點

## 快速指南

想要在任務前 30 分鐘和 10 分鐘各收到一次提醒？只需要修改一個檔案！

---

## 步驟 1：修改配置文件

打開：`src/config/notificationConfig.js`

找到這一行：

```javascript
export const REMINDER_MINUTES_BEFORE_TASK = [30];
```

改為：

```javascript
export const REMINDER_MINUTES_BEFORE_TASK = [30, 10];
```

**就這樣！** 🎉

---

## 步驟 2：重新構建 App

由於這是配置變更，需要重新構建（不能純 OTA 更新）：

```bash
# 方法 A：使用 Xcode（免費）
npx expo prebuild --clean
cd ios && pod install && cd ..
open ios/ToDo.xcworkspace
# 在 Xcode 中 Build & Run

# 方法 B：使用 EAS Build（需要 credits）
eas build --platform ios --profile production
```

---

## 步驟 3：測試

1. 創建一個任務，時間設為當前時間 + 31 分鐘（例如 15:31）
2. 在任務前 30 分鐘（15:01）收到第一次通知
3. 在任務前 10 分鐘（15:21）收到第二次通知

---

## 更多範例

### 單次提醒（預設）

```javascript
export const REMINDER_MINUTES_BEFORE_TASK = [30];
```

- 任務前 30 分鐘提醒一次

### 雙重提醒

```javascript
export const REMINDER_MINUTES_BEFORE_TASK = [30, 10];
```

- 任務前 30 分鐘提醒
- 任務前 10 分鐘再提醒

### 三重提醒

```javascript
export const REMINDER_MINUTES_BEFORE_TASK = [60, 30, 10];
```

- 任務前 1 小時提醒
- 任務前 30 分鐘提醒
- 任務前 10 分鐘提醒

### 短時間提醒（適合急迫任務）

```javascript
export const REMINDER_MINUTES_BEFORE_TASK = [15, 5];
```

- 任務前 15 分鐘提醒
- 任務前 5 分鐘提醒

### 長時間提醒（適合重要事項）

```javascript
export const REMINDER_MINUTES_BEFORE_TASK = [1440, 60, 10];
```

- 任務前 1 天（1440 分鐘）提醒
- 任務前 1 小時提醒
- 任務前 10 分鐘提醒

---

## 測試模式

在開發時想要快速測試通知？

打開：`src/config/notificationConfig.js`

找到：

```javascript
export const DEV_CONFIG = {
  testMode: false,
};
```

改為：

```javascript
export const DEV_CONFIG = {
  testMode: true,
};
```

**測試模式效果：**

- 提醒時間改為任務前 **1 分鐘**
- 方便快速測試通知功能
- ⚠️ **記得測試完改回 `false`**

---

## 技術細節

### 通知 ID 管理

系統會自動管理多個通知 ID：

**舊版（單一通知）：**

```javascript
task.notificationId = "abc-123";
```

**新版（支援多個通知）：**

```javascript
task.notificationIds = ["abc-123", "def-456"];
```

系統會自動向後兼容，無需手動遷移資料。

### 智能跳過已過期的提醒

如果某個提醒時間已經過去，系統會自動跳過：

**範例：**

- 現在時間：14:25
- 任務時間：14:50
- 設定：`[30, 10]`（任務前 30 分鐘和 10 分鐘）

**結果：**

- ❌ 任務前 30 分鐘（14:20）已過去 → 跳過
- ✅ 任務前 10 分鐘（14:40）還沒到 → 安排通知

Console 會顯示：

```
⏭️  Skipping 30min reminder (time is in the past)
✅ Notification scheduled (10min before)
```

---

## 版本控制建議

修改 `notificationConfig.js` 後記得更新版本號：

```bash
# PATCH: 微調提醒時間（如 30 → 25）
npm version patch

# MINOR: 新增提醒時間點（如 [30] → [30, 10]）
npm version minor
```

然後更新 `app.config.js` 和 commit：

```bash
git add -A
git commit -m "[feat] 新增雙重提醒功能 (v1.5.0)

- 新增任務前 10 分鐘第二次提醒
- 提醒時間點：30 分鐘 + 10 分鐘"
git push origin main
```

---

## 常見問題

### Q1: 為什麼改了配置文件不能 OTA 更新？

因為通知系統在 App 啟動時初始化，需要重新構建原生代碼。

### Q2: 可以讓用戶在 App 內自訂提醒時間嗎？

可以！未來可以在設定頁面加入此功能，讓用戶自訂提醒時間並存到資料庫。

### Q3: 最多可以設幾個提醒時間？

理論上沒有限制，但建議不超過 3-4 個，避免打擾用戶。

### Q4: 可以針對不同任務設定不同提醒時間嗎？

目前所有任務使用相同的提醒設定。未來可以為每個任務單獨設定。

---

## 未來功能規劃

- [ ] 讓用戶在設定頁面自訂提醒時間
- [ ] 為重要任務設定額外提醒
- [ ] 支援重複任務的週期性提醒
- [ ] 通知中加入快速操作（完成/延後）
- [ ] 自訂通知音效

---

## 相關檔案

- **配置文件**：`src/config/notificationConfig.js`
- **通知服務**：`src/services/notificationService.js`
- **主程式邏輯**：`App.js`
- **構建指南**：`XCODE_BUILD_GUIDE.md`
- **功能說明**：`NOTIFICATION_FEATURE.md`

