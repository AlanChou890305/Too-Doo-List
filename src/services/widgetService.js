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
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const dateKey = today.toISOString().split("T")[0];

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

      // Write to App Group
      await SharedGroupPreferences.setItem(
        this.widgetDataKey,
        tasksJson,
        this.appGroupIdentifier
      );

      // Reload widget timeline
      if (Platform.OS === "ios") {
        try {
          const { WidgetReloader } = NativeModules;
          if (WidgetReloader) {
            WidgetReloader.reloadAllWidgets();
            console.log(`✅ [Widget] Synced ${widgetTasks.length} tasks and reloaded widget`);
          } else {
            console.log(`✅ [Widget] Synced ${widgetTasks.length} tasks (reload module not available)`);
          }
        } catch (error) {
          console.error("❌ [Widget] Failed to reload widget:", error);
          console.log(`✅ [Widget] Synced ${widgetTasks.length} tasks (reload failed)`);
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
