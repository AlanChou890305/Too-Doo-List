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
  }

  /**
   * Sync today's tasks to widget
   * @param {Object} tasks - Tasks object with date keys
   */
  async syncTodayTasks(tasks) {
    // Only sync on iOS
    if (Platform.OS !== "ios") {
      return;
    }

    try {
      // Get today's date in YYYY-MM-DD format (Local Time)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      // Get today's tasks
      const todayTasks = tasks[dateKey] || [];

      // Format for widget
      const widgetTasks = todayTasks
        .map((task) => ({
          id: task.id,
          title: task.title,
          time: task.time || "",
          completed: task.checked || task.is_completed || false,
        }))
        .sort((a, b) => {
          // Sort completed tasks to the bottom (same as app)
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          // Sort uncompleted tasks by time
          return (a.time || "").localeCompare(b.time || "");
        });

      console.log(`📱 [Widget Service] Syncing ${widgetTasks.length} tasks (sorted):`);
      widgetTasks.forEach((task, index) => {
        const status = task.completed ? "✅" : "⭕";
        console.log(`  ${status} Task ${index + 1}: "${task.title}", Time: "${task.time}", Completed: ${task.completed}`);
      });

      // Convert to JSON string
      const tasksJson = JSON.stringify(widgetTasks);
      console.log(`📱 [Widget Service] JSON data:`, tasksJson);

      // Reload widget timeline using native module (atomic write + reload)
      if (Platform.OS === "ios") {
        try {
          const { WidgetReloader } = NativeModules;
          if (WidgetReloader && WidgetReloader.reloadWidgetWithData) {
            WidgetReloader.reloadWidgetWithData(tasksJson);
            console.log(`✅ [Widget] Synced ${widgetTasks.length} tasks via native module`);
          } else {
            // Fallback for older native module version (should not happen if rebuilt)
            console.warn("⚠️ [Widget] Native reloadWidgetWithData not found, falling back to old method");
            await SharedGroupPreferences.setItem(
              this.widgetDataKey,
              tasksJson,
              this.appGroupIdentifier
            );
            if (WidgetReloader) {
               WidgetReloader.reloadAllWidgets();
            }
          }
        } catch (error) {
          console.error("❌ [Widget] Failed to reload widget:", error);
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
      await SharedGroupPreferences.setItem(
        this.widgetDataKey,
        JSON.stringify([]),
        this.appGroupIdentifier
      );
      console.log("✅ [Widget] Cleared widget data");
    } catch (error) {
      console.error("❌ [Widget] Failed to clear data:", error);
    }
  }
}

// Export singleton
export const widgetService = new WidgetService();
