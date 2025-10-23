import { supabase } from "../../supabaseClient";
import {
  TASK_FIELDS,
  validateTaskFields,
  createTaskObject,
  validateTaskCompleteness,
} from "../types/taskTypes";
import { scheduleTaskNotification } from "./notificationService";
import { UserService } from "./userService";

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
        .order("order_index", { ascending: true });

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
        priority: task.priority || "medium",
        description:
          task.description && task.description.trim() !== ""
            ? task.description
            : null,
        tags: task.tags || [],
        order_index: task.order_index || 0,
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
          const reminderSettings = userSettings.reminder_settings || {
            enabled: true,
            times: [30, 10],
          };

          const notificationIds = await scheduleTaskNotification(
            taskResult,
            "Task Reminder", // 這裡可以根據語言設定調整
            null, // 使用用戶設定
            reminderSettings
          );

          // 更新任務的通知ID
          if (notificationIds.length > 0) {
            await this.updateTask(data.id, { notificationIds });
            taskResult.notificationIds = notificationIds;
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
      if (updates.time !== undefined || updates.date !== undefined) {
        try {
          const userSettings = await UserService.getUserSettings();
          const reminderSettings = userSettings.reminder_settings || {
            enabled: true,
            times: [30, 10],
          };

          // 取消舊的通知
          if (data.notificationIds && Array.isArray(data.notificationIds)) {
            const { cancelTaskNotification } = await import(
              "./notificationService"
            );
            await cancelTaskNotification(data.notificationIds);
          }

          // 如果新時間存在，安排新通知
          if (data.time && data.date) {
            const notificationIds = await scheduleTaskNotification(
              taskResult,
              "Task Reminder",
              null,
              reminderSettings
            );

            if (notificationIds.length > 0) {
              await this.updateTask(data.id, { notificationIds });
              taskResult.notificationIds = notificationIds;
            }
          }
        } catch (error) {
          console.error("Error updating notifications for task:", error);
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

      return true;
    } catch (error) {
      console.error("Error in deleteTask:", error);
      throw error;
    }
  }

  // Toggle task completed status
  static async toggleTaskChecked(taskId, isCompleted) {
    try {
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
