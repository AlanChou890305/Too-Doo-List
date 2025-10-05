import { supabase } from '../../supabaseClient';

export class UserService {
  // Get user settings
  static async getUserSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user found');
        return {
          language: 'en',
          theme: 'light',
          notifications_enabled: true
        };
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user settings:', error);
        // Return default settings if not found
        return {
          language: 'en',
          theme: 'light',
          notifications_enabled: true
        };
      }

      return {
        language: data.language || 'en',
        theme: data.theme || 'light',
        notifications_enabled: data.notifications_enabled !== false
      };
    } catch (error) {
      console.error('Error in getUserSettings:', error);
      return {
        language: 'en',
        theme: 'light',
        notifications_enabled: true
      };
    }
  }

  // Update user settings
  static async updateUserSettings(settings) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating user settings:', error);
        throw error;
      }

      return {
        language: data.language,
        theme: data.theme,
        notifications_enabled: data.notifications_enabled
      };
    } catch (error) {
      console.error('Error in updateUserSettings:', error);
      throw error;
    }
  }

  // Get user profile information
  static async getUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }
}

