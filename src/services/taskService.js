import { supabase } from "../../supabaseClient";
import {
  TASK_FIELDS,
  validateTaskFields,
  createTaskObject,
  validateTaskCompleteness,
} from "../types/taskTypes";
import {
  scheduleTaskNotification,
  cancelTaskNotification,
} from "./notificationService";
import { UserService } from "./userService";

import { format } from "date-fns";

export class TaskService {
  // Get all tasks for a user
  static async getTasks() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.warn("No authenticated user found");
        return {};
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        return {};
      }

      // Group tasks by date
      const tasksByDate = {};
      data.forEach((task) => {
        if (!tasksByDate[task.date]) {
          tasksByDate[task.date] = [];
        }

        // 提取用戶顯示名稱
        const userDisplayName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User";

        tasksByDate[task.date].push({
          id: task.id,
          title: task.title,
          time: task.time,
          link: task.link,
          note: task.note,
          date: task.date,
          checked: task.is_completed || task.checked || false, // 支援新舊欄位
          is_completed: task.is_completed || task.checked || false,
          user: {
            id: user.id,
            email: user.email,
            displayName: userDisplayName,
            avatar: user.user_metadata?.avatar_url,
          },
        });
      });

      return tasksByDate;
    } catch (error) {
      console.error("Error in getTasks:", error);
      return {};
    }
  }

  // Get tasks for a specific date range
  static async getTasksByDateRange(startDate, endDate) {
    // Store dates in variables accessible in catch block
    const dateRange = { startDate, endDate };

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return {};
      }

      // 只選擇需要的欄位，減少數據傳輸量
      console.log(
        `📥 [TaskService] Fetching tasks for range: ${startDate} to ${endDate}`
      );

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, time, link, note, date, is_completed")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (data) {
        console.log(
          `✅ [TaskService] Received ${data.length} tasks from database`
        );
      }

      if (error) {
        console.error(
          "❌ [TaskService] Error fetching tasks for range:",
          startDate,
          "to",
          endDate
        );
        console.error("❌ [TaskService] Error details:", {
          code: error?.code || "UNKNOWN",
          message: error?.message || String(error) || "Unknown error",
          details: error?.details || null,
          hint: error?.hint || null,
          errorObject: error,
          startDate,
          endDate,
          userId: user?.id || "unknown",
        });
        return {};
      }

      // 預先提取用戶顯示名稱（只提取一次）
      const userDisplayName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";

      // Group tasks by date（優化：使用更高效的數據結構）
      const tasksByDate = {};
      if (data && data.length > 0) {
        data.forEach((task) => {
          const date = task.date;
          if (!tasksByDate[date]) {
            tasksByDate[date] = [];
          }

          tasksByDate[date].push({
            id: task.id,
            title: task.title,
            time: task.time,
            link: task.link,
            note: task.note,
            date: date,
            checked: task.is_completed || task.checked || false, // 支援新舊欄位
            is_completed: task.is_completed || task.checked || false,
            user: {
              id: user.id,
              email: user.email,
              displayName: userDisplayName,
              avatar: user.user_metadata?.avatar_url,
            },
          });
        });
      }

      return tasksByDate;
    } catch (error) {
      console.error("❌ [TaskService] Exception in getTasksByDateRange:", {
        message: error?.message || String(error) || "Unknown error",
        stack: error?.stack || null,
        name: error?.name || "Error",
        errorObject: error,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      return {};
    }
  }

  // Get tasks for a specific date
  static async getTasksForDate(date) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .order("time", { ascending: true });

      if (error) {
        console.error("Error fetching tasks for date:", error);
        return [];
      }

      return data.map((task) => {
        // 提取用戶顯示名稱
        const userDisplayName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User";

        return {
          id: task.id,
          title: task.title,
          time: task.time,
          link: task.link,
          note: task.note,
          date: task.date,
          checked: task.is_completed || task.checked || false, // 支援新舊欄位
          is_completed: task.is_completed || task.checked || false,
          user: {
            id: user.id,
            email: user.email,
            displayName: userDisplayName,
            avatar: user.user_metadata?.avatar_url,
          },
        };
      });
    } catch (error) {
      console.error("Error in getTasksForDate:", error);
      return [];
    }
  }

  // Add a new task
  static async addTask(task) {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user found");
      }

      // 提取用戶顯示名稱
      const userDisplayName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";

      // 使用安全的任務物件創建函數
      const taskData = {
        user_id: user.id,
        user_display_name: userDisplayName,
        title: task.title,
        time: task.time && task.time.trim() !== "" ? task.time : null, // 空字串轉為 null
        link: task.link && task.link.trim() !== "" ? task.link : null,
        note: task.note && task.note.trim() !== "" ? task.note : null,
        date: task.date,
        is_completed: task.is_completed || task.checked || false, // 支援舊的 checked 欄位
        completed_at: task.completed_at || null,
        // priority, description, tags, order_index 欄位已移除，因為介面上不使用
      };

      // 驗證任務完整性
      if (!validateTaskCompleteness(taskData)) {
        throw new Error("Task validation failed: missing required fields");
      }

      // 創建安全的任務物件
      const validatedFields = createTaskObject(taskData);

      const { data, error } = await supabase
        .from("tasks")
        .insert(validatedFields)
        .select()
        .single();

      if (error) {
        console.error("Error adding task:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      const taskResult = {
        id: data.id,
        title: data.title,
        time: data.time,
        link: data.link,
        note: data.note,
        date: data.date,
        checked: data.is_completed || data.checked || false, // 支援新舊欄位
        is_completed: data.is_completed || data.checked || false,
      };

      // 如果任務有時間設定，安排通知
      if (data.time && data.date) {
        try {
          const userSettings = await UserService.getUserSettings();
          // 如果 reminder_settings 不存在或 enabled 為 false，不安排通知
          const reminderSettings = userSettings.reminder_settings;

          // 只有在用戶啟用提醒時才安排通知
          if (reminderSettings && reminderSettings.enabled === true) {
            // 這裡不需要手動保存 notificationIds，因為我們現在使用確定性 ID
            await scheduleTaskNotification(
              taskResult,
              "Task Reminder", // 這裡可以根據語言設定調整
              null, // 使用用戶設定
              reminderSettings
            );
          } else {
            console.log(
              "Reminder notifications are disabled, skipping notification scheduling"
            );
          }
        } catch (error) {
          console.error("Error scheduling notification for new task:", error);
        }
      }

      return taskResult;
    } catch (error) {
      console.error("Error in addTask:", error);
      throw error;
    }
  }

  // Update a task
  static async updateTask(taskId, updates) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // 如果更新用戶相關信息，重新計算顯示名稱
      const userDisplayName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";

      // 清理更新資料，確保空字串轉為 null
      const cleanedUpdates = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim() === "") {
          cleanedUpdates[key] = null;
        } else {
          cleanedUpdates[key] = value;
        }
      });

      const updateData = {
        ...cleanedUpdates,
        user_display_name: userDisplayName,
      };

      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating task:", error);
        throw error;
      }

      const taskResult = {
        id: data.id,
        title: data.title,
        time: data.time,
        link: data.link,
        note: data.note,
        date: data.date,
        checked: data.is_completed || data.checked || false, // 支援新舊欄位
        is_completed: data.is_completed || data.checked || false,
      };

      // 如果任務時間被更新，重新安排通知
      // 只有在任務有時間時才處理通知（取消舊的並安排新的）
      if (
        (updates.time !== undefined || updates.date !== undefined) &&
        data.time &&
        data.date
      ) {
        try {
          const userSettings = await UserService.getUserSettings();
          // 如果 reminder_settings 不存在或 enabled 為 false，不安排通知
          const reminderSettings = userSettings.reminder_settings;

          // 1. 取消舊的通知 (使用 taskId)
          // 這會清除所有與此任務相關的通知，包括 "ghost" notifications
          await cancelTaskNotification(null, taskId);

          // 2. 只有在用戶啟用提醒時才安排新通知
          if (reminderSettings && reminderSettings.enabled === true) {
            await scheduleTaskNotification(
              taskResult,
              "Task Reminder",
              null,
              reminderSettings
            );
          } else {
            console.log(
              "Reminder notifications are disabled, skipping notification scheduling"
            );
          }
        } catch (error) {
          console.error("Error updating notifications for task:", error);
        }
      } else if (updates.time !== undefined && !data.time) {
        // 如果時間被移除（從有時間變成沒有時間），取消舊通知
        try {
          await cancelTaskNotification(null, taskId);
        } catch (error) {
          console.error("Error cancelling notifications for task:", error);
        }
      }

      return taskResult;
    } catch (error) {
      console.error("Error in updateTask:", error);
      throw error;
    }
  }

  // Delete a task
  static async deleteTask(taskId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting task:", error);
        throw error;
      }

      // 刪除任務時，取消所有相關通知
      try {
        await cancelTaskNotification(null, taskId);
      } catch (error) {
        console.error(
          "Error cancelling notifications for deleted task:",
          error
        );
      }

      return true;
    } catch (error) {
      console.error("Error in deleteTask:", error);
      throw error;
    }
  }

  // Toggle task completed status
  static async toggleTaskChecked(taskId, isCompleted) {
    try {
      // 如果任務完成，取消通知；如果未完成，updateTask 會重新安排（如果需要）
      // 但為了簡單起見，我們讓 updateTask 處理所有邏輯
      // 這裡我們只更新狀態
      return await this.updateTask(taskId, {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      });
    } catch (error) {
      console.error("Error in toggleTaskChecked:", error);
      throw error;
    }
  }

  // Move task to different date
  static async moveTask(taskId, newDate) {
    try {
      return await this.updateTask(taskId, { date: newDate });
    } catch (error) {
      console.error("Error in moveTask:", error);
      throw error;
    }
  }
}
