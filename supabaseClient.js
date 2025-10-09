import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Supabase configuration
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing required environment variables: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY"
  );
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

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, commonConfig);

// Handle deep links when the app is opened from a redirect
const handleOpenURL = async (event) => {
  // Check if this is a Supabase auth callback
  if (event.url.includes("access_token=") || event.url.includes("error=")) {
    try {
      // Extract the URL parameters
      const url = new URL(event.url);
      const params = new URLSearchParams(url.hash.substring(1));

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresIn = params.get("expires_in");
      const tokenType = params.get("token_type");

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Error setting session:", error);
        }
        // The app will handle navigation based on auth state changes
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
