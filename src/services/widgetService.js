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
   * Sync tasks to widget (Today + Next 7 Days)
   * @param {Object} tasks - Tasks object with date keys
   */
  async syncTodayTasks(tasks) {
    // Only sync on iOS
    if (Platform.OS !== "ios") {
      return;
    }

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

      console.log(`📱 [Widget Service] Syncing tasks for 8 days`);
      
      // Debug: Log today's tasks
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const todayTasks = widgetData[todayKey] || [];
      console.log(`📱 [Widget Service] Today (${todayKey}) has ${todayTasks.length} tasks:`, todayTasks.map(t => t.title));

      // Convert to JSON string
      const tasksJson = JSON.stringify(widgetData);
      console.log(`📱 [Widget Service] JSON length: ${tasksJson.length} chars`);
      
      // Reload widget timeline using native module (atomic write + reload)
      if (Platform.OS === "ios") {
        try {
          const { WidgetReloader } = NativeModules;
          if (WidgetReloader && WidgetReloader.reloadWidgetWithData) {
            console.log(`📱 [Widget Service] Calling native reloadWidgetWithData`);
            WidgetReloader.reloadWidgetWithData(tasksJson);
            console.log(`✅ [Widget] Synced multi-day data via native module`);
          } else {
            // Fallback for older native module version
            console.warn("⚠️ [Widget] Native reloadWidgetWithData not found, falling back to old method");
            console.warn(`⚠️ [Widget] WidgetReloader available: ${!!WidgetReloader}`);
            await SharedGroupPreferences.setItem(
              "widgetTasksByDate", // Use correct key to match Swift code
              tasksJson,
              this.appGroupIdentifier
            );
            if (WidgetReloader) {
               WidgetReloader.reloadAllWidgets();
            }
          }
        } catch (error) {
          console.error("❌ [Widget] Failed to reload widget:", error);
          console.error("❌ [Widget] Error details:", error.message, error.stack);
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
