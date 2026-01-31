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
    todayTasks: null, // 今天的任務（最高優先級）
    currentMonthTasks: null, // 當前月份的任務（優先載入）
  };

  static CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘緩存
  static isPreloading = false; // 防止並發調用
  static preloadPromise = null; // 保存進行中的 Promise
  /** 當 calendarTasks 緩存更新時通知訂閱者（例如背景載入前後月完成） */
  static calendarTasksListeners = new Set();

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
        // 但 userSettings 載入完成後立即更新緩存，不等待 userProfile
        const userSettingsPromise = this.preloadUserSettings().then(
          (settings) => {
            // 立即更新緩存，讓 loadLanguage/loadTheme 能立即使用
            if (settings) {
              this.preloadCache.userSettings = settings;
              console.log("📦 [DataPreload] User settings cached immediately");
            }
            return settings;
          },
        );

        const userProfilePromise = this.preloadUserProfile().then((profile) => {
          // 立即更新緩存
          if (profile) {
            this.preloadCache.userProfile = profile;
            console.log("📦 [DataPreload] User profile cached immediately");
          }
          return profile;
        });

        // 等待兩者都完成（但緩存已經在各自完成時更新了）
        const [userSettings, userProfile] = await Promise.all([
          userSettingsPromise,
          userProfilePromise,
        ]);

        // 分階段載入日曆任務（優先順序：今天 → 當月 → 前後月 → 其他月）
        // 階段 0-1：並行載入今天的任務和當月任務（加速載入）
        // 因為當月任務 API 會返回今天的任務，所以可以並行載入
        const todayTasksPromise = this.preloadTodayTasks();
        const currentMonthTasksPromise = this.preloadCurrentMonthTasks();

        // 使用 Promise.allSettled 並行等待，不因單個失敗而阻塞
        const [todayResult, monthResult] = await Promise.allSettled([
          todayTasksPromise,
          currentMonthTasksPromise,
        ]);

        // 處理今天的任務（優先使用）
        let todayTasks = {};
        if (todayResult.status === "fulfilled" && todayResult.value) {
          todayTasks = todayResult.value;
          this.preloadCache.todayTasks = todayTasks;
          this.preloadCache.preloadTimestamp = Date.now();
          // 立即同步今天的任務到 widget（最快顯示）
          widgetService.syncTodayTasks(todayTasks).catch((error) => {
            console.error(
              "❌ [DataPreload] Failed to sync today tasks to widget:",
              error,
            );
          });
        }

        // 處理當月任務
        let currentMonthTasks = {};
        if (monthResult.status === "fulfilled" && monthResult.value) {
          currentMonthTasks = monthResult.value;
          // 合併今天的任務和當月任務（當月任務可能已包含今天的任務）
          const mergedMonthTasks = {
            ...todayTasks,
            ...currentMonthTasks,
          };
          this.preloadCache.currentMonthTasks = mergedMonthTasks;
          this.preloadCache.preloadTimestamp = Date.now();
        }

        // 階段 2：在背景載入前後一個月（不阻塞，讓 UI 先顯示）
        // 使用 Promise.resolve().then() 讓它在背景執行
        const calendarTasksPromise = Promise.resolve().then(async () => {
          return this.preloadCalendarTasks();
        });

        // 不等待前後月載入完成，讓 UI 先顯示已載入的資料
        // 前後月會在背景載入，完成後自動更新緩存
        calendarTasksPromise
          .then((calendarTasks) => {
            if (calendarTasks) {
              this.preloadCache.calendarTasks = calendarTasks;
              this.preloadCache.preloadTimestamp = Date.now();
              this.notifyCalendarTasksListeners();
              // 同步完整任務到 widget
              widgetService.syncTodayTasks(calendarTasks).catch((error) => {
                console.error(
                  "❌ [DataPreload] Failed to sync full calendar tasks to widget:",
                  error,
                );
              });
            }
          })
          .catch((error) => {
            console.error(
              "❌ [DataPreload] Error loading adjacent months in background:",
              error,
            );
          });

        // 立即返回已載入的資料（今天的任務 + 當月任務）
        const calendarTasks = {
          ...todayTasks,
          ...currentMonthTasks,
        };

        // 更新緩存（先更新已載入的部分）
        this.preloadCache.calendarTasks = calendarTasks;
        this.preloadCache.preloadTimestamp = Date.now();
        this.notifyCalendarTasksListeners();

        const duration = Date.now() - startTime;
        console.log(
          `✅ [DataPreload] Priority data loaded in ${duration}ms (today + current month)`,
        );
        console.log(
          `⏳ [DataPreload] Adjacent months loading in background...`,
        );

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
        // 優先返回今天的任務，其次是當月任務
        const fallbackTasks =
          this.preloadCache.todayTasks ||
          this.preloadCache.currentMonthTasks ||
          null;
        return {
          userSettings: this.preloadCache.userSettings,
          userProfile: this.preloadCache.userProfile,
          calendarTasks: fallbackTasks,
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
   * 預載入今天的任務（階段 0：最高優先級）
   */
  static async preloadTodayTasks() {
    try {
      console.log(
        "🚀 [DataPreload] Stage 0: Loading today's tasks (highest priority)...",
      );
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");

      // 使用 getTasksForDate 取得今天的任務（更精確且快速）
      const todayTasksArray = await TaskService.getTasksForDate(todayStr);

      // 轉換為與其他方法一致的格式 { date: [tasks] }
      const todayTasks = {};
      if (todayTasksArray && todayTasksArray.length > 0) {
        todayTasks[todayStr] = todayTasksArray;
      }

      console.log(
        `✅ [DataPreload] Stage 0 completed: Today (${todayStr}) loaded with ${todayTasksArray.length} tasks`,
      );
      return todayTasks;
    } catch (error) {
      console.error("❌ [DataPreload] Error loading today's tasks:", error);
      return {};
    }
  }

  /**
   * 預載入當月任務（階段 1：次高優先級）
   */
  static async preloadCurrentMonthTasks() {
    try {
      console.log("🚀 [DataPreload] Stage 1: Loading current month...");
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const currentMonthStart = new Date(currentYear, currentMonth, 1);
      const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
      const currentMonthStartStr = format(currentMonthStart, "yyyy-MM-dd");
      const currentMonthEndStr = format(currentMonthEnd, "yyyy-MM-dd");

      const tasks = await TaskService.getTasksByDateRange(
        currentMonthStartStr,
        currentMonthEndStr,
      );

      console.log(
        `✅ [DataPreload] Stage 1 completed: Current month (${currentMonthStartStr} to ${currentMonthEndStr}) loaded`,
      );
      return tasks;
    } catch (error) {
      console.error(
        "❌ [DataPreload] Error loading current month tasks:",
        error,
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
        "📥 [DataPreload] Starting staged calendar tasks loading (Stage 2)...",
      );
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // 階段 2：並行載入前一個月和後一個月（當月已經在 Stage 1 載入完成）
      console.log(
        "🚀 [DataPreload] Stage 2: Loading previous and next month...",
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

      // 合併所有任務（今天的任務和當月任務已經在緩存中）
      const todayTasks = this.preloadCache.todayTasks || {};
      const currentMonthTasks = this.preloadCache.currentMonthTasks || {};
      const allTasks = {
        ...todayTasks,
        ...prevMonthTasks,
        ...currentMonthTasks,
        ...nextMonthTasks,
      };

      console.log(
        "✅ [DataPreload] Stage 2 completed: Previous and next month loaded",
      );

      // 階段 3：載入更遠的月份（可選，如果需要更多預載入）
      // 目前先不載入，因為前後一個月已經足夠

      console.log("✅ [DataPreload] All calendar tasks loaded");
      return allTasks;
    } catch (error) {
      console.error("❌ [DataPreload] Error loading calendar tasks:", error);
      // 即使出錯，也返回已載入的任務（優先今天的，其次是當月）
      return (
        this.preloadCache.todayTasks ||
        this.preloadCache.currentMonthTasks ||
        {}
      );
    }
  }

  /**
   * 通知所有訂閱者：calendarTasks 緩存已更新（例如背景前後月載入完成）
   */
  static notifyCalendarTasksListeners() {
    const tasks = this.preloadCache.calendarTasks;
    if (tasks && this.calendarTasksListeners.size > 0) {
      this.calendarTasksListeners.forEach((fn) => {
        try {
          fn(tasks);
        } catch (err) {
          console.error("❌ [DataPreload] Calendar tasks listener error:", err);
        }
      });
    }
  }

  /**
   * 訂閱 calendarTasks 緩存更新（用於日曆畫面在背景載入完成後合併前後月）
   */
  static addCalendarTasksListener(callback) {
    if (typeof callback === "function") {
      this.calendarTasksListeners.add(callback);
    }
  }

  /**
   * 取消訂閱
   */
  static removeCalendarTasksListener(callback) {
    this.calendarTasksListeners.delete(callback);
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
      todayTasks: null,
      currentMonthTasks: null,
    };
    console.log("🗑️ [DataPreload] Cache cleared");
  }

  /**
   * 獲取緩存的數據
   */
  static getCachedData() {
    // 優先返回完整的緩存（如果有 timestamp 且在有效期內）
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

    // 即使完整預載入還沒完成，也返回已載入的資料
    // 優先返回 userSettings（如果已載入）
    if (this.preloadCache.userSettings) {
      return {
        userSettings: this.preloadCache.userSettings,
        userProfile: this.preloadCache.userProfile,
        calendarTasks:
          this.preloadCache.todayTasks ||
          this.preloadCache.currentMonthTasks ||
          this.preloadCache.calendarTasks ||
          null,
      };
    }

    // 如果 userSettings 還沒載入，但任務已載入，也返回（但 userSettings 為 null）
    if (this.preloadCache.todayTasks || this.preloadCache.currentMonthTasks) {
      return {
        userSettings: this.preloadCache.userSettings,
        userProfile: this.preloadCache.userProfile,
        calendarTasks:
          this.preloadCache.todayTasks || this.preloadCache.currentMonthTasks,
      };
    }

    return null;
  }

  /**
   * 獲取今天的任務（優先級最高）
   */
  static getTodayTasks() {
    return this.preloadCache.todayTasks || null;
  }

  /**
   * 獲取當月任務（次高優先級）
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
