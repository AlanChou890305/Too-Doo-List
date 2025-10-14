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
  console.log("🔗 ========================================");
  console.log("🔗 [Deep Link] Received URL:", event.url);
  console.log("🔗 ========================================");

  // Check if this is a Supabase auth callback
  const isAuthCallback = 
    event.url.includes("access_token=") ||
    event.url.includes("code=") ||
    event.url.includes("error=");
    
  console.log("🔗 [Deep Link] Is auth callback:", isAuthCallback);
  
  if (isAuthCallback) {
    try {
      console.log("🔗 [Deep Link] Processing auth callback...");
      
      // Extract the URL parameters
      const url = new URL(event.url);
      console.log("🔗 [Deep Link] URL pathname:", url.pathname);
      console.log("🔗 [Deep Link] URL hash:", url.hash);
      console.log("🔗 [Deep Link] URL search:", url.search);

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

      console.log("🔗 [Deep Link] Auth params:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasCode: !!code,
        hasError: !!error,
      });

      if (error) {
        console.error(
          "🔗 [Deep Link] ❌ OAuth error from callback:",
          error,
          params.get("error_description")
        );
        return;
      }

      if (accessToken && refreshToken) {
        // Direct token flow
        console.log("🔗 [Deep Link] Using direct token flow...");
        console.log("🔗 [Deep Link] Setting session with tokens from deep link");
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error("🔗 [Deep Link] ❌ Error setting session:", sessionError);
        } else {
          console.log("🔗 [Deep Link] ✅ Session set successfully");
          console.log("🔗 [Deep Link] User:", data?.user?.email);
        }
      } else if (code) {
        // PKCE flow - exchange code for tokens
        console.log("🔗 [Deep Link] Using PKCE flow...");
        console.log("🔗 [Deep Link] Exchanging authorization code for tokens");
        console.log("🔗 [Deep Link] Code (first 20 chars):", code.substring(0, 20) + "...");
        
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("🔗 [Deep Link] ❌ Error exchanging code for session:", exchangeError);
          console.error("🔗 [Deep Link] Error details:", {
            message: exchangeError.message,
            status: exchangeError.status,
            name: exchangeError.name,
          });
        } else {
          console.log("🔗 [Deep Link] ✅ Code exchanged successfully!");
          console.log("🔗 [Deep Link] Session user:", data?.session?.user?.email);

          // Wait a moment for session to be fully established
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Force auth state check to trigger navigation
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (!sessionError && session) {
            console.log("🔗 [Deep Link] ✅ Session confirmed after code exchange");
            console.log("🔗 [Deep Link] Session user:", session.user?.email);
            console.log("🔗 [Deep Link] Session expires:", new Date(session.expires_at * 1000).toISOString());

            // Force trigger auth state change event to ensure navigation
            // This will trigger the onAuthStateChange listener in App.js
            console.log(
              "🔗 [Deep Link] 🔔 Manually triggering auth refresh to ensure listeners fire..."
            );

            // Refresh the session to trigger all auth state listeners
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error("🔗 [Deep Link] ❌ Error refreshing session:", refreshError);
            } else {
              console.log("🔗 [Deep Link] ✅ Session refreshed successfully");
            }

            // For web platform, also dispatch custom event
            if (Platform.OS === "web" && typeof window !== "undefined") {
              console.log("🔗 [Deep Link] Dispatching custom event (web only)");
              window.dispatchEvent(
                new CustomEvent("supabase-auth-success", {
                  detail: { session },
                })
              );
            }

            console.log("🔗 [Deep Link] ✅ Auth state notifications sent");
          } else {
            console.error("🔗 [Deep Link] ❌ No session found after code exchange");
            console.error("🔗 [Deep Link] This should not happen - code exchange succeeded but no session");
          }
        }
      } else {
        console.warn("🔗 [Deep Link] ⚠️ No access token or code found in URL");
        console.warn("🔗 [Deep Link] URL hash:", url.hash);
        console.warn("🔗 [Deep Link] URL search:", url.search);
      }
    } catch (error) {
      console.error("🔗 [Deep Link] ❌ Error handling auth callback:", error);
      console.error("🔗 [Deep Link] Error stack:", error.stack);
    }
  } else {
    console.log("🔗 [Deep Link] Not an auth callback, ignoring");
  }
  console.log("🔗 ========================================");
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
