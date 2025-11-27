import { supabase } from "../../supabaseClient";
import { Platform } from "react-native";
import { getSupabaseConfig } from "../config/environment";

export class UserService {
  static cachedAuthUser = null;
  static cachedAuthUserUpdatedAt = null;

  static normalizeAuthUser(user) {
    if (!user || !user.id || !user.email) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata || {},
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };
  }

  static setCachedAuthUser(user) {
    const normalized = UserService.normalizeAuthUser(user);
    if (normalized) {
      UserService.cachedAuthUser = normalized;
      UserService.cachedAuthUserUpdatedAt = Date.now();
    }
  }

  static clearCachedAuthUser() {
    UserService.cachedAuthUser = null;
    UserService.cachedAuthUserUpdatedAt = null;
  }

  static getCachedAuthUser(maxAgeMs = 5 * 60 * 1000) {
    if (
      UserService.cachedAuthUser &&
      UserService.cachedAuthUser.id &&
      UserService.cachedAuthUser.email
    ) {
      if (!UserService.cachedAuthUserUpdatedAt) {
        return UserService.cachedAuthUser;
      }
      const age = Date.now() - UserService.cachedAuthUserUpdatedAt;
      if (age <= maxAgeMs) {
        return UserService.cachedAuthUser;
      }
    }
    return null;
  }

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
        if (error.code === "PGRST116") {
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
              platform: newData.platform,
              last_active_at: newData.last_active_at,
              display_name: newData.display_name,
              reminder_settings: newData.reminder_settings,
              email_preferences: newData.email_preferences || {
                product_updates: true,
                marketing: false,
              },
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
        platform: data.platform,
        last_active_at: data.last_active_at,
        display_name: data.display_name,
        reminder_settings: data.reminder_settings,
        email_preferences: data.email_preferences || {
          product_updates: true,
          marketing: false,
        },
      };
    } catch (error) {
      console.error("Error in getUserSettings:", error);
      return {
        language: "en",
        theme: "light",
        notifications_enabled: true,
        platform: Platform.OS,
        last_active_at: null,
        reminder_settings: { enabled: true, times: [30, 10] },
        email_preferences: { product_updates: true, marketing: false },
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

      // 自動添加平台資訊和最後活動時間
      const settingsWithPlatform = {
        ...settings,
        platform: Platform.OS,
        last_active_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            ...settingsWithPlatform,
          },
          {
            onConflict: "user_id",
          }
        )
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
        platform: data.platform,
        last_active_at: data.last_active_at,
        display_name: data.display_name,
        reminder_settings: data.reminder_settings,
        email_preferences: data.email_preferences,
      };
    } catch (error) {
      console.error("Error in updateUserSettings:", error);
      throw error;
    }
  }

  // Fetch authenticated user with retries, ensuring email and id are available
  static async fetchAuthUserWithRetry(
    maxRetries = 3,
    delayMs = 500,
    timeoutMs = 2500
  ) {
    const cachedUser = UserService.getCachedAuthUser();
    if (cachedUser) {
      console.log(
        "[fetchAuthUserWithRetry] Returning cached auth user:",
        cachedUser.email
      );
      return cachedUser;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[fetchAuthUserWithRetry] Calling getUser() (attempt ${attempt}/${maxRetries})`
        );

        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `[fetchAuthUserWithRetry] getUser() timeout after ${timeoutMs}ms`
                )
              ),
            timeoutMs
          )
        );

        const { data, error } = await Promise.race([
          getUserPromise,
          timeoutPromise,
        ]);

        const user = data?.user;

        if (error) {
          console.warn(
            `[fetchAuthUserWithRetry] getUser() error (attempt ${attempt}/${maxRetries}):`,
            error
          );
        } else if (!user) {
          console.warn(
            `[fetchAuthUserWithRetry] getUser() returned no user (attempt ${attempt}/${maxRetries})`
          );
        } else if (user?.email && user?.id) {
          UserService.setCachedAuthUser(user);
          console.log(
            `[fetchAuthUserWithRetry] ✅ Success with user ${user.email} (attempt ${attempt}/${maxRetries})`
          );
          return UserService.getCachedAuthUser();
        } else {
          console.warn(
            `[fetchAuthUserWithRetry] getUser() returned incomplete user (attempt ${attempt}/${maxRetries}):`,
            {
              hasUser: !!user,
              hasEmail: !!user?.email,
              hasId: !!user?.id,
            }
          );
        }
      } catch (error) {
        console.warn(
          `[fetchAuthUserWithRetry] Exception in getUser() (attempt ${attempt}/${maxRetries}):`,
          error
        );
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.warn("[fetchAuthUserWithRetry] Failed to get authenticated user");
    return null;
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

      // Get provider from app_metadata or identities
      const provider = user.app_metadata?.provider || 
                      user.identities?.[0]?.provider || 
                      "unknown";

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
        provider: provider,
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
        last_active_at: data.last_active_at,
        created_at: data.created_at,
        updated_at: data.updated_at,

        // Auth info (from current user)
        display_name:
          user.user_metadata?.name || user.email?.split("@")[0] || "User",
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
          last_active_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating platform info:", error);
        return;
      }

      console.log(`📱 Platform updated: ${Platform.OS}`);
    } catch (error) {
      console.error("Error updating platform info:", error);
    }
  }

  // Delete user account
  static async deleteUser() {
    try {
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("No active session found");
      }

      // Get Supabase URL from environment config
      const supabaseConfig = getSupabaseConfig();
      const supabaseUrl = supabaseConfig?.url;
      if (!supabaseUrl) {
        throw new Error("Supabase URL not configured");
      }

      // Call the delete-user edge function
      const response = await fetch(
        `${supabaseUrl}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user account");
      }

      // Clear cached user
      UserService.clearCachedAuthUser();

      // Sign out after successful deletion
      await supabase.auth.signOut();

      return { success: true, message: data.message || "Account deleted successfully" };
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  }
}
