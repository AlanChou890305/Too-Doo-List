import { supabase } from "../../supabaseClient";
import {
  TASK_FIELDS,
  validateTaskFields,
  createTaskObject,
  validateTaskCompleteness,
} from "../types/taskTypes";

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
          date: task.date,
          checked: task.checked,
          user: {
            id: user.id,
            email: user.email,
            displayName: userDisplayName,
            avatar: user.user_metadata?.avatar_url,
          },
          category_details: null, // Categories not available due to missing relationship
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
          date: task.date,
          checked: task.checked,
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

      console.log("AddTask - User:", user);
      console.log("AddTask - Auth Error:", authError);

      if (!user) {
        throw new Error("No authenticated user found");
      }

      console.log("AddTask - Inserting task:", {
        user_id: user.id,
        title: task.title,
        time: task.time || null,
        link: task.link || null,
        date: task.date,
        checked: task.checked || false,
      });

      // 提取用戶顯示名稱
      const userDisplayName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";

      console.log("AddTask - User details:", {
        userId: user.id,
        userEmail: user.email,
        userName: user.user_metadata?.name,
        userAvatar: user.user_metadata?.avatar_url,
        userDisplayName: userDisplayName,
      });

      // 使用安全的任務物件創建函數
      const taskData = {
        user_id: user.id,
        user_display_name: userDisplayName,
        title: task.title,
        time: task.time || null,
        link: task.link || null,
        date: task.date,
        checked: task.checked || false,
        priority: task.priority || "medium",
        category: task.category || null,
        description: task.description || null,
        due_time: task.due_time || null,
        is_completed: task.is_completed || false,
        completed_at: task.completed_at || null,
        tags: task.tags || [],
        order_index: task.order_index || 0,
      };

      // 驗證任務完整性
      if (!validateTaskCompleteness(taskData)) {
        throw new Error("Task validation failed: missing required fields");
      }

      // 創建安全的任務物件
      const validatedFields = createTaskObject(taskData);
      console.log("✅ Inserting task with validated fields:", validatedFields);

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

      console.log("Task added successfully:", data);
      return {
        id: data.id,
        title: data.title,
        time: data.time,
        link: data.link,
        date: data.date,
        checked: data.checked,
      };
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

      const updateData = {
        ...updates,
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

      return {
        id: data.id,
        title: data.title,
        time: data.time,
        link: data.link,
        date: data.date,
        checked: data.checked,
      };
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

  // Toggle task checked status
  static async toggleTaskChecked(taskId, checked) {
    try {
      return await this.updateTask(taskId, { checked });
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
