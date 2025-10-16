import { supabase } from "../../supabaseClient";
import { Platform } from "react-native";

export class UserService {
  // Get user settings
  static async getUserSettings() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.warn("No authenticated user found");
        return {
          language: "en",
          theme: "light",
          notifications_enabled: true,
        };
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If user_settings doesn't exist, create it with defaults
        if (error.code === 'PGRST116') {
          console.log("📝 Creating default user settings for new user");
          const defaultSettings = {
            language: "en",
            theme: "light",
            notifications_enabled: true,
          };
          
          try {
            const { data: newData, error: createError } = await supabase
              .from("user_settings")
              .insert({
                user_id: user.id,
                ...defaultSettings,
                platform: Platform.OS,
                user_agent: this.getUserAgent(),
              })
              .select()
              .single();
            
            if (createError) {
              console.error("Error creating user settings:", createError);
              return defaultSettings;
            }
            
            console.log("✅ Default user settings created");
            return {
              language: newData.language || "en",
              theme: newData.theme || "light",
              notifications_enabled: newData.notifications_enabled !== false,
              display_name: newData.display_name,
              platform: newData.platform,
              last_active_at: newData.last_active_at,
            };
          } catch (insertError) {
            console.error("Error inserting user settings:", insertError);
            return defaultSettings;
          }
        }
        
        console.error("Error fetching user settings:", error);
        // Return default settings if other error
        return {
          language: "en",
          theme: "light",
          notifications_enabled: true,
        };
      }

      return {
        language: data.language || "en",
        theme: data.theme || "light",
        notifications_enabled: data.notifications_enabled !== false,
        display_name: data.display_name,
        platform: data.platform,
        last_active_at: data.last_active_at,
      };
    } catch (error) {
      console.error("Error in getUserSettings:", error);
      return {
        language: "en",
        theme: "light",
        notifications_enabled: true,
        display_name: null,
        platform: Platform.OS,
        last_active_at: null,
      };
    }
  }

  // Update user settings
  static async updateUserSettings(settings) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // 自動添加平台資訊
      const settingsWithPlatform = {
        ...settings,
        platform: Platform.OS,
        user_agent: this.getUserAgent(),
      };

      const { data, error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          ...settingsWithPlatform,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error("Error updating user settings:", error);
        throw error;
      }

      return {
        language: data.language,
        theme: data.theme,
        notifications_enabled: data.notifications_enabled,
        display_name: data.display_name,
        platform: data.platform,
        last_active_at: data.last_active_at,
      };
    } catch (error) {
      console.error("Error in updateUserSettings:", error);
      throw error;
    }
  }

  // Get user agent string for platform detection
  static getUserAgent() {
    if (Platform.OS === "web") {
      return typeof window !== "undefined"
        ? window.navigator.userAgent
        : "Web Browser";
    } else if (Platform.OS === "ios") {
      return `iOS App - ${Platform.Version}`;
    } else if (Platform.OS === "android") {
      return `Android App - ${Platform.Version}`;
    }
    return `${Platform.OS} App`;
  }

  // Get user profile information
  static async getUserProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
      };
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  }

  // Get user settings with authentication info (direct from user_settings table)
  static async getUserSettingsWithAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.warn("No authenticated user found");
        return null;
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user settings with auth:", error);
        return null;
      }

      return {
        // User settings
        id: data.id,
        user_id: data.user_id,
        language: data.language || "en",
        theme: data.theme || "light",
        notifications_enabled: data.notifications_enabled !== false,
        platform: data.platform,
        user_agent: data.user_agent,
        last_active_at: data.last_active_at,
        created_at: data.created_at,
        updated_at: data.updated_at,

        // Auth info (from current user)
        display_name: data.display_name,
        email: user.email,
        auth_created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      };
    } catch (error) {
      console.error("Error in getUserSettingsWithAuth:", error);
      return null;
    }
  }

  // Update platform info when user opens the app
  static async updatePlatformInfo() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // 先確保 user_settings 記錄存在
      await this.getUserSettings();

      // 更新平台資訊和最後活動時間
      const { error } = await supabase
        .from("user_settings")
        .update({
          platform: Platform.OS,
          user_agent: this.getUserAgent(),
          last_active_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error("Error updating platform info:", error);
        return;
      }

      console.log(`📱 Platform info updated: ${Platform.OS}`);
    } catch (error) {
      console.error("Error updating platform info:", error);
    }
  }
}
