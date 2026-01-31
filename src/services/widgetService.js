import { Platform, NativeModules } from "react-native";
import SharedGroupPreferences from "react-native-shared-group-preferences";

/**
 * Widget Sync Service
 * Syncs today's tasks to iOS widget using App Groups
 */
class WidgetService {
  constructor() {
    this.appGroupIdentifier = "group.com.cty0305.too.doo.list.data";
    this.widgetDataKey = "todayTasks";
    this.syncTimeout = null;
    this.lastSyncTime = 0;
    this.pendingSyncData = null;
    this.SYNC_DEBOUNCE_MS = 300; // 300ms 防抖延遲
  }

  /**
   * Sync tasks to widget (Today + Next 7 Days)
   * @param {Object} tasks - Tasks object with date keys
   */
  async syncTodayTasks(tasks) {
    // Only sync on iOS
    if (Platform.OS !== "ios") {
      return;
    }

    // 保存最新的數據
    this.pendingSyncData = tasks;

    // 清除之前的定時器
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // 如果距離上次同步時間很短，使用防抖
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    if (timeSinceLastSync < this.SYNC_DEBOUNCE_MS) {
      // 設置新的定時器
      this.syncTimeout = setTimeout(() => {
        this._performSync(this.pendingSyncData);
      }, this.SYNC_DEBOUNCE_MS - timeSinceLastSync);
      return;
    }

    // 立即執行同步
    return this._performSync(tasks);
  }

  /**
   * 實際執行同步操作
   * @private
   */
  async _performSync(tasks) {
    // 清除定時器
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    // 更新最後同步時間
    this.lastSyncTime = Date.now();
    this.pendingSyncData = null;

    try {
      const widgetData = {};
      const today = new Date();

      // Process Today + Next 7 Days
      for (let i = 0; i < 8; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateKey = `${year}-${month}-${day}`;

        const dayTasks = tasks[dateKey] || [];

        // Format for widget - include all tasks (completed and uncompleted)
        const formattedTasks = dayTasks
          .map((task) => ({
            id: task.id,
            title: task.title,
            time: task.time || "",
            completed: task.checked || task.is_completed || false,
          }))
          .sort((a, b) => {
            // Sort completed tasks to the bottom
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1;
            }
            // Sort uncompleted tasks by time
            return (a.time || "").localeCompare(b.time || "");
          });

        widgetData[dateKey] = formattedTasks;
      }

      // Debug: Log today's tasks (only log if tasks changed significantly)
      const todayKey = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const todayTasks = widgetData[todayKey] || [];

      // Convert to JSON string
      const tasksJson = JSON.stringify(widgetData);

      // Reload widget timeline using native module (atomic write + reload)
      if (Platform.OS === "ios") {
        try {
          const { WidgetReloader } = NativeModules;
          if (WidgetReloader && WidgetReloader.reloadWidgetWithData) {
            WidgetReloader.reloadWidgetWithData(tasksJson);
            // 只在有任務時才 log
            if (todayTasks.length > 0) {
              console.log(
                `✅ [Widget] Synced ${todayTasks.length} tasks for today`
              );
            }
          } else {
            // Fallback for older native module version
            console.warn(
              "⚠️ [Widget] Native reloadWidgetWithData not found, falling back to old method"
            );
            console.warn(
              `⚠️ [Widget] WidgetReloader available: ${!!WidgetReloader}`
            );
            // Check if SharedGroupPreferences is available (not available in Expo Go)
            if (SharedGroupPreferences && SharedGroupPreferences.setItem) {
              await SharedGroupPreferences.setItem(
                "widgetTasksByDate", // Use correct key to match Swift code
                tasksJson,
                this.appGroupIdentifier
              );
              if (WidgetReloader) {
                WidgetReloader.reloadAllWidgets();
              }
            } else {
              console.warn(
                "⚠️ [Widget] SharedGroupPreferences not available (Expo Go environment)"
              );
            }
          }
        } catch (error) {
          console.error("❌ [Widget] Failed to reload widget:", error);
          console.error(
            "❌ [Widget] Error details:",
            error.message,
            error.stack
          );
        }
      }
    } catch (error) {
      console.error("❌ [Widget] Failed to sync tasks:", error);
    }
  }

  /**
   * Clear widget data
   */
  async clearWidgetData() {
    if (Platform.OS !== "ios") {
      return;
    }

    try {
      // Check if SharedGroupPreferences is available (not available in Expo Go)
      if (SharedGroupPreferences && SharedGroupPreferences.setItem) {
        await SharedGroupPreferences.setItem(
          this.widgetDataKey,
          JSON.stringify([]),
          this.appGroupIdentifier
        );
        console.log("✅ [Widget] Cleared widget data");
      } else {
        console.warn(
          "⚠️ [Widget] SharedGroupPreferences not available (Expo Go environment)"
        );
      }
    } catch (error) {
      console.error("❌ [Widget] Failed to clear data:", error);
    }
  }
}

// Export singleton
export const widgetService = new WidgetService();
