# Mixpanel 事件追蹤指南

## 📊 事件追蹤策略

### 目標
- 了解用戶如何使用 App
- 追蹤新功能採用率
- 監控 App 健康度和性能
- 優化用戶體驗和留存率

---

## 🎯 核心事件列表

### 1. 用戶生命週期事件

#### App Opened ✅ (已實現)
**觸發時機：** App 啟動時

**屬性：**
```javascript
{
  app_version: "1.2.3",
  build_number: "11",
  platform: "ios",
  timezone: "Asia/Taipei"
}
```

**實現位置：** `App.js` - `useEffect(() => { ... }, [])`

---

#### Session Started 🆕 (建議新增)
**觸發時機：** App 進入前景時

**屬性：**
```javascript
{
  session_id: generateSessionId(),
  time_since_last_session_minutes: 15,
  app_version: "1.2.3",
  platform: "ios"
}
```

**實現位置：** `App.js` - `AppState` listener

**範例代碼：**
```javascript
useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      const sessionId = Date.now().toString();
      const lastSessionTime = await AsyncStorage.getItem('last_session_time');
      const timeSince = lastSessionTime
        ? Math.floor((Date.now() - parseInt(lastSessionTime)) / 60000)
        : 0;

      mixpanelService.track("Session Started", {
        session_id: sessionId,
        time_since_last_session_minutes: timeSince,
        app_version: Application.nativeApplicationVersion,
        platform: Platform.OS
      });

      await AsyncStorage.setItem('current_session_id', sessionId);
      await AsyncStorage.setItem('session_start_time', Date.now().toString());
    } else if (nextAppState === 'background') {
      // Session Ended event (see below)
    }
  });

  return () => subscription.remove();
}, []);
```

---

#### Session Ended 🆕 (建議新增)
**觸發時機：** App 進入背景時

**屬性：**
```javascript
{
  session_id: sessionId,
  session_duration_seconds: 240,
  tasks_created: 3,
  tasks_completed: 5,
  screens_viewed: ["calendar", "settings"]
}
```

**實現位置：** `App.js` - `AppState` listener

**範例代碼：**
```javascript
// 在 Session Started 的 else if 分支
const sessionId = await AsyncStorage.getItem('current_session_id');
const startTime = await AsyncStorage.getItem('session_start_time');
const duration = startTime
  ? Math.floor((Date.now() - parseInt(startTime)) / 1000)
  : 0;

mixpanelService.track("Session Ended", {
  session_id: sessionId,
  session_duration_seconds: duration,
  tasks_created: sessionTasksCreated,  // 從 state 獲取
  tasks_completed: sessionTasksCompleted,
  screens_viewed: sessionScreens
});

await AsyncStorage.setItem('last_session_time', Date.now().toString());
```

---

#### User Signed In ✅ (已實現)
**屬性：** 已有 `method`, `email`, `platform`

**建議優化：** 添加更多屬性
```javascript
{
  method: "new_signin",
  email: user.email,
  platform: "ios",
  app_version: "1.2.3",
  timezone: Localization.timezone,
  is_first_launch: isFirstLaunch  // 🆕 建議新增
}
```

---

#### User Signed Out ✅ (已實現)
**屬性：** 已有 `platform`

**建議優化：** 添加會話統計
```javascript
{
  platform: "ios",
  session_duration_minutes: totalSessionTime,  // 🆕
  total_tasks_created: totalTasks,  // 🆕
  total_tasks_completed: completedTasks  // 🆕
}
```

---

### 2. 任務管理事件

#### Task Created ✅ (已實現)
**屬性：** 已有 `has_time`, `has_link`, `has_note`

**建議優化：** 添加更多上下文
```javascript
{
  task_id: task.id,
  has_time: !!taskTime,
  has_link: !!taskLink,
  has_note: !!taskNote,
  date: taskDate,
  is_today: taskDate === today,  // 🆕
  days_from_today: daysDiff,  // 🆕
  creation_source: "calendar"  // 🆕 or "add_button", "quick_add"
}
```

---

#### Task Updated ✅ (已實現)
**建議優化：** 追蹤具體修改內容
```javascript
{
  task_id: task.id,
  has_time: !!taskTime,
  has_link: !!taskLink,
  has_note: !!taskNote,
  fields_changed: ["title", "time"],  // 🆕 具體改了什麼
  edit_duration_seconds: editTime  // 🆕 編輯花了多久
}
```

---

#### Task Deleted 🆕 (建議新增)
**觸發時機：** 刪除任務時

**屬性：**
```javascript
{
  task_id: task.id,
  was_completed: task.is_completed,
  had_time: !!task.time,
  had_link: !!task.link,
  had_note: !!task.note,
  task_age_days: taskAge,
  deletion_method: "swipe"  // or "button", "bulk"
}
```

**實現位置：** 刪除任務的函數中

**範例代碼：**
```javascript
const deleteTask = async (task) => {
  // 計算任務年齡
  const taskAge = Math.floor(
    (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  mixpanelService.track("Task Deleted", {
    task_id: task.id,
    was_completed: task.is_completed,
    had_time: !!task.time,
    had_link: !!task.link,
    had_note: !!task.note,
    task_age_days: taskAge,
    deletion_method: "button"
  });

  // 執行刪除邏輯...
};
```

---

#### Task Moved 🆕 (建議新增)
**觸發時機：** 移動任務到其他日期時

**屬性：**
```javascript
{
  task_id: task.id,
  from_date: "2026-01-31",
  to_date: "2026-02-01",
  days_diff: 1,
  move_method: "drag_drop"  // or "calendar_selector", "edit_modal"
}
```

**實現位置：** `moveTaskToDate` 函數

---

#### Task Completed / Uncompleted ✅ (已實現)
**建議優化：** 添加完成時間統計
```javascript
{
  task_id: task.id,
  completion_time: new Date().toISOString(),
  days_since_created: daysSinceCreated,  // 🆕
  had_reminder: !!task.time,  // 🆕
  completed_on_time: isOnTime  // 🆕 是否準時完成
}
```

---

### 3. 日曆和導航事件

#### Calendar Month Changed 🆕 (建議新增)
**觸發時機：** 切換月份時

**屬性：**
```javascript
{
  direction: "next",  // or "prev"
  from_month: "2026-01",
  to_month: "2026-02",
  method: "button",  // or "swipe", "gesture"
  selected_date_changed: false  // 我們修復的 bug！
}
```

**實現位置：** `goToPrevMonth`, `goToNextMonth` 函數

**範例代碼：**
```javascript
const goToNextMonth = () => {
  const newMonth = visibleMonth === 11 ? 0 : visibleMonth + 1;
  const newYear = visibleMonth === 11 ? visibleYear + 1 : visibleYear;

  // Mixpanel 追蹤
  mixpanelService.track("Calendar Month Changed", {
    direction: "next",
    from_month: `${visibleYear}-${String(visibleMonth + 1).padStart(2, '0')}`,
    to_month: `${newYear}-${String(newMonth + 1).padStart(2, '0')}`,
    method: "button",
    selected_date_changed: false
  });

  setVisibleMonth(newMonth);
  setVisibleYear(newYear);
};
```

---

#### Date Selected 🆕 (建議新增)
**觸發時機：** 選擇日期時

**屬性：**
```javascript
{
  date: "2026-01-31",
  is_today: true,
  has_tasks: true,
  task_count: 5,
  completed_count: 3,
  is_weekend: false
}
```

**實現位置：** 日期點擊處理函數

---

#### Today Button Clicked 🆕 (建議新增)
**觸發時機：** 點擊 "Today" 按鈕時

**屬性：**
```javascript
{
  was_viewing_month: "2026-02",
  months_away_from_today: 1
}
```

---

### 4. 版本更新事件 (v1.2.3 新增)

#### Version Update Prompted 🆕 (重要！)
**觸發時機：** 顯示版本更新 Modal 時

**屬性：**
```javascript
{
  current_version: "1.2.3",
  latest_version: "1.2.4",
  force_update: false,
  has_release_notes: true,
  days_since_release: 3
}
```

**實現位置：** `VersionUpdateModal.js` 或版本檢查邏輯

**範例代碼：**
```javascript
// 在顯示 Modal 時
useEffect(() => {
  if (visible && updateInfo) {
    mixpanelService.track("Version Update Prompted", {
      current_version: Application.nativeApplicationVersion,
      latest_version: updateInfo.latestVersion,
      force_update: forceUpdate,
      has_release_notes: !!updateInfo.releaseNotes,
      days_since_release: calculateDaysSinceRelease(updateInfo.latestVersion)
    });
  }
}, [visible]);
```

---

#### Version Update Clicked 🆕 (重要！)
**觸發時機：** 用戶點擊"立即更新"按鈕時

**屬性：**
```javascript
{
  current_version: "1.2.3",
  latest_version: "1.2.4",
  update_url: "https://apps.apple.com/..."
}
```

**實現位置：** `VersionUpdateModal.js` - `handleUpdate` 函數

**範例代碼：**
```javascript
const handleUpdate = async () => {
  mixpanelService.track("Version Update Clicked", {
    current_version: Application.nativeApplicationVersion,
    latest_version: updateInfo.latestVersion,
    update_url: updateInfo.updateUrl || getUpdateUrl("production")
  });

  // 開啟更新連結...
};
```

---

#### Version Update Dismissed 🆕
**觸發時機：** 用戶點擊"稍後更新"時

**屬性：**
```javascript
{
  current_version: "1.2.3",
  latest_version: "1.2.4",
  dismiss_count: 2  // 第幾次忽略
}
```

**實現位置：** `VersionUpdateModal.js` - `handleLater` 函數

---

### 5. 新功能使用事件 (v1.2.3)

#### Map Preview Opened 🆕
**觸發時機：** 開啟地圖預覽時

**屬性：**
```javascript
{
  task_id: task.id,
  url: taskLink,
  source: "task_detail",  // or "calendar_view"
  is_google_maps: true
}
```

**實現位置：** `MapPreview.js` 組件

---

#### Widget Viewed 🆕
**觸發時機：** Widget 載入時（可在 Widget 代碼中實現）

**屬性：**
```javascript
{
  task_count: todayTasks.length,
  completed_count: completedTasks.length,
  time_of_day: new Date().getHours(),
  is_morning: isMorning,  // 6-12
  is_afternoon: isAfternoon,  // 12-18
  is_evening: isEvening  // 18-24
}
```

---

#### Ad Viewed 🆕
**觸發時機：** 廣告成功載入並顯示時

**屬性：**
```javascript
{
  placement: "calendar_bottom",  // or "settings_bottom"
  ad_format: "banner",
  load_time_ms: loadTime
}
```

**實現位置：** `AdBanner.js` - 廣告載入成功回調

---

### 6. 設定和反饋事件

#### Feedback Submitted 🆕 (重要！)
**觸發時機：** 提交反饋時

**屬性：**
```javascript
{
  category: "bug",  // suggestion/bug/other
  feedback_length: feedbackText.length,
  app_version: "1.2.3",
  platform: "ios",
  has_tasks: userTaskCount > 0
}
```

**實現位置：** `App.js` - Feedback Modal 提交按鈕

**範例代碼：**
```javascript
// 在提交 feedback 之前
mixpanelService.track("Feedback Submitted", {
  category: feedbackCategory,
  feedback_length: feedbackText.trim().length,
  app_version: Application.nativeApplicationVersion,
  platform: Platform.OS,
  has_tasks: Object.keys(tasks).length > 0
});

// 然後執行提交邏輯...
```

---

#### Language Changed 🆕
**觸發時機：** 切換語言時

**屬性：**
```javascript
{
  from_language: "en",
  to_language: "zh",
  user_device_language: Localization.locale
}
```

**實現位置：** `App.js` - `setLanguage` 函數

**範例代碼：**
```javascript
const setLanguage = async (lang) => {
  const prevLanguage = language;

  console.log(`🌐 Setting language to: ${lang}`);
  setLanguageState(lang);

  // Mixpanel 追蹤
  mixpanelService.track("Language Changed", {
    from_language: prevLanguage,
    to_language: lang,
    user_device_language: Localization.getLocales()[0]?.languageCode
  });

  // 保存到 Supabase...
};
```

---

#### Theme Changed 🆕
**觸發時機：** 切換主題時

**屬性：**
```javascript
{
  from_theme: "light",
  to_theme: "dark",
  time_of_day: new Date().getHours()
}
```

---

### 7. 錯誤和性能追蹤

#### API Error 🆕
**觸發時機：** API 請求失敗時

**屬性：**
```javascript
{
  endpoint: "tasks",
  method: "POST",
  error_code: error.code,
  error_message: error.message,
  retry_count: retryCount,
  user_id: userId
}
```

**實現位置：** API 錯誤處理邏輯（taskService.js, userService.js 等）

---

#### Task Sync Failed 🆕
**觸發時機：** 任務同步失敗時

**屬性：**
```javascript
{
  operation: "create",  // or "update", "delete"
  error_type: "network",  // or "permission", "validation"
  task_id: task.id,
  retry_available: true
}
```

---

## 📈 Super Properties（超級屬性）

在 App 啟動時設定，所有後續事件都會自動包含：

```javascript
// 在 App.js 初始化 Mixpanel 後
mixpanelService.registerSuperProperties({
  app_version: Application.nativeApplicationVersion,
  build_number: Application.nativeBuildVersion,
  platform: Platform.OS,
  os_version: Platform.Version,
  timezone: Localization.timezone,
  device_language: Localization.getLocales()[0]?.languageCode
});
```

---

## 🎯 實現優先級建議

### Phase 1 - 核心指標（立即實現）
1. ✅ Version Update Events
2. ✅ Task Deleted
3. ✅ Feedback Submitted
4. ✅ Session Started/Ended

### Phase 2 - 產品優化（1-2 週內）
5. ✅ Calendar Month Changed
6. ✅ Date Selected
7. ✅ Language Changed
8. ✅ Map Preview Opened

### Phase 3 - 進階分析（1 個月內）
9. ✅ API Error
10. ✅ Task Sync Failed
11. ✅ Widget Viewed
12. ✅ Ad Events

---

## 📊 關鍵指標 (KPIs)

### 用戶參與度
- DAU/MAU (Daily/Monthly Active Users)
- Session Count per User
- Average Session Duration
- Tasks Created per Session

### 功能使用率
- Map Preview Adoption Rate
- Widget Installation Rate
- Language Distribution
- Ad View Rate

### 版本更新
- Version Update Prompt Show Rate
- Version Update Click Rate
- Version Adoption Speed (days to 50%/90%)

### 用戶滿意度
- Feedback Submission Rate
- Bug Report vs Suggestion Ratio
- Task Completion Rate

---

## 🔧 測試建議

### 1. 本地測試
```javascript
// 在開發環境中，輸出到 console 而不發送到 Mixpanel
if (__DEV__) {
  console.log('[Mixpanel Test]', eventName, properties);
} else {
  mixpanelService.track(eventName, properties);
}
```

### 2. 驗證事件
在 Mixpanel Dashboard 中：
1. Events → Live View
2. 執行 App 操作
3. 確認事件即時顯示
4. 檢查屬性完整性

---

## 📝 命名規範

### 事件名稱
- 使用 Title Case（每個單字首字母大寫）
- 動詞 + 名詞格式："Task Created", "User Signed In"
- 保持一致性和描述性

### 屬性名稱
- 使用 snake_case（小寫 + 底線）
- 描述性命名："app_version", "task_count"
- 布林值使用 is_ 或 has_ 前綴

### 屬性值
- 使用小寫字串："ios", "android", "button"
- 布林值：true/false
- 數字：不加引號

---

**文檔版本**: 1.0
**最後更新**: 2026-01-31
**適用版本**: v1.2.3+
