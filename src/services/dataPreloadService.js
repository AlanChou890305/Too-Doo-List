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

        // 並行載入所有數據
        const [userSettings, userProfile, calendarTasks] = await Promise.all([
          this.preloadUserSettings(),
          this.preloadUserProfile(),
          this.preloadCalendarTasks(),
        ]);

        // 更新緩存
        this.preloadCache = {
          userSettings,
          userProfile,
          calendarTasks,
          preloadTimestamp: Date.now(),
        };

        // 同步到 widget
        if (calendarTasks) {
          try {
            await widgetService.syncTodayTasks(calendarTasks);
            console.log("✅ [DataPreload] Widget data synced");
          } catch (error) {
            console.error("❌ [DataPreload] Failed to sync widget:", error);
          }
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
        
        // 重置標記
        this.isPreloading = false;
        this.preloadPromise = null;
        
        return {
          userSettings: null,
          userProfile: null,
          calendarTasks: null,
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
   * 預載入日曆任務（當前月份及前後各一個月）
   */
  static async preloadCalendarTasks() {
    try {
      console.log("📥 [DataPreload] Loading calendar tasks...");
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // 載入前一個月、當前月、後一個月的任務
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth + 2, 0);

      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const tasks = await TaskService.getTasksByDateRange(
        startDateStr,
        endDateStr
      );

      console.log("✅ [DataPreload] Calendar tasks loaded");
      return tasks;
    } catch (error) {
      console.error("❌ [DataPreload] Error loading calendar tasks:", error);
      return null;
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
    return null;
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

