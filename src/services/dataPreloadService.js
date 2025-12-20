import { UserService } from "./userService";
import { TaskService } from "./taskService";
import { widgetService } from "./widgetService";
import { format } from "date-fns";

/**
 * 數據預載入服務
 * 在用戶登入後立即並行載入所有必要的數據
 */
class DataPreloadService {
  static preloadCache = {
    userSettings: null,
    userProfile: null,
    calendarTasks: null,
    preloadTimestamp: null,
    currentMonthTasks: null, // 當前月份的任務（優先載入）
  };

  static CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘緩存
  static isPreloading = false; // 防止並發調用
  static preloadPromise = null; // 保存進行中的 Promise

  /**
   * 預載入所有用戶數據
   */
  static async preloadAllData() {
    // 如果正在預載入，返回現有的 Promise
    if (this.isPreloading && this.preloadPromise) {
      console.log("⏳ [DataPreload] Preload already in progress, waiting...");
      return this.preloadPromise;
    }

    console.log("🚀 [DataPreload] Starting data preload...");
    const startTime = Date.now();

    // 設置正在預載入標記
    this.isPreloading = true;

    // 創建 Promise 並保存
    this.preloadPromise = (async () => {
      try {
        // 檢查緩存
        if (
          this.preloadCache.userSettings &&
          this.preloadCache.userProfile &&
          this.preloadCache.calendarTasks &&
          this.preloadCache.preloadTimestamp &&
          Date.now() - this.preloadCache.preloadTimestamp < this.CACHE_DURATION
        ) {
          console.log("📦 [DataPreload] Using cached data");
          this.isPreloading = false;
          this.preloadPromise = null;
          return {
            userSettings: this.preloadCache.userSettings,
            userProfile: this.preloadCache.userProfile,
            calendarTasks: this.preloadCache.calendarTasks,
          };
        }

        // 並行載入用戶設定和用戶資料
        const [userSettings, userProfile] = await Promise.all([
          this.preloadUserSettings(),
          this.preloadUserProfile(),
        ]);

        // 更新緩存（先更新用戶設定和資料）
        this.preloadCache.userSettings = userSettings;
        this.preloadCache.userProfile = userProfile;

        // 分階段載入日曆任務
        // 階段 1：優先載入當月（立即更新緩存）
        const currentMonthTasksPromise = this.preloadCurrentMonthTasks();

        // 階段 2：載入前後一個月（在當月載入完成後）
        const calendarTasksPromise = currentMonthTasksPromise.then(() => {
          return this.preloadCalendarTasks();
        });

        // 等待當月任務載入完成，立即更新緩存和同步 widget
        const currentMonthTasks = await currentMonthTasksPromise;
        if (currentMonthTasks) {
          this.preloadCache.currentMonthTasks = currentMonthTasks;
          this.preloadCache.preloadTimestamp = Date.now();
        }

        // 等待完整日曆任務載入完成
        const calendarTasks = await calendarTasksPromise;

        // 更新完整緩存
        this.preloadCache.calendarTasks = calendarTasks;
        this.preloadCache.preloadTimestamp = Date.now();

        // 只同步一次完整任務到 widget（防抖機制會處理重複調用）
        if (calendarTasks) {
          widgetService.syncTodayTasks(calendarTasks).catch((error) => {
            console.error("❌ [DataPreload] Failed to sync widget:", error);
          });
        }

        const duration = Date.now() - startTime;
        console.log(`✅ [DataPreload] All data loaded in ${duration}ms`);

        const result = {
          userSettings,
          userProfile,
          calendarTasks,
        };

        // 重置標記
        this.isPreloading = false;
        this.preloadPromise = null;

        return result;
      } catch (error) {
        console.error("❌ [DataPreload] Error preloading data:", error);
        console.error("❌ [DataPreload] Error details:", {
          message: error.message,
          stack: error.stack,
          code: error.code,
        });

        // 重置標記
        this.isPreloading = false;
        this.preloadPromise = null;

        // 即使預載入失敗，也返回部分結果（如果有）
        return {
          userSettings: this.preloadCache.userSettings,
          userProfile: this.preloadCache.userProfile,
          calendarTasks: this.preloadCache.currentMonthTasks || null, // 至少返回當月任務（如果有）
        };
      }
    })();

    return this.preloadPromise;
  }

  /**
   * 預載入用戶設定
   */
  static async preloadUserSettings() {
    try {
      console.log("📥 [DataPreload] Loading user settings...");
      const settings = await UserService.getUserSettings();
      console.log("✅ [DataPreload] User settings loaded");
      return settings;
    } catch (error) {
      console.error("❌ [DataPreload] Error loading user settings:", error);
      return null;
    }
  }

  /**
   * 預載入用戶資料
   */
  static async preloadUserProfile() {
    try {
      console.log("📥 [DataPreload] Loading user profile...");
      const profile = await UserService.getUserProfile();
      console.log("✅ [DataPreload] User profile loaded");
      return profile;
    } catch (error) {
      console.error("❌ [DataPreload] Error loading user profile:", error);
      return null;
    }
  }

  /**
   * 預載入當月任務（階段 1：最高優先級）
   */
  static async preloadCurrentMonthTasks() {
    try {
      console.log(
        "🚀 [DataPreload] Stage 1: Loading current month (highest priority)..."
      );
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const currentMonthStart = new Date(currentYear, currentMonth, 1);
      const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
      const currentMonthStartStr = format(currentMonthStart, "yyyy-MM-dd");
      const currentMonthEndStr = format(currentMonthEnd, "yyyy-MM-dd");

      const tasks = await TaskService.getTasksByDateRange(
        currentMonthStartStr,
        currentMonthEndStr
      );

      console.log(
        `✅ [DataPreload] Stage 1 completed: Current month (${currentMonthStartStr} to ${currentMonthEndStr}) loaded`
      );
      return tasks;
    } catch (error) {
      console.error(
        "❌ [DataPreload] Error loading current month tasks:",
        error
      );
      return {};
    }
  }

  /**
   * 預載入日曆任務（分階段載入：當月 → 前後一個月 → 其他月份）
   */
  static async preloadCalendarTasks() {
    try {
      console.log(
        "📥 [DataPreload] Starting staged calendar tasks loading (Stage 2)..."
      );
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // 階段 2：並行載入前一個月和後一個月（當月已經在 Stage 1 載入完成）
      console.log(
        "🚀 [DataPreload] Stage 2: Loading previous and next month..."
      );
      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthEnd = new Date(currentYear, currentMonth, 0);
      const nextMonthStart = new Date(currentYear, currentMonth + 1, 1);
      const nextMonthEnd = new Date(currentYear, currentMonth + 2, 0);

      const prevMonthStartStr = format(prevMonthStart, "yyyy-MM-dd");
      const prevMonthEndStr = format(prevMonthEnd, "yyyy-MM-dd");
      const nextMonthStartStr = format(nextMonthStart, "yyyy-MM-dd");
      const nextMonthEndStr = format(nextMonthEnd, "yyyy-MM-dd");

      const [prevMonthTasks, nextMonthTasks] = await Promise.all([
        TaskService.getTasksByDateRange(prevMonthStartStr, prevMonthEndStr),
        TaskService.getTasksByDateRange(nextMonthStartStr, nextMonthEndStr),
      ]);

      // 合併所有任務（當月任務已經在緩存中）
      const currentMonthTasks = this.preloadCache.currentMonthTasks || {};
      const allTasks = {
        ...prevMonthTasks,
        ...currentMonthTasks,
        ...nextMonthTasks,
      };

      console.log(
        "✅ [DataPreload] Stage 2 completed: Previous and next month loaded"
      );

      // 階段 3：載入更遠的月份（可選，如果需要更多預載入）
      // 目前先不載入，因為前後一個月已經足夠

      console.log("✅ [DataPreload] All calendar tasks loaded");
      return allTasks;
    } catch (error) {
      console.error("❌ [DataPreload] Error loading calendar tasks:", error);
      // 即使出錯，也返回已載入的當月任務
      return this.preloadCache.currentMonthTasks || {};
    }
  }

  /**
   * 清除緩存
   */
  static clearCache() {
    this.preloadCache = {
      userSettings: null,
      userProfile: null,
      calendarTasks: null,
      preloadTimestamp: null,
      currentMonthTasks: null,
    };
    console.log("🗑️ [DataPreload] Cache cleared");
  }

  /**
   * 獲取緩存的數據
   */
  static getCachedData() {
    if (
      this.preloadCache.preloadTimestamp &&
      Date.now() - this.preloadCache.preloadTimestamp < this.CACHE_DURATION
    ) {
      return {
        userSettings: this.preloadCache.userSettings,
        userProfile: this.preloadCache.userProfile,
        calendarTasks: this.preloadCache.calendarTasks,
      };
    }

    // 即使完整預載入還沒完成，也返回當月任務（如果有的話）
    if (this.preloadCache.currentMonthTasks) {
      return {
        userSettings: this.preloadCache.userSettings,
        userProfile: this.preloadCache.userProfile,
        calendarTasks: this.preloadCache.currentMonthTasks,
      };
    }

    return null;
  }

  /**
   * 獲取當月任務（優先級最高）
   */
  static getCurrentMonthTasks() {
    return this.preloadCache.currentMonthTasks || null;
  }

  /**
   * 更新緩存中的用戶設定（用於部分更新，如語言、主題等）
   */
  static updateCachedUserSettings(updatedSettings) {
    if (this.preloadCache.userSettings) {
      this.preloadCache.userSettings = {
        ...this.preloadCache.userSettings,
        ...updatedSettings,
      };
      console.log("📦 [DataPreload] Cached user settings updated");
    }
  }
}

export const dataPreloadService = DataPreloadService;
