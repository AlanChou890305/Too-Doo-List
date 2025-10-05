import { supabase } from '../../supabaseClient';

export class TaskService {
  // Get all tasks for a user
  static async getTasks() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user found');
        return {};
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        return {};
      }

      // Group tasks by date
      const tasksByDate = {};
      data.forEach(task => {
        if (!tasksByDate[task.date]) {
          tasksByDate[task.date] = [];
        }
        tasksByDate[task.date].push({
          id: task.id,
          text: task.text,
          time: task.time,
          date: task.date,
          checked: task.checked
        });
      });

      return tasksByDate;
    } catch (error) {
      console.error('Error in getTasks:', error);
      return {};
    }
  }

  // Get tasks for a specific date
  static async getTasksForDate(date) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching tasks for date:', error);
        return [];
      }

      return data.map(task => ({
        id: task.id,
        text: task.text,
        time: task.time,
        date: task.date,
        checked: task.checked
      }));
    } catch (error) {
      console.error('Error in getTasksForDate:', error);
      return [];
    }
  }

  // Add a new task
  static async addTask(task) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          text: task.text,
          time: task.time || null,
          date: task.date,
          checked: task.checked || false
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        throw error;
      }

      return {
        id: data.id,
        text: data.text,
        time: data.time,
        date: data.date,
        checked: data.checked
      };
    } catch (error) {
      console.error('Error in addTask:', error);
      throw error;
    }
  }

  // Update a task
  static async updateTask(taskId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }

      return {
        id: data.id,
        text: data.text,
        time: data.time,
        date: data.date,
        checked: data.checked
      };
    } catch (error) {
      console.error('Error in updateTask:', error);
      throw error;
    }
  }

  // Delete a task
  static async deleteTask(taskId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw error;
    }
  }

  // Toggle task checked status
  static async toggleTaskChecked(taskId, checked) {
    try {
      return await this.updateTask(taskId, { checked });
    } catch (error) {
      console.error('Error in toggleTaskChecked:', error);
      throw error;
    }
  }

  // Move task to different date
  static async moveTask(taskId, newDate) {
    try {
      return await this.updateTask(taskId, { date: newDate });
    } catch (error) {
      console.error('Error in moveTask:', error);
      throw error;
    }
  }
}

