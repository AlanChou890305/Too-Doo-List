# 登入後流程說明

## 當前流程（有重複載入問題）

### 1. 用戶登入觸發
- 用戶點擊 Google/Apple 登入
- Supabase 設置 session
- 觸發 `SIGNED_IN` 或 `INITIAL_SESSION` 事件

### 2. SplashScreen 的 auth listener 處理（App.js 第 723-868 行）
```
SIGNED_IN/INITIAL_SESSION 事件
  ↓
驗證用戶資料（可能重試 3 次，最多 1.8 秒）
  ↓
預載入資料（pre-load，第 832-854 行）：
  - 等待 500ms
  - 僅從 session 構建 profile 物件（不實際載入資料）
  - ⚠️ 不載入 tasks（TaskService.getTasks()）
  - ⚠️ 不載入 profile（UserService.getUserProfile()）
  ↓
導航到主 app（navigateToMainApp）
```

### 3. MainTabs 載入（包含 CalendarScreen 和 SettingScreen）

### 4. CalendarScreen 載入（App.js 第 4957 行開始）
```
Mount useEffect（第 5039 行）：
  - 檢查 tasks 是否已載入（如果已載入，跳過）
  - 等待 300ms
  - 檢查 session
  - 載入 tasks（TaskService.getTasks()，最多 5 秒超時）
  - 第一次載入，可能不完整（因為資料還沒準備好）
  ↓
Auth listener useEffect（監聽 SIGNED_IN/INITIAL_SESSION/TOKEN_REFRESHED）：
  - 檢查 isLoadingTasksRef（防止並發載入）
  - 再次載入 tasks（第二次）
  - 可能觸發多次（因為多個事件）
  ↓
useFocusEffect（當螢幕獲得焦點時）：
  - 檢查 isLoadingTasksRef
  - 檢查 tasks 是否已載入
  - 如果未載入，再次載入 tasks（第三次）
```

### 5. SettingScreen 載入（App.js 第 3202 行開始）
```
Mount useEffect：
  - 調用 loadUserProfile("Mount")
  - 檢查 isLoggingOut（如果正在登出，跳過）
  - 檢查 isLoadingProfile（如果正在載入，跳過）
  - 檢查 userProfile（如果已載入，跳過）
  - 載入 profile（第一次）
  ↓
Auth listener useEffect（第 3577 行，監聽 SIGNED_IN/INITIAL_SESSION/TOKEN_REFRESHED）：
  - 調用 loadProfile（內部調用 loadUserProfile）
  - 檢查 isLoggingOut
  - 檢查 isLoadingProfile
  - 檢查 userProfile
  - 再次載入 profile（第二次）
  ↓
useFocusEffect（當螢幕獲得焦點時）：
  - 調用 loadUserProfile("Focus")
  - 檢查 isLoggingOut
  - 檢查 isLoadingProfile
  - 檢查 userProfile
  - 如果未載入，再次載入 profile（第三次）
```

## 問題分析

### 1. 預載入不完整
- **位置**：SplashScreen 的 `onAuthStateChange` 監聽器（第 832-854 行）
- **問題**：預載入邏輯僅從 session 構建 profile 物件，**不實際載入資料**：
  - ❌ 不調用 `UserService.getUserProfile()`
  - ❌ 不調用 `TaskService.getTasks()`
  - ✅ 僅構建 `profileFromSession` 物件（但未使用）
- **結果**：導航時資料尚未載入，導致第一次顯示不完整

### 2. 多個載入觸發點
- **CalendarScreen**：
  - Mount useEffect（第一次載入）
  - Auth listener useEffect（監聽 SIGNED_IN/INITIAL_SESSION/TOKEN_REFRESHED，可能觸發多次）
  - useFocusEffect（當螢幕獲得焦點時）
- **SettingScreen**：
  - Mount useEffect（第一次載入）
  - Auth listener useEffect（監聽 SIGNED_IN/INITIAL_SESSION/TOKEN_REFRESHED，可能觸發多次）
  - useFocusEffect（當螢幕獲得焦點時）

### 3. 資料載入時序問題
- **導航時機**：SplashScreen 在驗證用戶後立即導航（不等待資料載入完成）
- **載入時機**：CalendarScreen 和 SettingScreen 在 mount 時才開始載入
- **結果**：用戶看到空的畫面，然後資料逐漸載入（造成「重複載入」的視覺效果）

### 4. 多個 auth 事件觸發
- `SIGNED_IN`：首次登入時觸發
- `INITIAL_SESSION`：應用啟動時如果有 session 觸發
- `TOKEN_REFRESHED`：token 刷新時觸發
- **結果**：每個事件都會觸發 CalendarScreen 和 SettingScreen 的 auth listener，導致重複載入

## 為什麼會看到「重複載入」？

### 視覺效果
1. **第一次**：導航到 MainTabs，CalendarScreen 和 SettingScreen mount
2. **第二次**：Mount useEffect 開始載入（但資料可能還沒準備好，顯示空狀態）
3. **第三次**：Auth listener 觸發（SIGNED_IN/INITIAL_SESSION），再次載入
4. **第四次**：資料載入完成，UI 更新（顯示完整資料）

### 實際流程
```
登入成功
  ↓
SplashScreen 導航（不等待資料載入）
  ↓
CalendarScreen mount（開始載入 tasks，但資料可能還沒準備好）
  ↓
Auth listener 觸發（SIGNED_IN/INITIAL_SESSION）
  ↓
CalendarScreen auth listener（再次載入 tasks）
  ↓
資料載入完成（顯示完整資料）
```

## 優化方案

### 目標
- 登入後第一次就顯示完整資料
- 避免重複載入
- 確保資料完整性

### 策略
1. **在導航前完整載入資料**：
   - 在 SplashScreen 的 `onAuthStateChange` 中，實際調用 `UserService.getUserProfile()` 和 `TaskService.getTasks()`
   - 等待資料載入完成後再導航
   - 使用 retry 機制確保資料完整

2. **移除重複的載入觸發點**：
   - 移除 CalendarScreen 和 SettingScreen 的 auth listener（因為資料已在導航前載入）
   - 保留 Mount useEffect 作為 fallback（如果資料未載入）
   - 保留 useFocusEffect 作為 fallback（如果資料未載入）

3. **共享資料狀態**：
   - 使用 Context 或 Redux 共享 tasks 和 profile 資料
   - 避免每個 Screen 重複載入

4. **優化載入時序**：
   - 導航前確保資料已載入
   - 導航後立即顯示完整資料（無需再次載入）
