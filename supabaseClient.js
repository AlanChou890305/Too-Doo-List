import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Supabase configuration - try multiple sources for environment variables
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables - but don't crash the app
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Missing required environment variables:",
    "EXPO_PUBLIC_SUPABASE_URL:",
    supabaseUrl ? "✓" : "✗",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "✓" : "✗"
  );
  console.error(
    "⚠️ WARNING: App will continue with limited functionality. " +
      "Please check your environment configuration in eas.json and app.config.js"
  );
  // Continue without throwing - this prevents SIGABRT crash
}

// Create a custom storage handler for React Native
const createStorage = () => {
  return {
    getItem: async (key) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.error("Error getting item from storage:", error);
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error("Error setting item in storage:", error);
      }
    },
    removeItem: async (key) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error("Error removing item from storage:", error);
      }
    },
  };
};

// Common configuration
const commonConfig = {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    flowType: "pkce",
    storage: Platform.OS === "web" ? window.localStorage : createStorage(),
  },
};

// Validate Supabase configuration
// Log successful configuration

// Initialize Supabase client with safe fallback
let supabase;
try {
  // Use fallback values if environment variables are missing (should not happen in production)
  const url = supabaseUrl || "https://placeholder.supabase.co";
  const key = supabaseAnonKey || "placeholder-key";

  supabase = createClient(url, key, commonConfig);

  // Log successful initialization
  if (supabaseUrl && supabaseAnonKey) {
    console.log("✅ Supabase client initialized successfully");
  } else {
    console.warn(
      "⚠️ Supabase client initialized with placeholder values - limited functionality"
    );
  }
} catch (error) {
  console.error("❌ Failed to initialize Supabase client:", error);
  // Create a minimal mock client to prevent crashes
  supabase = {
    auth: {
      signInWithOAuth: async () => ({
        data: null,
        error: new Error("Supabase not configured"),
      }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({
        data: null,
        error: new Error("Supabase not configured"),
      }),
      update: () => ({
        data: null,
        error: new Error("Supabase not configured"),
      }),
      delete: () => ({
        data: null,
        error: new Error("Supabase not configured"),
      }),
    }),
  };
}

// Handle deep links when the app is opened from a redirect
const handleOpenURL = async (event) => {
  console.log("Deep link received:", event.url);

  // Check if this is a Supabase auth callback
  if (
    event.url.includes("access_token=") ||
    event.url.includes("code=") ||
    event.url.includes("error=")
  ) {
    try {
      // Extract the URL parameters
      const url = new URL(event.url);

      // Try hash parameters first (direct token flow)
      let params = new URLSearchParams(url.hash.substring(1));

      // If no hash parameters, try query parameters (PKCE flow)
      if (!params.get("access_token") && !params.get("code")) {
        params = new URLSearchParams(url.search);
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const code = params.get("code");
      const error = params.get("error");

      console.log("Auth params:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasCode: !!code,
        hasError: !!error,
      });

      if (error) {
        console.error(
          "OAuth error from callback:",
          error,
          params.get("error_description")
        );
        return;
      }

      if (accessToken && refreshToken) {
        // Direct token flow
        console.log("Setting session with tokens from deep link");
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error("Error setting session:", sessionError);
        } else {
          console.log("Session set successfully");
        }
      } else if (code) {
        // PKCE flow - exchange code for tokens
        console.log("Exchanging authorization code for tokens");
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Error exchanging code for session:", exchangeError);
        } else {
          console.log("✅ Code exchanged successfully!");

          // Wait a moment for session to be fully established
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Force auth state check to trigger navigation
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (!sessionError && session) {
            console.log("✅ Session confirmed after code exchange");
            console.log("Session user:", session.user?.email);

            // Force trigger auth state change event to ensure navigation
            // This will trigger the onAuthStateChange listener in App.js
            console.log(
              "🔔 Manually triggering auth refresh to ensure listeners fire..."
            );

            // Refresh the session to trigger all auth state listeners
            await supabase.auth.refreshSession();

            // For web platform, also dispatch custom event
            if (Platform.OS === "web" && typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("supabase-auth-success", {
                  detail: { session },
                })
              );
            }

            console.log("✅ Auth state notifications sent");
          } else {
            console.error("❌ No session found after code exchange");
          }
        }
      }
    } catch (error) {
      console.error("Error handling auth callback:", error);
    }
  }
};

// Initialize subscription variable at the top level
let subscription;

// For OAuth with Expo
const setupDeepLinking = () => {
  if (Platform.OS !== "web") {
    // Handle the initial URL in case the app was launched from a deep link
    const processInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleOpenURL({ url: initialUrl });
        }
      } catch (error) {
        console.error("Error processing initial URL:", error);
      }
    };

    // Process any initial URL
    processInitialURL();

    // Listen for deep links when the app is opened from a URL
    subscription = Linking.addEventListener("url", handleOpenURL);

    // Cleanup function to remove the event listener
    const cleanup = () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      } else {
        // Fallback for older versions of React Native
        Linking.removeEventListener("url", handleOpenURL);
      }
    };

    return cleanup;
  }

  // Return a no-op cleanup function for web
  return () => {};
};

// Set up deep linking and get cleanup function
const cleanupDeepLinking = setupDeepLinking();

// Clean up event listener
const cleanupAuthListeners = () => {
  if (Platform.OS !== "web" && subscription?.remove) {
    subscription.remove();
  } else if (Platform.OS === "web") {
    window.removeEventListener("url", handleOpenURL);
    window.removeEventListener("beforeunload", cleanupAuthListeners);
  }
};

if (Platform.OS === "web") {
  window.addEventListener("beforeunload", cleanupAuthListeners);
}

// Export the supabase client and cleanup function
export { supabase, cleanupAuthListeners };
