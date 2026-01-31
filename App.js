import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Platform } from "react-native";
import * as Application from "expo-application";
import * as Constants from "expo-constants";
import { getCurrentEnvironment } from "./src/config/environment";
import appConfig from "./app.config";
import { mixpanelService } from "./src/services/mixpanelService";
import { widgetService } from "./src/services/widgetService";
import { useResponsive } from "./src/hooks/useResponsive";
import { ResponsiveContainer } from "./src/components/ResponsiveContainer";
import { MapPreview } from "./src/components/MapPreview";
import { format } from "date-fns";
import {
  formatTimestamp,
  formatTimeDisplay as formatTimeDisplayUtil,
} from "./src/utils/dateUtils";
import { translations } from "./src/locales";

// 獲取重定向 URL
// 獲取重定向 URL
const getRedirectUrl = () => {
  return "https://to-do-mvp.vercel.app";
};

const getAppDisplayName = () => {
  return "TaskCal";
};

import Svg, { Path, Circle, Rect, Line, Ellipse } from "react-native-svg";
import ReactGA from "react-ga4";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
// expo-store-review is a native module, may not be available in Expo Go
let StoreReview = null;
try {
  StoreReview = require("expo-store-review");
} catch (e) {
  console.warn(
    "expo-store-review not available, will use web browser fallback",
  );
}
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Image,
  PanResponder,
  Animated,
  Linking,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";

// 🚨 CRITICAL: Handle OAuth callback IMMEDIATELY before React initializes
// This ensures the redirect happens as fast as possible
// NOTE: Only redirect to native app if OAuth was initiated from native app
// For pure web OAuth, let the normal flow handle it
if (Platform.OS === "web" && typeof window !== "undefined") {
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);

  // Check if this is an OAuth callback
  // Supabase may redirect to root path or /auth/callback, so check for OAuth params anywhere
  const isOAuthCallback =
    (url.pathname.includes("/auth/callback") || url.pathname === "/") &&
    (url.hash.includes("access_token") ||
      url.search.includes("code=") ||
      url.hash.includes("code="));

  // For web OAuth callbacks, check if this should redirect to native app
  // This happens when OAuth was initiated from native app but Supabase redirected to web URL first
  // We detect this by checking if the redirect URL in Supabase config points to app scheme
  // For pure web OAuth (initiated from web), we should process it directly
  if (isOAuthCallback) {
    // Check if this might be from native app by checking if Supabase redirect URL includes app scheme
    // If OAuth was initiated from native app, Supabase might redirect to web URL first,
    // then we need to redirect back to native app
    // For pure web OAuth, Supabase redirects directly to web URL and we process it here

    // Determine the correct URL scheme based on environment/domain
    const envScheme = process.env.NEXT_PUBLIC_APP_SCHEME;
    let appScheme = envScheme || "taskcal";

    // Check if this is likely from native app by checking referrer or user agent
    // For localhost, always treat as web OAuth (not from native app)
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0";

    const mightBeFromNativeApp =
      !isLocalhost &&
      (sessionStorage.getItem("oauth_from_native") === "true" ||
        // Only check referrer/user agent if not localhost
        (document.referrer === "" && navigator.userAgent.includes("Mobile")));

    // For web OAuth, if there's no clear indicator it's from native app, process it directly
    // Only redirect to native app if we're confident it came from native app
    if (mightBeFromNativeApp) {
      console.log(
        "🚨 [IMMEDIATE] OAuth callback might be from native app, preparing redirect...",
      );
      console.log("🚨 [IMMEDIATE] Current URL:", currentUrl);
      console.log("🚨 [IMMEDIATE] Using app scheme:", appScheme);

      // Build redirect URL
      let redirectUrl;
      if (url.hash.includes("access_token")) {
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const expiresIn = hashParams.get("expires_in");
        const tokenType = hashParams.get("token_type");

        redirectUrl = `${appScheme}://auth/callback#access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=${expiresIn}&token_type=${tokenType}`;
      } else if (url.search.includes("code=")) {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state") || "";
        redirectUrl = `${appScheme}://auth/callback?code=${code}&state=${state}`;
      }

      if (redirectUrl) {
        console.log("🚨 [IMMEDIATE] Redirecting to:", redirectUrl);
        // Try redirect, but if it fails (pure web OAuth), let normal flow handle it
        try {
          window.location.href = redirectUrl;
          // Show a message to the user
          setTimeout(() => {
            document.body.innerHTML =
              '<div style="font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;"><div style="font-size: 20px; margin-bottom: 20px;">Login successful!</div><div style="font-size: 16px; color: #666;">Please return to the TaskCal app.</div></div>';
          }, 100);
        } catch (e) {
          console.log(
            "🚨 [IMMEDIATE] Redirect failed, treating as web OAuth:",
            e,
          );
          // If redirect fails, it's probably pure web OAuth, let normal flow handle it
        }
      }
    } else {
      console.log(
        "🚨 [IMMEDIATE] OAuth callback detected on web (pure web OAuth), letting normal flow handle it...",
      );
      console.log("🚨 [IMMEDIATE] Current URL:", currentUrl);
      // Pure web OAuth - let the normal OAuth callback handler process it
      // This ensures web OAuth works correctly without trying to redirect to native app
    }
  }
}

// Global error handler for uncaught errors
if (Platform.OS !== "web") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError("[ERROR]", ...args);
  };

  // Log app startup
  console.log("✅ App.js loaded successfully");
  console.log("Platform:", Platform.OS);
  // Don't check process.env here - it may not be available yet in native builds
  console.log("App initialization starting...");
}

import { supabase } from "./supabaseClient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Services
import { TaskService } from "./src/services/taskService";
import { UserService } from "./src/services/userService";
import { dataPreloadService } from "./src/services/dataPreloadService";
import {
  registerForPushNotificationsAsync,
  scheduleTaskNotification,
  cancelTaskNotification,
  cancelAllNotifications,
} from "./src/services/notificationService";
import * as Notifications from "expo-notifications";

// Notification Config
import { getActiveReminderMinutes } from "./src/config/notificationConfig";
import { versionService } from "./src/services/versionService";
import { getUpdateUrl } from "./src/config/updateUrls";
import VersionUpdateModal from "./src/components/VersionUpdateModal";
import * as Updates from "expo-updates";

// Theme Config
import { getTheme, lightTheme, darkTheme } from "./src/config/theme";

// Ad Components
import AdBanner from "./src/components/AdBanner";
import AdService from "./src/services/adService";

// Storage
import AsyncStorage from "@react-native-async-storage/async-storage";

// Navigation
import {
  NavigationContainer,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

// UI Components
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
  Swipeable,
} from "react-native-gesture-handler";
import DateTimePicker from "@react-native-community/datetimepicker";

// Fonts
import { useFonts } from "expo-font";
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";
import {
  NotoSansTC_400Regular,
  NotoSansTC_500Medium,
  NotoSansTC_700Bold,
} from "@expo-google-fonts/noto-sans-tc";

const TASKS_STORAGE_KEY = "TASKS_STORAGE_KEY";
const LANGUAGE_STORAGE_KEY = "LANGUAGE_STORAGE_KEY";

// Translations are now imported from src/locales/
// See src/locales/index.js for translation structure

// Language context
const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

// Theme context
const ThemeContext = createContext({
  theme: lightTheme,
  themeMode: "light",
  setThemeMode: () => {},
  toggleTheme: () => {},
  loadTheme: () => {},
});

// User context
const UserContext = createContext({
  userType: "general",
  loadingUserType: true,
  setUserType: () => {},
  loadUserType: () => {},
  setUpdateInfo: () => {},
  setIsUpdateModalVisible: () => {},
  isSimulatingUpdate: false,
  setIsSimulatingUpdate: () => {},
});

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 格式化時間為 HH:MM（移除秒數）
// 使用工具文件中的函數，保持向後兼容
const formatTimeDisplay = formatTimeDisplayUtil;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const SplashScreen = ({ navigation }) => {
  const { theme, themeMode, loadTheme: reloadTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const { loadUserType } = useContext(UserContext);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  // Check if Apple Authentication is available
  useEffect(() => {
    const checkAppleAvailability = async () => {
      if (Platform.OS === "ios") {
        try {
          const isAvailable = await AppleAuthentication.isAvailableAsync();
          setIsAppleAvailable(isAvailable);
          console.log("🍎 Apple Authentication available:", isAvailable);
        } catch (error) {
          console.error(
            "Error checking Apple Authentication availability:",
            error,
          );
          setIsAppleAvailable(false);
        }
      } else {
        setIsAppleAvailable(false);
      }
    };
    checkAppleAvailability();
  }, []);

  useEffect(() => {
    // Handle OAuth callback if this is a redirect from OAuth
    const handleOAuthCallback = async () => {
      try {
        // Only handle OAuth callback on web platform
        if (Platform.OS !== "web" || typeof window === "undefined") {
          console.log(
            "OAuth callback: Not on web platform, skipping callback handling",
          );
          return;
        }

        console.log("OAuth callback: Starting callback handling");
        console.log("OAuth callback: Current URL:", window.location.href);

        // Check if we should redirect to native app
        // This should ONLY happen if OAuth was initiated from a native app
        // For pure web OAuth, we should process it directly here
        const url = new URL(window.location.href);
        const hasOAuthParams =
          (url.pathname.includes("auth/callback") || url.pathname === "/") &&
          (url.hash.includes("access_token") ||
            url.search.includes("code=") ||
            url.hash.includes("code="));

        // Check if this is from a native app by checking referrer or sessionStorage
        // If OAuth was initiated from web, there should be no need to redirect to native app
        const isFromNativeApp =
          sessionStorage.getItem("oauth_from_native") === "true" ||
          document.referrer.includes("mobile") ||
          navigator.userAgent.includes("Mobile");

        if (hasOAuthParams && isFromNativeApp) {
          console.log(
            "OAuth callback: Detected native app OAuth flow, preparing redirect...",
          );

          // Determine the correct URL scheme based on environment/domain
          const envScheme = process.env.NEXT_PUBLIC_APP_SCHEME;
          let appScheme = envScheme || "taskcal";

          console.log("OAuth callback: Using app scheme:", appScheme);

          // Extract auth params from URL
          let redirectUrl;
          if (url.hash.includes("access_token")) {
            // Hash fragment with tokens
            const hashParams = new URLSearchParams(url.hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            const expiresIn = hashParams.get("expires_in");
            const tokenType = hashParams.get("token_type");

            redirectUrl = `${appScheme}://auth/callback#access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=${expiresIn}&token_type=${tokenType}`;
          } else if (url.search.includes("code=")) {
            // Query params with code
            const code = url.searchParams.get("code");
            const state = url.searchParams.get("state") || "";
            redirectUrl = `${appScheme}://auth/callback?code=${code}&state=${state}`;
          }

          if (redirectUrl) {
            console.log(
              "OAuth callback: Redirecting to native app:",
              redirectUrl,
            );
            try {
              window.location.href = redirectUrl;
              // Show user message after attempting redirect
              setTimeout(() => {
                alert(
                  "Please return to the TaskCal app. The login was successful!",
                );
              }, 1000);
              return;
            } catch (redirectError) {
              console.error(
                "OAuth callback: Failed to redirect to native app:",
                redirectError,
              );
            }
          }
        } else if (hasOAuthParams) {
          // This is a pure web OAuth callback - process it directly
          console.log(
            "OAuth callback: Pure web OAuth detected, processing directly...",
          );

          // Process the OAuth callback for web
          try {
            // If we have a code, exchange it for session
            if (url.search.includes("code=")) {
              const code = url.searchParams.get("code");
              console.log("OAuth callback: Exchanging code for session...");

              const { data: sessionData, error: exchangeError } =
                await supabase.auth.exchangeCodeForSession(code);

              if (exchangeError) {
                console.error(
                  "OAuth callback: Code exchange failed:",
                  exchangeError,
                );
              } else if (sessionData?.session) {
                console.log(
                  "OAuth callback: ✅ Session established successfully!",
                );
                // Clear URL params and navigate
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname,
                );
                // Navigation will be handled by auth state listener
              }
            } else if (url.hash.includes("access_token")) {
              // Direct token flow
              const hashParams = new URLSearchParams(url.hash.substring(1));
              const accessToken = hashParams.get("access_token");
              const refreshToken = hashParams.get("refresh_token");

              if (accessToken && refreshToken) {
                console.log("OAuth callback: Setting session with tokens...");
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

                if (!sessionError) {
                  console.log("OAuth callback: ✅ Session set successfully!");
                  // Clear URL hash and navigate
                  window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                  );
                  // Navigation will be handled by auth state listener
                }
              }
            }
          } catch (error) {
            console.error("OAuth callback: Error processing web OAuth:", error);
          }
        }

        // Check for OAuth errors in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const oauthError = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (oauthError) {
          console.error("OAuth callback: OAuth error detected:", {
            error: oauthError,
            errorCode: urlParams.get("error_code"),
            errorDescription: decodeURIComponent(errorDescription || ""),
          });

          // Handle specific database error
          if (
            oauthError === "server_error" &&
            errorDescription?.includes("Database error saving new user")
          ) {
            console.error(
              "OAuth callback: Database error - new user cannot be saved",
            );
            console.error("Full OAuth error details:", {
              error: oauthError,
              errorCode: urlParams.get("error_code"),
              errorDescription: decodeURIComponent(errorDescription || ""),
              fullUrl:
                Platform.OS === "web" && typeof window !== "undefined"
                  ? window.location.href
                  : "N/A",
            });

            // Try to handle the error gracefully by attempting to create user settings manually
            try {
              // The user might still be authenticated even if database setup failed
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();

              if (user) {
                // Try to create user settings manually
                const { error: settingsError } = await supabase
                  .from("user_settings")
                  .upsert({
                    user_id: user.id,
                    language: "en",
                    theme: "light",
                    notifications_enabled: true,
                  });

                if (settingsError) {
                  console.error(
                    "Failed to create user settings:",
                    settingsError,
                  );
                  console.error("Settings error details:", {
                    message: settingsError.message,
                    details: settingsError.details,
                    hint: settingsError.hint,
                    code: settingsError.code,
                  });

                  // Try to get more detailed error information
                  console.error(
                    "Full settings error object:",
                    JSON.stringify(settingsError, null, 2),
                  );

                  // Check if user_settings table exists and is accessible
                  const { data: tableCheck, error: tableError } = await supabase
                    .from("user_settings")
                    .select("id")
                    .limit(1);

                  alert(
                    "Account created but some settings could not be saved. You can continue using the app.",
                  );
                } else {
                  alert("Account created successfully! Welcome to TaskCal!");
                }

                // Navigate to main app even if there were some issues
                navigateToMainApp({ focusToday: true });
                return;
              }
            } catch (manualError) {
              console.error("Manual user creation failed:", manualError);
            }

            alert(
              "Unable to create new user account. Please contact support or try with a different Google account.",
            );
            return;
          }

          // Handle other OAuth errors
          alert(
            `Authentication error: ${decodeURIComponent(
              errorDescription || oauthError,
            )}`,
          );
          return;
        }

        // First, try to get the session from the URL if this is an OAuth callback
        const { data, sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("OAuth callback: Error getting session:", sessionError);
          return;
        }

        console.log("OAuth callback: Session data:", data);

        if (data?.session) {
          console.log("OAuth callback: User session found");
          // Force a refresh of the auth state
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error(
              "OAuth callback: Failed to get user after OAuth:",
              userError,
            );
            return;
          }

          console.log("OAuth callback: User verified, navigating to main app");
          navigateToMainApp({ focusToday: true });
        } else {
          console.log("OAuth callback: No session found in callback");

          // Add fallback mechanisms for incognito mode or session issues

          // Try to get session with a delay (sometimes it takes time to propagate)
          setTimeout(async () => {
            try {
              const { data: fallbackData, error: fallbackError } =
                await supabase.auth.getSession();
              if (fallbackData?.session) {
                navigateToMainApp({ focusToday: true });
                return;
              }

              // Try one more time with getUser
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();
              if (user && !userError) {
                navigateToMainApp({ focusToday: true });
                return;
              }
            } catch (fallbackError) {
              console.error("Fallback session recovery failed:", fallbackError);
            }
          }, 2000);

          // Try again after 5 seconds
          setTimeout(async () => {
            try {
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();
              if (user && !userError) {
                navigateToMainApp({ focusToday: true });
                return;
              }
            } catch (finalError) {
              console.error("Final fallback failed:", finalError);
            }
          }, 5000);
        }
      } catch (error) {
        console.error("OAuth callback: Error handling OAuth callback:", error);
      }
    };

    // Navigate to main app
    const navigateToMainApp = (options = {}) => {
      console.log("📍 [navigateToMainApp] Function called", options);

      if (hasNavigated && !options.focusToday) {
        console.log("📍 [navigateToMainApp] ⚠️ Already navigated, skipping");
        return;
      }

      if (!navigation) {
        console.error(
          "📍 [navigateToMainApp] ❌ Navigation object is not available",
        );
        return;
      }

      // Check if already in MainTabs to avoid resetting navigation
      const currentRoute =
        navigation.getState?.()?.routes?.[navigation.getState?.()?.index];
      if (currentRoute?.name === "MainTabs" && !options.focusToday) {
        console.log(
          "📍 [navigateToMainApp] ⚠️ Already in MainTabs, skipping reset to preserve current tab",
        );
        setHasNavigated(true);
        return;
      }

      console.log(
        "📍 [navigateToMainApp] Navigation object exists, attempting reset...",
      );

      try {
        setHasNavigated(true);
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "MainTabs",
              params: options.focusToday
                ? { screen: "Calendar", params: { focusToday: true } }
                : undefined,
            },
          ],
        });
        console.log("📍 [navigateToMainApp] ✅ Navigation reset successful!");
      } catch (error) {
        console.error("📍 [navigateToMainApp] ❌ Navigation error:", error);
        console.error("📍 [navigateToMainApp] Error stack:", error.stack);
        setHasNavigated(false); // Reset flag on error
      }
    };

    // Set up auth state change listener
    const { data: { subscription: authSubscription } = {} } =
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", { event, session });

        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED"
        ) {
          try {
            console.log(`Processing ${event} event...`);

            // If we already have a session from the event, use it
            let currentSession = session;

            // If no session from event, try to get it
            if (!currentSession) {
              console.log("No session in event, fetching from Supabase...");
              const {
                data: { session: fetchedSession },
                error: sessionError,
              } = await supabase.auth.getSession();

              if (sessionError) {
                console.error("Error getting current session:", sessionError);
                return;
              }

              currentSession = fetchedSession;
            }

            if (!currentSession) {
              console.log("No session available after auth state change");
              return;
            }

            console.log("Session found, verifying user...");
            console.log("Session user email:", currentSession.user?.email);

            // Use user directly from session to avoid API call issues
            const user = currentSession.user;

            if (!user) {
              console.error("❌ No user in session");
              return;
            }

            console.log("✅ User verified from session!");
            console.log("User email:", user.email);
            console.log("User ID:", user.id);

            // Mixpanel: 識別使用者並追蹤登入事件
            mixpanelService.identify(user.id, {
              $email: user.email,
              $name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0],
              $avatar: user.user_metadata?.avatar_url,
              email: user.email,
              name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0],
              platform: Platform.OS,
            });
            mixpanelService.track("User Signed In", {
              method: event === "SIGNED_IN" ? "new_signin" : "existing_session",
              email: user.email,
              platform: Platform.OS,
            });

            // 更新用戶平台資訊（不阻止登入流程）
            UserService.updatePlatformInfo()
              .then(() => {
                console.log("📱 Platform info updated successfully");
              })
              .catch((platformError) => {
                console.error(
                  "❌ Error updating platform info:",
                  platformError,
                );
              });

            // 立即開始預載入所有數據（不等待完成，在背景執行）
            dataPreloadService.preloadAllData().catch((preloadError) => {
              console.error("❌ Error preloading data:", preloadError);
            });

            // 新登入時在背景載入 theme，不阻塞導向（避免 getUserSettings 卡住時整頁卡 5 秒）
            if (event === "SIGNED_IN" && reloadTheme) {
              reloadTheme().catch((themeError) => {
                console.error(
                  "❌ Error reloading theme after login:",
                  themeError,
                );
              });
            }

            // 登入／session 建立後立即更新 UserContext 的 user_type，讓廣告依身份正確顯示（無需先進設定頁）
            if (loadUserType) {
              loadUserType().catch((userTypeError) => {
                console.error(
                  "❌ Error loading user type after auth:",
                  userTypeError,
                );
              });
            }

            // 導向主畫面後才關閉 Signing in，避免按鈕已還原但畫面還卡住
            console.log("🚀 Navigating to main app...");
            if (!hasNavigated) {
              setIsSigningIn(false);
              setIsAppleSigningIn(false);
              navigateToMainApp({ focusToday: true });
            } else {
              setIsSigningIn(false);
              setIsAppleSigningIn(false);
              console.log("⚠️ Navigation skipped - already navigated");
            }
          } catch (error) {
            console.error("Error in auth state change handler:", error);
          }
        } else if (event === "SIGNED_OUT") {
          // 清除預載入緩存
          dataPreloadService.clearCache();

          // Navigate back to splash screen when user logs out
          setHasNavigated(false); // Reset navigation flag
          navigation.reset({
            index: 0,
            routes: [{ name: "Splash" }],
          });
        }
      });

    // Listen for custom auth success event from deep link handling
    const handleCustomAuthSuccess = (event) => {
      console.log("Custom auth success event received:", event.detail);
      navigateToMainApp({ focusToday: true });
    };

    // Add event listener for custom auth success (web only)
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      typeof window.addEventListener === "function"
    ) {
      window.addEventListener("supabase-auth-success", handleCustomAuthSuccess);
    }

    // Cleanup auth subscription on unmount
    const cleanupAuthSubscription = () => {
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
      // Remove custom event listener (web only)
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        typeof window.removeEventListener === "function"
      ) {
        window.removeEventListener(
          "supabase-auth-success",
          handleCustomAuthSuccess,
        );
      }
    };

    // Check for existing session on mount
    const checkSession = async () => {
      try {
        console.log("[checkSession] Starting session check...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[checkSession] Error getting session:", error);
          return;
        }

        if (session) {
          console.log("[checkSession] Existing session found!");
          console.log("[checkSession] Session user ID:", session.user?.id);
          console.log(
            "[checkSession] Session expires at:",
            new Date(session.expires_at * 1000).toISOString(),
          );

          // Check if session is expired
          const now = Math.floor(Date.now() / 1000);
          const isSessionExpired =
            session.expires_at && session.expires_at < now;

          if (isSessionExpired) {
            console.log(
              "[checkSession] Session expired, attempting refresh...",
            );
            // Try to refresh the session
            const {
              data: { session: refreshedSession },
              error: refreshError,
            } = await supabase.auth.refreshSession();

            if (refreshError || !refreshedSession) {
              console.error(
                "[checkSession] Failed to refresh expired session:",
                refreshError,
              );
              console.log(
                "[checkSession] Session expired, navigating to today page...",
              );
              // Session expired, navigate to MainTabs with today focus
              if (!hasNavigated) {
                navigateToMainApp({ focusToday: true });
              }
              return;
            }

            // Session refreshed successfully, continue with refreshed session
            console.log("[checkSession] Session refreshed successfully");
          }

          // Verify the user is still valid
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error(
              "[checkSession] Session invalid or user not found:",
              userError,
            );
            console.error(
              "[checkSession] Attempting to clear invalid session...",
            );
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error("[checkSession] Error signing out:", signOutError);
            }
            return;
          }

          console.log("[checkSession] User verified:", {
            id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
          });

          // 立即開始預載入所有數據（不等待完成，在背景執行）
          dataPreloadService.preloadAllData().catch((preloadError) => {
            console.error("❌ Error preloading data:", preloadError);
          });

          console.log("[checkSession] Navigating to main app...");
          // Check if already navigated to prevent double navigation
          if (!hasNavigated) {
            navigateToMainApp({ focusToday: true });
          } else {
            console.log(
              "⚠️ [checkSession] Navigation skipped - already navigated",
            );
          }
        } else {
          console.log(
            "[checkSession] No existing session found, showing login screen",
          );
        }
      } catch (error) {
        console.error("[checkSession] Unexpected error:", error);
        console.error("[checkSession] Error stack:", error.stack);
      }
    };

    // Handle deep linking for OAuth redirects
    const handleDeepLink = async (event) => {
      if (event?.url) {
        console.log("🔗🔗🔗 [App.js Deep Link] Received:", event.url);

        // Check if this is an auth callback
        const isAuthCallback =
          event.url.includes("auth/callback") ||
          event.url.includes("access_token=") ||
          event.url.includes("code=") ||
          event.url.includes("error=");

        if (isAuthCallback) {
          console.log("🔗🔗🔗 [App.js Deep Link] Auth callback detected!");

          try {
            // Parse the URL - handle custom scheme URLs
            let params;
            if (event.url.includes("#")) {
              // Hash parameters (direct token flow)
              const hashPart = event.url.split("#")[1];
              params = new URLSearchParams(hashPart);
              console.log("🔗🔗🔗 [App.js Deep Link] Parsing from hash");
            } else if (event.url.includes("?")) {
              // Query parameters (PKCE flow)
              const queryPart = event.url.split("?")[1];
              params = new URLSearchParams(queryPart);
              console.log("🔗🔗🔗 [App.js Deep Link] Parsing from query");
            } else {
              console.error(
                "🔗🔗🔗 [App.js Deep Link] No parameters found in URL",
              );
              return;
            }

            const code = params.get("code");
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            const error = params.get("error");

            console.log("🔗🔗🔗 [App.js Deep Link] Params:", {
              hasCode: !!code,
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              hasError: !!error,
            });

            if (error) {
              console.error("🔗🔗🔗 [App.js Deep Link] OAuth error:", error);
              Alert.alert(
                "Authentication Error",
                params.get("error_description") || error,
              );
              return;
            }

            if (code) {
              // PKCE flow - exchange code for session
              console.log(
                "🔗🔗🔗 [App.js Deep Link] Exchanging code for session...",
              );

              const { data, error: exchangeError } =
                await supabase.auth.exchangeCodeForSession(code);

              if (exchangeError) {
                console.error(
                  "🔗🔗🔗 [App.js Deep Link] ❌ Code exchange failed:",
                  exchangeError,
                );
                Alert.alert(
                  "Authentication Error",
                  "Failed to complete sign in. Please try again.",
                );
                return;
              }

              console.log(
                "🔗🔗🔗 [App.js Deep Link] ✅ Code exchanged successfully!",
              );
              console.log(
                "🔗🔗🔗 [App.js Deep Link] Session user:",
                data?.session?.user?.email,
              );

              // Wait for session to be fully established and onAuthStateChange to trigger
              // Don't navigate here - let auth state listener handle it
              console.log(
                "🔗🔗🔗 [App.js Deep Link] ⏳ Waiting for auth state listener to navigate...",
              );
              console.log(
                "🔗🔗🔗 [App.js Deep Link] (SIGNED_IN event should trigger navigation)",
              );

              // Wait a moment for onAuthStateChange to fire
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Fallback: If navigation hasn't happened after 2 seconds, navigate manually
              setTimeout(() => {
                if (!hasNavigated) {
                  console.log(
                    "🔗🔗🔗 [App.js Deep Link] Fallback: Navigating to main app...",
                  );
                  navigateToMainApp({ focusToday: true });
                }
              }, 2000);
            } else if (accessToken && refreshToken) {
              // Direct token flow
              console.log(
                "🔗🔗🔗 [App.js Deep Link] Setting session with tokens...",
              );

              const { data, error: sessionError } =
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

              if (sessionError) {
                console.error(
                  "🔗🔗🔗 [App.js Deep Link] ❌ Set session failed:",
                  sessionError,
                );
                Alert.alert(
                  "Authentication Error",
                  "Failed to complete sign in. Please try again.",
                );
                return;
              }

              console.log(
                "🔗🔗🔗 [App.js Deep Link] ✅ Session set successfully!",
              );

              // Wait for session to be fully established and onAuthStateChange to trigger
              // Don't navigate here - let auth state listener handle it
              console.log(
                "🔗🔗🔗 [App.js Deep Link] ⏳ Waiting for auth state listener to navigate...",
              );
              console.log(
                "🔗🔗🔗 [App.js Deep Link] (SIGNED_IN event should trigger navigation)",
              );

              // Wait a moment for onAuthStateChange to fire
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Fallback: If navigation hasn't happened after 2 seconds, navigate manually
              setTimeout(() => {
                if (!hasNavigated) {
                  console.log(
                    "🔗🔗🔗 [App.js Deep Link] Fallback: Navigating to main app...",
                  );
                  navigateToMainApp({ focusToday: true });
                }
              }, 2000);
            } else {
              console.error(
                "🔗🔗🔗 [App.js Deep Link] No code or tokens found in callback",
              );
            }
          } catch (error) {
            console.error(
              "🔗🔗🔗 [App.js Deep Link] ❌ Error handling deep link:",
              error,
            );
            console.error(
              "🔗🔗🔗 [App.js Deep Link] Error stack:",
              error.stack,
            );
          }
        } else {
          console.log(
            "🔗🔗🔗 [App.js Deep Link] Not an auth callback, ignoring",
          );
        }
      }
    };

    // Check for initial URL if this is a web app
    const checkInitialUrl = async () => {
      if (Platform.OS === "web") {
        const url = new URL(window.location.href);
        // Check for OAuth callback in URL (hash or pathname)
        const hasAuthCallback =
          url.pathname.includes("auth/callback") ||
          url.hash.includes("access_token") ||
          url.hash.includes("error=") ||
          url.search.includes("code=");

        if (hasAuthCallback) {
          console.log("Initial URL is an auth callback:", url.href);
          console.log(
            "OAuth callback already handled at module level, skipping",
          );
          return;
        }
      } else {
        // For mobile, check if app was launched with a deep link
        console.log("Mobile platform detected, checking for initial URL...");

        try {
          const initialUrl = await Linking.getInitialURL();
          console.log("Initial URL:", initialUrl || "None");

          if (
            initialUrl &&
            (initialUrl.includes("auth/callback") ||
              initialUrl.includes("code=") ||
              initialUrl.includes("access_token="))
          ) {
            console.log("🔗🔗🔗 [App.js] App launched with auth callback URL!");
            // Process the deep link
            await handleDeepLink({ url: initialUrl });
            return;
          }
        } catch (error) {
          console.error("Error getting initial URL:", error);
        }

        // If no auth callback in initial URL, check for existing session with retry
        console.log("No auth callback in initial URL, checking for session...");

        // Try multiple times with delays to handle OAuth callback timing
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`Session check attempt ${attempt}/3...`);

            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();

            if (error) {
              console.error(
                `Error checking session (attempt ${attempt}):`,
                error,
              );
            } else if (session) {
              console.log(
                `Mobile: Session found on attempt ${attempt}, navigating to main app`,
              );

              // 立即開始預載入所有數據（不等待完成，在背景執行）
              dataPreloadService.preloadAllData().catch((preloadError) => {
                console.error("❌ Error preloading data:", preloadError);
              });

              // Check if already in MainTabs to avoid resetting navigation
              const currentRoute =
                navigation.getState?.()?.routes?.[
                  navigation.getState?.()?.index
                ];
              if (currentRoute?.name !== "MainTabs") {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "MainTabs" }],
                });
              } else {
                console.log(
                  "⚠️ [checkSession] Already in MainTabs, skipping reset to preserve current tab",
                );
              }
              return;
            } else {
              console.log(`No session found on attempt ${attempt}`);
            }

            // Wait before next attempt (except on last attempt)
            if (attempt < 3) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempt),
              );
            }
          } catch (error) {
            console.error(
              `Error in mobile session check (attempt ${attempt}):`,
              error,
            );
          }
        }

        console.log(
          "All session check attempts completed, proceeding to check existing session",
        );
      }

      // If not an auth callback, check for existing session
      await checkSession();
    };

    // Add deep link listener
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Initial check for session or auth callback
    checkInitialUrl();

    // Add multiple fallback checks for OAuth
    const fallbackChecks = [
      setTimeout(async () => {
        console.log("Fallback 1: Checking session after 2 seconds");
        await checkSessionAndNavigate();
      }, 2000),

      setTimeout(async () => {
        console.log("Fallback 2: Checking session after 5 seconds");
        await checkSessionAndNavigate();
      }, 5000),

      setTimeout(async () => {
        console.log("Fallback 3: Final session check after 10 seconds");
        await checkSessionAndNavigate();
      }, 10000),
    ];

    const checkSessionAndNavigate = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Fallback: Error getting session:", sessionError);
          return;
        }

        if (session) {
          console.log("Fallback: Session found, verifying user...");
          // Verify the user before navigating
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error("Fallback: User verification failed:", userError);
            return;
          }

          console.log("Fallback: User verified, navigating to main app");
          navigateToMainApp({ focusToday: true });
          return true; // Success
        } else {
          console.log("Fallback: No session found");
          return false;
        }
      } catch (error) {
        console.error("Fallback: Error in session check:", error);
        return false;
      }
    };

    // Cleanup
    return () => {
      // Clear all fallback timeouts
      fallbackChecks.forEach((timeoutId) => clearTimeout(timeoutId));
      if (subscription?.remove) {
        subscription.remove();
      } else if (subscription) {
        // Fallback for older React Native versions
        Linking.removeEventListener("url", handleDeepLink);
      }
      cleanupAuthSubscription();
    };
  }, [navigation]);

  // Add a debug effect to log navigation state changes
  useEffect(() => {
    // Check if navigation and addListener are available
    if (navigation && typeof navigation.addListener === "function") {
      const unsubscribe = navigation.addListener("state", (e) => {
        console.log("Navigation state changed:", e.data.state);
      });
      return unsubscribe;
    }
    // Return empty cleanup function if addListener is not available
    return () => {};
  }, [navigation]);

  const handleGoogleSignIn = async () => {
    // Prevent multiple simultaneous sign-in attempts
    if (isSigningIn) {
      console.log("⚠️ Sign-in already in progress, ignoring duplicate request");
      return;
    }

    setIsSigningIn(true);
    console.log("🔐 Google Authentication - Starting...");
    try {
      console.log("VERBOSE: Starting Google authentication process");

      if (!supabase) {
        console.error("CRITICAL: Supabase client is NOT initialized");
        throw new Error("Supabase client is not initialized");
      }

      // First, check for an existing session
      const {
        data: { session: existingSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("CRITICAL: Error checking session:", sessionError);
        throw sessionError;
      }

      if (existingSession) {
        console.log("VERBOSE: User is already signed in");
        // Let the auth state change listener handle navigation
        console.log("⏳ Waiting for auth state listener to navigate...");
        return;
      }

      // Use the correct redirect URL for Expo
      const getRedirectUrl = () => {
        if (Platform.OS !== "web") {
          // For standalone apps (iOS), use app scheme directly
          // This allows OAuth to redirect directly back to the app
          const currentEnv = process.env.EXPO_PUBLIC_APP_ENV || "production";
          console.log(
            "🔍 DEBUG - Current environment for redirect:",
            currentEnv,
          );
          console.log(
            "🔍 DEBUG - All EXPO_PUBLIC env vars:",
            Object.keys(process.env).filter((key) =>
              key.startsWith("EXPO_PUBLIC"),
            ),
          );
          console.log(
            "🔍 DEBUG - EXPO_PUBLIC_APP_ENV value:",
            process.env.EXPO_PUBLIC_APP_ENV,
          );

          // Get app scheme based on environment
          // Use the same scheme as defined in app.config.js
          const appScheme = "taskcal";

          console.log("🔍 DEBUG - Using app scheme:", appScheme);

          // Use app scheme for direct deep link
          return `${appScheme}://auth/callback`;
        }

        // For web, always return the current origin
        // Supabase will redirect back to the same page with auth tokens/code
        const currentOrigin = window.location.origin;
        console.log("VERBOSE: Current origin:", currentOrigin);

        // For web (both localhost and production), return current origin
        // This allows Supabase to redirect back to the same page with auth data
        return currentOrigin;
      };

      const redirectUrl = getRedirectUrl();
      console.log("VERBOSE: Using redirect URL:", redirectUrl);

      // Debug: Log current window location for web
      if (Platform.OS === "web") {
        console.log("VERBOSE: Current window location:", {
          origin: window.location.origin,
          href: window.location.href,
          pathname: window.location.pathname,
        });
      }

      // Start the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
          skipBrowserRedirect: Platform.OS !== "web", // Skip browser redirect on mobile
        },
      });

      if (error) {
        console.error("CRITICAL: OAuth sign-in failed:", error);
        throw error;
      }

      if (data?.url) {
        console.log("VERBOSE: Opening auth URL in browser");
        console.log("VERBOSE: Auth URL:", data.url);
        if (Platform.OS === "web") {
          // For web, we need to redirect to the auth URL
          console.log("VERBOSE: Redirecting to:", data.url);
          // Use window.location.replace to avoid back button issues (web only)
          if (
            Platform.OS === "web" &&
            typeof window !== "undefined" &&
            window.location
          ) {
            window.location.replace(data.url);
          }
        } else {
          // For mobile, use WebBrowser which handles deep links properly
          console.log(
            "VERBOSE: Opening OAuth browser session with WebBrowser...",
          );
          console.log("VERBOSE: Redirect URL:", redirectUrl);

          // Use WebBrowser.openAuthSessionAsync for OAuth flow
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
          );
          console.log(
            "VERBOSE: WebBrowser result:",
            JSON.stringify(result, null, 2),
          );

          // ✅ KEY FIX: The result.url contains the OAuth callback URL
          // We need to manually process it since iOS doesn't automatically trigger the deep link
          if (result.type === "success" && result.url) {
            console.log(
              "🎯 [CRITICAL] WebBrowser returned with URL, processing manually...",
            );
            console.log("🎯 [CRITICAL] Returned URL:", result.url);

            // Parse and handle the OAuth callback URL directly
            try {
              let params = null;
              let code, accessToken, refreshToken, error;

              // Try query parameters first (PKCE flow)
              if (result.url.includes("?")) {
                const queryPart = result.url.split("?")[1].split("#")[0]; // Remove hash if present
                if (queryPart) {
                  params = new URLSearchParams(queryPart);
                  console.log("🎯 [CRITICAL] Parsing from query");
                  code = params.get("code");
                  accessToken = params.get("access_token");
                  refreshToken = params.get("refresh_token");
                  error = params.get("error");
                }
              }

              // If no params found in query, try hash (direct token flow)
              if (!code && !accessToken && result.url.includes("#")) {
                const hashPart = result.url.split("#")[1];
                if (hashPart && hashPart.trim()) {
                  params = new URLSearchParams(hashPart);
                  console.log("🎯 [CRITICAL] Parsing from hash");
                  code = params.get("code");
                  accessToken = params.get("access_token");
                  refreshToken = params.get("refresh_token");
                  error = params.get("error");
                }
              }

              if (params && (code || accessToken || error)) {
                console.log("🎯 [CRITICAL] OAuth params:", {
                  hasCode: !!code,
                  hasAccessToken: !!accessToken,
                  hasRefreshToken: !!refreshToken,
                  hasError: !!error,
                });

                if (error) {
                  console.error("🎯 [CRITICAL] OAuth error:", error);
                  Alert.alert(
                    "Authentication Error",
                    params.get("error_description") || error,
                  );
                  return;
                }

                if (code) {
                  // Exchange code for session
                  console.log("🎯 [CRITICAL] Exchanging code for session...");

                  const { data: sessionData, error: exchangeError } =
                    await supabase.auth.exchangeCodeForSession(code);

                  if (exchangeError) {
                    console.error(
                      "🎯 [CRITICAL] ❌ Code exchange failed:",
                      exchangeError,
                    );
                    Alert.alert(
                      "Authentication Error",
                      "Failed to complete sign in. Please try again.",
                    );
                    return;
                  }

                  console.log("🎯 [CRITICAL] ✅ Code exchanged successfully!");
                  console.log("🎯 [CRITICAL] Session:", {
                    hasSession: !!sessionData?.session,
                    userEmail: sessionData?.session?.user?.email,
                  });

                  // Don't navigate here - let auth state listener handle it
                  // exchangeCodeForSession triggers SIGNED_IN event which will navigate
                  console.log(
                    "🎯 [CRITICAL] ⏳ Waiting for auth state listener to navigate...",
                  );
                  console.log(
                    "🎯 [CRITICAL] (SIGNED_IN event should trigger navigation)",
                  );

                  setIsSigningIn(false);
                  return;
                } else if (accessToken && refreshToken) {
                  // Direct token flow
                  console.log("🎯 [CRITICAL] Setting session with tokens...");

                  const { data: sessionData, error: sessionError } =
                    await supabase.auth.setSession({
                      access_token: accessToken,
                      refresh_token: refreshToken,
                    });

                  if (sessionError) {
                    console.error(
                      "🎯 [CRITICAL] ❌ Set session failed:",
                      sessionError,
                    );
                    Alert.alert(
                      "Authentication Error",
                      "Failed to complete sign in. Please try again.",
                    );
                    return;
                  }

                  console.log("🎯 [CRITICAL] ✅ Session set successfully!");

                  // Don't navigate here - let auth state listener handle it
                  console.log(
                    "🎯 [CRITICAL] ⏳ Waiting for auth state listener to navigate...",
                  );

                  setIsSigningIn(false);
                  return;
                }
              }
            } catch (error) {
              console.error(
                "🎯 [CRITICAL] ❌ Error processing OAuth callback:",
                error,
              );
              Alert.alert(
                "Authentication Error",
                "Failed to process authentication. Please try again.",
              );
              return;
            }

            return;
          } else if (result.type === "cancel") {
            console.log("VERBOSE: User cancelled the auth flow");
            console.log(
              "VERBOSE: This might be due to deep link not working properly",
            );
            console.log(
              "VERBOSE: Check if Supabase redirect URL includes: taskcal://auth/callback",
            );
            setIsSigningIn(false);
            // Don't show alert for cancel - user might have closed browser due to redirect issue
            return;
          } else if (result.type === "dismiss") {
            console.log("VERBOSE: Auth flow was dismissed");
            setIsSigningIn(false);
            return;
          }

          // If we get here, something unexpected happened
          console.error("VERBOSE: Unexpected result type:", result.type);

          // Give the deep link handler more time to process the callback
          // The auth state listener will handle navigation automatically
          const checkSessionWithRetry = async (
            attempt = 1,
            maxAttempts = 5,
          ) => {
            console.log(
              `[Auth Fallback] Session check attempt ${attempt}/${maxAttempts}...`,
            );

            const {
              data: { session: newSession },
              error: sessionCheckError,
            } = await supabase.auth.getSession();

            if (sessionCheckError) {
              console.error(
                "[Auth Fallback] Error checking session:",
                sessionCheckError,
              );
              if (attempt >= maxAttempts) {
                setIsSigningIn(false);
                Alert.alert(
                  "Authentication Error",
                  "Failed to complete sign in. Please try again.",
                );
              }
              return;
            }

            if (!newSession) {
              console.log(
                `[Auth Fallback] No session found on attempt ${attempt}`,
              );

              // Retry if we haven't reached max attempts
              if (attempt < maxAttempts) {
                const delay = 2000 * attempt; // Increasing delay: 2s, 4s, 6s, 8s
                console.log(`[Auth Fallback] Retrying in ${delay}ms...`);
                setTimeout(
                  () => checkSessionWithRetry(attempt + 1, maxAttempts),
                  delay,
                );
              } else {
                console.error(
                  "[Auth Fallback] All attempts exhausted, no session found",
                );
                setIsSigningIn(false);
                Alert.alert(
                  "Sign In Issue",
                  "Authentication completed but session was not established. Please try signing in again.\n\nIf this persists, try restarting the app.",
                );
              }
            } else {
              console.log(
                `[Auth Fallback] ✅ Session found on attempt ${attempt}!`,
              );
              console.log("[Auth Fallback] User:", newSession.user?.email);

              // Manually trigger navigation if auth listener hasn't done it yet
              console.log("[Auth Fallback] Manually triggering navigation...");
              setIsSigningIn(false);
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              });
            }
          };

          // Start checking after 2 seconds
          setTimeout(() => checkSessionWithRetry(1, 5), 2000);
        }
      } else {
        console.log("VERBOSE: No URL returned from OAuth");
      }
    } catch (error) {
      console.error("CRITICAL: Authentication Error:", {
        name: error?.name || "Unknown Error",
        message: error?.message || "No error message available",
        code: error?.code || "N/A",
        stack: error?.stack || "No stack trace available",
      });

      let errorMessage =
        "An unexpected error occurred during sign in. Please try again.";

      if (error?.message?.includes("popup_closed_by_user")) {
        errorMessage = "Sign in was cancelled. Please try again.";
      } else if (error?.message?.includes("network error")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (error?.message?.includes("invalid_grant")) {
        errorMessage = "Invalid credentials. Please try again.";
      } else if (error?.message?.includes("invalid_redirect_uri")) {
        errorMessage = `Invalid redirect URI. Please ensure ${redirectUrl} is added to your Supabase project's authorized redirect URLs.`;
      } else if (error?.message?.includes("OAuth provider not found")) {
        errorMessage =
          "Google OAuth is not properly configured. Please contact support.";
      } else if (error?.message?.includes("network error")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      }

      Alert.alert(
        "Sign In Error",
        errorMessage,
        [
          {
            text: "OK",
            style: "default",
            onPress: () => setIsSigningIn(false),
          },
          {
            text: "Retry",
            onPress: () => {
              setIsSigningIn(false);
              setTimeout(() => handleGoogleSignIn(), 100);
            },
            style: "cancel",
          },
        ],
        { cancelable: true },
      );
    } finally {
      console.log("🔐 Google Authentication - Completed");
      setIsSigningIn(false);
    }
  };

  const handleAppleSignIn = async () => {
    // Prevent multiple simultaneous sign-in attempts
    if (isAppleSigningIn || isSigningIn) {
      console.log("⚠️ Sign-in already in progress, ignoring duplicate request");
      return;
    }

    // Check if Apple Authentication is available
    if (!isAppleAvailable) {
      Alert.alert(
        "Not Available",
        "Sign in with Apple is not available on this device.",
      );
      return;
    }

    setIsAppleSigningIn(true);
    console.log("🍎 Apple Authentication - Starting...");

    try {
      if (!supabase) {
        console.error("CRITICAL: Supabase client is NOT initialized");
        throw new Error("Supabase client is not initialized");
      }

      // First, check for an existing session
      const {
        data: { session: existingSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("CRITICAL: Error checking session:", sessionError);
        throw sessionError;
      }

      if (existingSession) {
        console.log("VERBOSE: User is already signed in");
        setIsAppleSigningIn(false);
        return;
      }

      // Request Apple ID credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("🍎 Apple credential received:", {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        givenName: credential.fullName?.givenName,
        familyName: credential.fullName?.familyName,
      });

      // Log detailed fullName structure
      if (credential.fullName) {
        console.log(
          "🍎 fullName object:",
          JSON.stringify(credential.fullName, null, 2),
        );
      } else {
        console.log(
          "🍎 No fullName in credential (this happens on subsequent logins)",
        );
      }

      // Decode identity token to check audience (bundle ID)
      if (credential.identityToken) {
        try {
          const tokenParts = credential.identityToken.split(".");
          if (tokenParts.length >= 2) {
            // Decode base64 URL-safe string
            const base64Url = tokenParts[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(""),
            );
            const payload = JSON.parse(jsonPayload);
            console.log("🍎 ID Token payload:", {
              aud: payload.aud,
              iss: payload.iss,
              sub: payload.sub,
            });
            console.log("⚠️ Bundle ID in token (aud):", payload.aud);
            console.log("⚠️ Expected Bundle ID:", "com.cty0305.too.doo.list");
            console.log(
              "⚠️ Current EXPO_PUBLIC_APP_ENV:",
              process.env.EXPO_PUBLIC_APP_ENV || "not set",
            );
          }
        } catch (e) {
          console.warn("Could not decode identity token:", e);
        }
      }

      // Get the identity token from Apple
      if (!credential.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      // Sign in with Supabase using Apple identity token
      // Add retry mechanism for 502 errors (Bad Gateway)
      let data, error;
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second

      while (retryCount <= maxRetries) {
        const result = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
          nonce: credential.nonce || undefined,
        });

        data = result.data;
        error = result.error;

        // If no error, break the retry loop
        if (!error) {
          break;
        }

        // Check if it's a retryable error (502, 503, 504, or network errors)
        const isRetryableError =
          error?.status === 502 ||
          error?.status === 503 ||
          error?.status === 504 ||
          error?.name === "AuthRetryableFetchError" ||
          (error?.message && error.message.includes("fetch"));

        if (isRetryableError && retryCount < maxRetries) {
          retryCount++;
          console.log(
            `⚠️ Retryable error (${
              error?.status || "unknown"
            }), retrying... (${retryCount}/${maxRetries})`,
          );
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * retryCount),
          );
          continue;
        } else {
          // Not retryable or max retries reached
          break;
        }
      }

      if (error) {
        console.error("CRITICAL: Supabase sign-in failed:", error);
        console.error("Error status:", error?.status);
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        throw error;
      }

      if (data?.user) {
        console.log("🍎 ✅ Apple sign-in successful!");
        console.log("User:", data.user.email || data.user.id);
        console.log("Current user_metadata:", data.user.user_metadata);

        // Update user metadata if we got name from Apple
        // Note: Apple only returns fullName on the FIRST sign-in
        if (credential.fullName) {
          const fullName = credential.fullName
            ? `${credential.fullName.givenName || ""} ${
                credential.fullName.familyName || ""
              }`.trim()
            : null;

          if (fullName) {
            console.log("🍎 Got fullName from Apple:", fullName);

            // Check if user_metadata already has a name or display_name
            const existingName =
              data.user.user_metadata?.name ||
              data.user.user_metadata?.display_name;

            // Only update if we don't have a name yet, or if the new name is different
            if (!existingName || existingName !== fullName) {
              try {
                console.log(
                  "🍎 Updating user_metadata (name and display_name) to:",
                  fullName,
                );
                const { data: updateData, error: updateError } =
                  await supabase.auth.updateUser({
                    data: {
                      name: fullName,
                      display_name: fullName, // Also set display_name for Supabase Auth users table
                    },
                  });

                if (updateError) {
                  console.error("❌ Failed to update user name:", updateError);
                  console.error(
                    "Update error details:",
                    JSON.stringify(updateError, null, 2),
                  );
                } else {
                  console.log("✅ User name updated successfully:", fullName);
                  console.log(
                    "Updated user_metadata:",
                    JSON.stringify(updateData?.user?.user_metadata, null, 2),
                  );

                  // Verify the update by fetching the user again
                  try {
                    const { data: verifyData, error: verifyError } =
                      await supabase.auth.getUser();
                    if (verifyError) {
                      console.error(
                        "❌ Error verifying user update:",
                        verifyError,
                      );
                    } else {
                      console.log(
                        "🔍 Verification - user_metadata after update:",
                        JSON.stringify(
                          verifyData?.user?.user_metadata,
                          null,
                          2,
                        ),
                      );
                      console.log(
                        "🔍 Verification - name:",
                        verifyData?.user?.user_metadata?.name,
                      );
                      console.log(
                        "🔍 Verification - display_name:",
                        verifyData?.user?.user_metadata?.display_name,
                      );
                    }
                  } catch (verifyErr) {
                    console.warn("⚠️ Could not verify user update:", verifyErr);
                  }

                  // display_name 會自動在 updateUserSettings 中同步，無需手動同步
                }
              } catch (updateError) {
                console.error("❌ Error updating user name:", updateError);
              }
            } else {
              console.log(
                "ℹ️ User name already exists and matches:",
                existingName,
              );
            }
          } else {
            console.warn("⚠️ fullName is empty after processing");
            // If fullName is empty, use email prefix as fallback
            const emailPrefix = data.user.email?.split("@")[0] || "User";
            console.log("🍎 Using email prefix as display_name:", emailPrefix);

            const existingName =
              data.user.user_metadata?.name ||
              data.user.user_metadata?.display_name;

            if (!existingName || existingName === emailPrefix) {
              try {
                console.log(
                  "🍎 Setting display_name from email prefix:",
                  emailPrefix,
                );
                const { data: updateData, error: updateError } =
                  await supabase.auth.updateUser({
                    data: {
                      name: emailPrefix,
                      display_name: emailPrefix,
                    },
                  });

                if (updateError) {
                  console.error(
                    "❌ Failed to set email prefix as name:",
                    updateError,
                  );
                } else {
                  console.log(
                    "✅ Email prefix set as display_name:",
                    emailPrefix,
                  );

                  // display_name 會自動在 updateUserSettings 中同步，無需手動同步
                }
              } catch (updateError) {
                console.error(
                  "❌ Error setting email prefix as name:",
                  updateError,
                );
              }
            }
          }
        } else {
          console.log(
            "ℹ️ No fullName from Apple (this is normal for returning users)",
          );
          console.log(
            "Current user_metadata.name:",
            data.user.user_metadata?.name,
          );
          console.log(
            "Current user_metadata.display_name:",
            data.user.user_metadata?.display_name,
          );

          // If user doesn't have a name yet, set a default from email
          const existingName =
            data.user.user_metadata?.name ||
            data.user.user_metadata?.display_name;

          if (!existingName && data.user.email) {
            const emailPrefix = data.user.email.split("@")[0];
            console.log(
              "🍎 Setting default display_name from email:",
              emailPrefix,
            );

            try {
              const { data: updateData, error: updateError } =
                await supabase.auth.updateUser({
                  data: {
                    name: emailPrefix,
                    display_name: emailPrefix,
                  },
                });

              if (updateError) {
                console.error("❌ Failed to set default name:", updateError);
              } else {
                console.log("✅ Default name set successfully:", emailPrefix);

                // Also update display_name in user_settings table
                try {
                  await UserService.updateUserSettings({
                    display_name: emailPrefix,
                  });
                  console.log("✅ display_name synced to user_settings table");
                } catch (settingsError) {
                  console.warn(
                    "⚠️ Failed to sync display_name to user_settings:",
                    settingsError,
                  );
                }
              }
            } catch (updateError) {
              console.error("❌ Error setting default name:", updateError);
            }
          }
        }

        // The auth state change listener will handle navigation
        console.log("⏳ Waiting for auth state listener to navigate...");
      } else {
        throw new Error("No user data returned from Supabase");
      }
    } catch (error) {
      // Handle user cancellation silently - this is not an error
      if (error?.code === "ERR_REQUEST_CANCELED") {
        console.log("🍎 Apple sign-in cancelled by user");
        setIsAppleSigningIn(false);
        return;
      }

      // Log other errors
      console.error("CRITICAL: Apple Authentication Error:", {
        name: error?.name || "Unknown Error",
        message: error?.message || "No error message available",
        code: error?.code || "N/A",
        fullError: error,
      });

      // Log full error details for debugging
      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.error("Error stack:", error?.stack);

      let errorMessage =
        "An unexpected error occurred during sign in. Please try again.";

      if (
        error?.status === 502 ||
        error?.status === 503 ||
        error?.status === 504
      ) {
        errorMessage =
          "Server is temporarily unavailable. Please try again in a few moments.";
      } else if (error?.name === "AuthRetryableFetchError") {
        if (error?.status === 502) {
          errorMessage =
            "Server error (502). The authentication service is temporarily unavailable. Please try again later.";
        } else {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        }
      } else if (error?.message?.includes("network error")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (error?.message?.includes("Apple provider not found")) {
        errorMessage =
          "Apple sign-in is not properly configured. Please contact support.";
      } else if (error?.message?.includes("unacceptable audience")) {
        errorMessage =
          "Apple sign-in configuration error. The app bundle ID does not match. Please contact support.";
      } else if (error?.message) {
        // Show the actual error message if available
        errorMessage = error.message;
      }

      Alert.alert("Sign In Error", errorMessage, [
        {
          text: "OK",
          style: "default",
          onPress: () => setIsAppleSigningIn(false),
        },
      ]);
    } finally {
      console.log("🍎 Apple Authentication - Completed");
      setIsAppleSigningIn(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Image
          source={
            themeMode === "dark"
              ? require("./assets/logo-dark.png")
              : require("./assets/logo-white.png")
          }
          style={{ width: 200, height: 200, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: theme.text,
            marginBottom: 48,
            letterSpacing: 1,
          }}
        >
          {Platform.OS === "web"
            ? getAppDisplayName()
            : Application.applicationName || getAppDisplayName()}
        </Text>
        <View style={{ width: 260 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              borderWidth: 1,
              borderRadius: 4,
              paddingVertical: 12,
              justifyContent: "center",
              marginBottom: 10,
              width: "100%",
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: 2,
              elevation: 1,
              opacity: isSigningIn ? 0.5 : 1,
            }}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn || isAppleSigningIn}
          >
            {isSigningIn && !isAppleSigningIn ? (
              <>
                <Image
                  source={require("./assets/google-logo.png")}
                  style={{ width: 28, height: 28, marginRight: 4 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: theme.mode === "dark" ? theme.text : "#4285F4",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Signing in...
                </Text>
              </>
            ) : (
              <>
                <Image
                  source={require("./assets/google-logo.png")}
                  style={{ width: 28, height: 28, marginRight: 4 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: theme.mode === "dark" ? theme.text : "#4285F4",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {t.signInWithGoogle || "Sign in with Google"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {isAppleAvailable && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                borderWidth: 1,
                borderRadius: 4,
                paddingVertical: 12,
                justifyContent: "center",
                marginBottom: 10,
                width: "100%",
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: 2,
                elevation: 1,
                opacity: isAppleSigningIn ? 0.5 : 1,
              }}
              onPress={handleAppleSignIn}
              disabled={isAppleSigningIn || isSigningIn}
            >
              {isAppleSigningIn && !isSigningIn ? (
                <>
                  <Image
                    source={
                      theme.mode === "dark"
                        ? require("./assets/apple-100(dark).png")
                        : require("./assets/apple-90(light).png")
                    }
                    style={{ width: 24, height: 24, marginRight: 8 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      color: theme.mode === "dark" ? theme.text : "#000000",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Signing in...
                  </Text>
                </>
              ) : (
                <>
                  <Image
                    source={
                      theme.mode === "dark"
                        ? require("./assets/apple-100(dark).png")
                        : require("./assets/apple-90(light).png")
                    }
                    style={{ width: 24, height: 24, marginRight: 8 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      color: theme.mode === "dark" ? theme.text : "#000000",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    {t.signInWithApple || "Sign in with Apple"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {t.byContinuing}{" "}
          <Text
            style={{ color: theme.primary, fontWeight: "bold" }}
            onPress={() => navigation.navigate("Terms")}
          >
            {t.terms}
          </Text>{" "}
          {t.and}{" "}
          <Text
            style={{ color: theme.primary, fontWeight: "bold" }}
            onPress={() => navigation.navigate("Privacy")}
          >
            {t.privacy}
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
};

function TermsScreen() {
  const { t } = useContext(LanguageContext);
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.backgroundSecondary }}
      accessibilityViewIsModal={true}
      accessibilityLabel="Terms of Use Screen"
    >
      {/* Custom Header with Back Chevron */}
      <View
        style={{
          backgroundColor: theme.backgroundSecondary,
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginRight: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width={18} height={28}>
            <Line
              x1={12}
              y1={6}
              x2={4}
              y2={14}
              stroke={theme.text}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Line
              x1={4}
              y1={14}
              x2={12}
              y2={22}
              stroke={theme.text}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 48,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <Text
          style={{
            fontSize: 24,
            color: theme.text,
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          {t.termsTitle}
        </Text>

        <Text
          style={{
            fontSize: 13,
            color: theme.textSecondary,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          {t.termsLastUpdated} {new Date().toLocaleDateString()}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsAcceptance}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsAcceptanceText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsDescription}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsDescriptionText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsAccounts}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsAccountsText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsContent}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsContentText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsAcceptableUse}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsAcceptableUseText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsPrivacy}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsPrivacyText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsAvailability}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsAvailabilityText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsLiability}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsLiabilityText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsChanges}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsChangesText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.termsContact}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.termsContactText}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            marginTop: 32,
            lineHeight: 20,
          }}
        >
          {t.termsAcknowledgment}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyScreen() {
  const { t } = useContext(LanguageContext);
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.backgroundSecondary }}
      accessibilityViewIsModal={true}
      accessibilityLabel="Privacy Policy Screen"
    >
      {/* Custom Header with Back Chevron */}
      <View
        style={{
          backgroundColor: theme.backgroundSecondary,
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginRight: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width={18} height={28}>
            <Line
              x1={12}
              y1={6}
              x2={4}
              y2={14}
              stroke={theme.text}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Line
              x1={4}
              y1={14}
              x2={12}
              y2={22}
              stroke={theme.text}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 48,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <Text
          style={{
            fontSize: 24,
            color: theme.text,
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          {t.privacyTitle}
        </Text>

        <Text
          style={{
            fontSize: 13,
            color: theme.textSecondary,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          {t.privacyLastUpdated} {new Date().toLocaleDateString()}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyIntroduction}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyIntroductionText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyInformation}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          <Text style={{ fontWeight: "600" }}>{t.privacyAccountInfo}</Text>
          {"\n"}
          {t.privacyAccountInfoText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyUse}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyUseText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyStorage}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyStorageText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacySharing}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacySharingText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyThirdParty}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyThirdPartyText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyRights}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyRightsText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyRetention}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyRetentionText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyChildren}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyChildrenText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyInternational}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyInternationalText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyChanges}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyChangesText}
        </Text>

        <Text
          style={{
            fontSize: 17,
            color: theme.text,
            fontWeight: "700",
            marginTop: 24,
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
        >
          {t.privacyContact}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 24,
            lineHeight: 24,
          }}
        >
          {t.privacyContactText}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            marginTop: 32,
            lineHeight: 20,
          }}
        >
          {t.privacyAcknowledgment}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Loading Skeleton Component
const TaskSkeleton = ({ theme }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Web platform doesn't support useNativeDriver
    const useNativeDriver = Platform.OS !== "web";

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.taskItemRow}>
      <View style={styles.checkbox}>
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 4,
              backgroundColor:
                theme.mode === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.1)",
            },
            { opacity },
          ]}
        />
      </View>
      <View
        style={[
          styles.taskItem,
          {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.mode === "dark" ? "rgb(58, 58, 60)" : "#fff",
          },
        ]}
      >
        <View style={styles.taskTextContainer}>
          <Animated.View
            style={[
              {
                height: 16,
                borderRadius: 4,
                backgroundColor:
                  theme.mode === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                width: "80%",
              },
              { opacity },
            ]}
          />
        </View>
        <View style={styles.taskTimeContainer}>
          <Animated.View
            style={[
              {
                height: 14,
                borderRadius: 4,
                backgroundColor:
                  theme.mode === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                width: 50,
              },
              { opacity },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

function SettingScreen() {
  const { language, setLanguage, t } = useContext(LanguageContext);
  const { theme, themeMode, setThemeMode } = useContext(ThemeContext);
  const {
    userType,
    loadingUserType,
    setUserType,
    setUpdateInfo,
    setIsUpdateModalVisible,
    isSimulatingUpdate,
    setIsSimulatingUpdate,
  } = useContext(UserContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState(false);
  const [userName, setUserName] = useState("User");
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);
  const [themeDropdownVisible, setThemeDropdownVisible] = useState(false);
  const [userTypeDropdownVisible, setUserTypeDropdownVisible] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    times: [30, 10, 5], // 預設30分鐘、10分鐘和5分鐘前提醒
  });
  const [reminderDropdownVisible, setReminderDropdownVisible] = useState(false);
  const [versionInfo, setVersionInfo] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  // 模擬更新資料
  const effectiveHasUpdate = isSimulatingUpdate ? true : hasUpdate;
  const effectiveVersionInfo = isSimulatingUpdate
    ? {
        version: "1.2.1", // 模擬當前是舊版
        latestVersion: "1.2.2", // 模擬最新是 1.2.2
        releaseNotes: "這是一條模擬的更新說明，讓您測試非最新版使用者的畫面。",
        forceUpdate: false,
        updateUrl: "https://apps.apple.com/app/id6753785239",
      }
    : versionInfo;

  const [isCheckingVersion, setIsCheckingVersion] = useState(false);
  const [rateUsModalVisible, setRateUsModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState("suggestion");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const navigation = useNavigation();
  const userProfileCache = useRef(null); // Cache user profile to avoid redundant API calls

  // 使用者類型切換處理 (僅限開發模式)
  const handleUserTypeChange = async (newType) => {
    try {
      setUserType(newType);
      await UserService.updateUserSettings({ user_type: newType });
      // 更新緩存
      dataPreloadService.updateCachedUserSettings({ user_type: newType });
      if (Platform.OS !== "web") {
        Alert.alert(t.devTools, t.userTypeUpdated);
      } else {
        alert(t.userTypeUpdated);
      }
    } catch (error) {
      console.error("Error updating user type:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to update user type");
      } else {
        alert("Failed to update user type");
      }
    }
  };

  // Function to open App Store write review page
  const openAppStoreReview = async () => {
    try {
      const appId = "6753785239";
      const writeReviewUrl = `itms-apps://itunes.apple.com/app/id${appId}?action=write-review`;
      const regularUrl = `itms-apps://itunes.apple.com/app/id${appId}`;
      const httpsWriteReviewUrl = `https://apps.apple.com/app/id${appId}?action=write-review`;
      const httpsUrl = `https://apps.apple.com/app/id${appId}`;

      if (Platform.OS === "web") {
        window.open(httpsWriteReviewUrl, "_blank");
        return;
      }

      if (Platform.OS === "android") {
        const playStoreUrl = `https://play.google.com/store/apps/details?id=com.cty0305.too.doo.list`;
        try {
          await Linking.openURL(playStoreUrl);
        } catch (error) {
          await WebBrowser.openBrowserAsync(playStoreUrl);
        }
        return;
      }

      // iOS: Try multiple methods to open App Store write review page
      let opened = false;

      // First try: itms-apps:// with write-review action (iOS 10.3+)
      try {
        const canOpen = await Linking.canOpenURL(writeReviewUrl);
        if (canOpen) {
          await Linking.openURL(writeReviewUrl);
          opened = true;
          console.log("✅ [RateUs] Opened App Store write review page");
        }
      } catch (itmsError) {
        console.warn(
          "⚠️ [RateUs] itms-apps:// write-review failed:",
          itmsError,
        );
      }

      // Second try: Regular itms-apps:// URL
      if (!opened) {
        try {
          const canOpen = await Linking.canOpenURL(regularUrl);
          if (canOpen) {
            await Linking.openURL(regularUrl);
            opened = true;
            console.log("✅ [RateUs] Opened App Store page");
          }
        } catch (regularError) {
          console.warn(
            "⚠️ [RateUs] Regular itms-apps:// failed:",
            regularError,
          );
        }
      }

      // Third try: HTTPS URL with write-review action via WebBrowser
      if (!opened) {
        try {
          await WebBrowser.openBrowserAsync(httpsWriteReviewUrl);
          opened = true;
          console.log(
            "✅ [RateUs] Opened App Store via WebBrowser (write-review)",
          );
        } catch (browserError) {
          console.warn(
            "⚠️ [RateUs] WebBrowser write-review failed:",
            browserError,
          );
        }
      }

      // Fourth try: Regular HTTPS URL via WebBrowser
      if (!opened) {
        try {
          await WebBrowser.openBrowserAsync(httpsUrl);
          opened = true;
          console.log("✅ [RateUs] Opened App Store via WebBrowser");
        } catch (browserError) {
          console.warn("⚠️ [RateUs] WebBrowser failed:", browserError);
        }
      }

      // Final fallback: HTTPS with Linking
      if (!opened) {
        try {
          await Linking.openURL(httpsUrl);
          opened = true;
          console.log("✅ [RateUs] Opened App Store via Linking (fallback)");
        } catch (linkingError) {
          console.error("❌ [RateUs] All methods failed:", linkingError);
          Alert.alert(
            t.rateUs || "Rate Us",
            "無法開啟 App Store，請手動前往 App Store 搜尋「TaskCal」進行評分和評論。",
          );
        }
      }
    } catch (error) {
      console.error("❌ [RateUs] Error opening App Store:", error);
      Alert.alert(
        t.rateUs || "Rate Us",
        "無法開啟 App Store，請手動前往 App Store 搜尋「TaskCal」進行評分和評論。",
      );
    }
  };

  // Check for app updates
  useEffect(() => {
    const checkVersion = async () => {
      if (Platform.OS === "web") {
        return; // Skip version check on web
      }

      setIsCheckingVersion(true);
      try {
        const updateInfo = await versionService.checkForUpdates();
        const currentVersionInfo = versionService.getCurrentVersionInfo();

        // Combine current version info with update info
        setVersionInfo({
          ...currentVersionInfo,
          latestVersion: updateInfo.latestVersion,
          updateUrl: updateInfo.updateUrl,
          releaseNotes: updateInfo.releaseNotes,
          forceUpdate: updateInfo.forceUpdate,
        });
        setHasUpdate(updateInfo.hasUpdate);

        if (updateInfo.hasUpdate) {
          console.log(
            "🔔 [SettingScreen] Update available:",
            updateInfo.latestVersion,
          );
        }
      } catch (error) {
        console.error("❌ [SettingScreen] Error checking version:", error);
        const currentVersionInfo = versionService.getCurrentVersionInfo();
        setVersionInfo({
          ...currentVersionInfo,
          latestVersion: null,
          updateUrl: getUpdateUrl("production"),
        });
        setHasUpdate(false);
      } finally {
        setIsCheckingVersion(false);
      }
    };

    checkVersion();
  }, []);

  // Handle version item press - open App Store
  const handleVersionPress = async () => {
    if (Platform.OS === "web") {
      return;
    }

    // 如果有更新，顯示詳細的更新彈窗
    if (hasUpdate && versionInfo) {
      setUpdateInfo({
        ...versionInfo,
        releaseNotes: versionInfo.releaseNotes || "",
        forceUpdate: versionInfo.forceUpdate || false,
      });
      setIsUpdateModalVisible(true);
      return;
    }

    try {
      const httpsUrl = versionInfo?.updateUrl || getUpdateUrl("production");
      const appId = "6753785239"; // TaskCal App ID

      // Extract app ID from URL if not hardcoded
      const appIdMatch = httpsUrl.match(/\/id(\d+)/);
      const finalAppId = appIdMatch ? appIdMatch[1] : appId;

      // Check if running on simulator (simulator typically can't open itms-apps://)
      // In simulator, use HTTPS URL directly to avoid errors
      const isSimulator =
        Constants.deviceName?.includes("Simulator") ||
        Constants.isDevice === false ||
        __DEV__;

      if (isSimulator) {
        // In simulator, use HTTPS URL directly
        try {
          await Linking.openURL(httpsUrl);
          console.log(
            "🔗 [SettingScreen] Opened App Store (HTTPS - Simulator):",
            httpsUrl,
          );
          return;
        } catch (httpsError) {
          // Fallback to WebBrowser in simulator
          try {
            await WebBrowser.openBrowserAsync(httpsUrl);
            console.log(
              "🔗 [SettingScreen] Opened App Store (WebBrowser - Simulator):",
              httpsUrl,
            );
            return;
          } catch (browserError) {
            console.warn(
              "⚠️ [SettingScreen] Failed to open App Store in simulator:",
              browserError,
            );
          }
        }
      }

      // For real devices, try itms-apps:// first, then fallback to HTTPS
      const itmsUrl = `itms-apps://itunes.apple.com/app/id${finalAppId}`;

      // Check if we can open itms-apps:// URL scheme (silently catch errors)
      let canOpenItms = false;
      try {
        canOpenItms = await Linking.canOpenURL(itmsUrl);
      } catch (checkError) {
        // Silently ignore canOpenURL errors, will fallback to HTTPS
        canOpenItms = false;
      }

      if (canOpenItms) {
        // Try itms-apps:// first (best for real devices)
        try {
          await Linking.openURL(itmsUrl);
          console.log(
            "🔗 [SettingScreen] Opened App Store (itms-apps):",
            itmsUrl,
          );
          return;
        } catch (itmsError) {
          console.warn(
            "⚠️ [SettingScreen] itms-apps:// failed, trying HTTPS:",
            itmsError,
          );
        }
      }

      // Fallback to HTTPS URL
      try {
        await Linking.openURL(httpsUrl);
        console.log("🔗 [SettingScreen] Opened App Store (HTTPS):", httpsUrl);
      } catch (httpsError) {
        // Last resort: try using WebBrowser
        try {
          await WebBrowser.openBrowserAsync(httpsUrl);
          console.log(
            "🔗 [SettingScreen] Opened App Store (WebBrowser):",
            httpsUrl,
          );
        } catch (browserError) {
          console.warn(
            "⚠️ [SettingScreen] All methods failed to open App Store",
          );
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ [SettingScreen] Error opening App Store:",
        error.message,
      );
    }
  };

  useEffect(() => {
    const getUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        // 先檢查預載入的數據
        const cachedData = dataPreloadService.getCachedData();
        if (cachedData && cachedData.userProfile) {
          console.log("📦 [SettingScreen] Using preloaded user profile");
          userProfileCache.current = cachedData.userProfile;
          setUserProfile(cachedData.userProfile);
          setUserName(cachedData.userProfile.name);
          setIsLoadingProfile(false);
          return;
        }

        // Check cache first
        if (userProfileCache.current) {
          console.log("📦 [Cache] Using cached user profile");
          setUserProfile(userProfileCache.current);
          setUserName(userProfileCache.current.name);
          setIsLoadingProfile(false);
          return;
        }

        const profile = await UserService.getUserProfile();
        if (profile) {
          userProfileCache.current = profile; // Cache the profile
          setUserProfile(profile);
          setUserName(profile.name);
        } else {
          setUserName("User");
        }
      } catch (error) {
        console.error("Error retrieving user profile:", error);
        setUserName("User");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    getUserProfile();
  }, []);

  // 使用 ref 來追蹤是否已經載入過 reminder 設定，避免重新掛載時重置
  const reminderSettingsLoadedRef = useRef(false);

  // 載入提醒設定
  useEffect(() => {
    const loadReminderSettings = async () => {
      // 如果已經載入過且當前狀態不是預設值，不要重新載入
      // 這可以防止組件重新掛載時重置用戶的設定
      if (
        reminderSettingsLoadedRef.current &&
        JSON.stringify(reminderSettings) !==
          JSON.stringify({ enabled: true, times: [30, 10, 5] })
      ) {
        console.log(
          "📦 [SettingScreen] Reminder settings already loaded, skipping reload",
        );
        return;
      }

      setIsLoadingSettings(true);
      try {
        // 先檢查預載入的數據
        const cachedData = dataPreloadService.getCachedData();
        let settings = cachedData?.userSettings;

        if (!settings) {
          settings = await UserService.getUserSettings();
        } else {
          console.log("📦 [SettingScreen] Using preloaded user settings");
        }

        if (settings.user_type) {
          setUserType(settings.user_type);
        }

        if (
          settings.reminder_settings &&
          typeof settings.reminder_settings === "object"
        ) {
          const isEnabled = settings.reminder_settings.enabled === true;

          // 如果 enabled 為 false，只設置 enabled: false（不包含 times）
          // 如果 enabled 為 true，才包含 times 陣列
          if (isEnabled && Array.isArray(settings.reminder_settings.times)) {
            setReminderSettings({
              enabled: true,
              times: settings.reminder_settings.times || [30, 10, 5],
            });
          } else {
            // enabled 為 false 或沒有 times 陣列
            setReminderSettings({
              enabled: false,
              times: [30, 10, 5], // UI 顯示用，但不會存到 Supabase
            });
          }
        } else {
          // 確保有預設值
          setReminderSettings({
            enabled: true,
            times: [30, 10, 5],
          });
        }

        reminderSettingsLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading reminder settings:", error);
        // 錯誤時使用預設值
        setReminderSettings({
          enabled: true,
          times: [30, 10, 5],
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadReminderSettings();
  }, []); // 只在組件掛載時執行一次

  // 注意：不再在語言切換時從緩存同步 reminder 設定
  // 因為用戶可能剛剛更新了 reminder 設定，應該保持當前狀態
  // 只有在組件首次載入時才從緩存讀取 reminder 設定

  // 當頁面獲得焦點時，關閉所有下拉選單
  useFocusEffect(
    React.useCallback(() => {
      setLanguageDropdownVisible(false);
      setThemeDropdownVisible(false);
      setReminderDropdownVisible(false);
    }, []),
  );

  // 更新提醒設定
  const updateReminderSettings = async (newSettings) => {
    const isEnabled = newSettings.enabled === true;
    const wasEnabled = reminderSettings?.enabled === true;

    // 如果 enabled 為 false，只存儲 { enabled: false }
    // 如果 enabled 為 true，才包含 times 陣列
    // 如果從 disabled 切換到 enabled，預設開啟所有三個時間
    const normalizedSettings = isEnabled
      ? {
          enabled: true,
          times:
            Array.isArray(newSettings.times) && newSettings.times.length > 0
              ? newSettings.times
              : [30, 10, 5], // 啟用時預設全開
        }
      : {
          enabled: false,
        };

    // 保存之前的設定，以便錯誤時恢復
    const previousSettings = { ...reminderSettings };

    // 樂觀更新：先更新 UI，讓用戶立即看到變化
    setReminderSettings(normalizedSettings);

    // 如果用戶關閉提醒，取消所有已安排的任務通知
    if (!isEnabled) {
      console.log(
        "Reminder notifications disabled, cancelling all task notifications",
      );
      // 在背景執行，不阻塞 UI
      cancelAllNotifications().catch((error) => {
        console.error("Error cancelling notifications:", error);
      });
    }

    // 在背景更新 Supabase，不阻塞 UI
    try {
      const result = await UserService.updateUserSettings({
        reminder_settings: normalizedSettings,
      });

      // 更新緩存，確保語言切換時不會讀取到舊的 reminder 設定
      if (result) {
        dataPreloadService.updateCachedUserSettings(result);
      }

      // 如果 Supabase 返回的結果與我們保存的不同，使用 Supabase 的結果
      // 這可以處理競態條件：如果用戶在更新期間切換語言，確保狀態一致
      if (result && result.reminder_settings) {
        const savedSettings = result.reminder_settings;
        const isSavedEnabled = savedSettings.enabled === true;
        if (isSavedEnabled && Array.isArray(savedSettings.times)) {
          // 只有當 Supabase 的結果與當前 UI 狀態不同時才更新
          if (
            savedSettings.enabled !== normalizedSettings.enabled ||
            JSON.stringify(savedSettings.times) !==
              JSON.stringify(normalizedSettings.times)
          ) {
            setReminderSettings({
              enabled: true,
              times: savedSettings.times || [30, 10, 5],
            });
          }
        } else if (!isSavedEnabled && normalizedSettings.enabled) {
          // Supabase 返回 disabled，但我們設置為 enabled，使用 Supabase 的結果
          setReminderSettings({
            enabled: false,
            times: [30, 10, 5],
          });
        }
      }
    } catch (error) {
      // 檢查是否為網絡錯誤
      const isNetworkError =
        error.message?.includes("Network request failed") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("network") ||
        (!error.code && error.message);

      if (isNetworkError) {
        console.warn(
          "⚠️ Network error updating reminder settings. UI will revert to previous state.",
        );
        // 發生網絡錯誤時恢復之前的設定
        setReminderSettings(previousSettings);
      } else {
        console.error("❌ Error updating reminder settings:", {
          code: error.code,
          message: error.message,
        });
        // 發生其他錯誤時也恢復之前的設定
        setReminderSettings(previousSettings);
      }
    }
  };

  const openModal = (text) => {
    setModalText(text);
    setModalVisible(true);
  };

  const handleLogout = async () => {
    try {
      setLogoutModalVisible(false);

      // Mixpanel: 追蹤登出事件
      mixpanelService.track("User Signed Out", {
        platform: Platform.OS,
      });
      mixpanelService.reset();

      // 清除預載入緩存
      dataPreloadService.clearCache();

      // Try to log out (using Supabase's signOut API)
      // Even if this fails (e.g., network error), we should still navigate to splash
      // because the local session will be cleared
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn("Log out error (continuing anyway):", error);
          // Continue with navigation even if signOut fails
        }
      } catch (signOutError) {
        console.warn("Log out exception (continuing anyway):", signOutError);
        // Continue with navigation even if signOut throws
      }

      // Navigate back to splash screen immediately after logout
      // This should happen regardless of whether signOut succeeded or failed
      navigation.reset({
        index: 0,
        routes: [{ name: "Splash" }],
      });
    } catch (error) {
      console.error("Error logging out:", error);
      console.error("Error details:", {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
      });

      // Even if there's an error, try to navigate to splash screen
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: "Splash" }],
        });
      } catch (navError) {
        console.error("Error navigating to splash:", navError);
      }

      // Show detailed error message
      const errorMessage =
        error?.message || "Failed to log out. Please try again.";
      setModalText(t.logoutError || errorMessage);
      setModalVisible(true);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteAccountModalVisible(false);

      // Call deleteUser service
      await UserService.deleteUser();

      // Navigate back to splash screen after successful deletion
      navigation.reset({
        index: 0,
        routes: [{ name: "Splash" }],
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage =
        error?.message ||
        t.deleteAccountError ||
        "Failed to delete account. Please try again.";
      setModalText(errorMessage);
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.backgroundSecondary }}
    >
      <View
        style={{
          backgroundColor: theme.backgroundSecondary,
          height: 64,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 22,
            color: theme.text,
            fontWeight: "bold",
            letterSpacing: 0.5,
            textAlign: "left",
            paddingLeft: 24,
          }}
        >
          {t.settings}
        </Text>
      </View>
      <ScrollView
        style={{
          flex: 1,
          paddingHorizontal: 0,
          backgroundColor: theme.backgroundSecondary,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section Title */}
        <View style={{ marginTop: 24, marginBottom: 12 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              fontWeight: "600",
              marginLeft: 28,
              marginBottom: 0,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            {t.account}
          </Text>
        </View>
        {/* Account Info Card */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            marginHorizontal: 20,
            marginTop: 0,
            marginBottom: 0,
            padding: 20,
            shadowColor: theme.shadow,
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 6,
            elevation: 1,
            borderWidth: 1,
            borderColor: theme.cardBorder,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            {isLoadingProfile ? (
              <>
                <Animated.View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 15,
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    opacity: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.7],
                    }),
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Animated.View
                    style={{
                      height: 20,
                      borderRadius: 4,
                      backgroundColor:
                        theme.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      width: "60%",
                      marginBottom: 8,
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.7],
                      }),
                    }}
                  />
                  <Animated.View
                    style={{
                      height: 14,
                      borderRadius: 4,
                      backgroundColor:
                        theme.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      width: "40%",
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.7],
                      }),
                    }}
                  />
                </View>
              </>
            ) : (
              <>
                {userProfile?.avatar_url ? (
                  <Image
                    source={{ uri: userProfile.avatar_url }}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      marginRight: 15,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      marginRight: 15,
                      backgroundColor: theme.primary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      {(userProfile?.name || userName || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 16,
                      marginBottom: 5,
                      fontWeight: "600",
                    }}
                  >
                    {userProfile?.name || userName || "User"}
                  </Text>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 14,
                      marginBottom: 0,
                    }}
                  >
                    {userProfile?.email || "No email available"}
                  </Text>
                </View>
              </>
            )}
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.divider,
              paddingTop: 15,
            }}
          >
            {isLoadingProfile ? (
              <>
                <Animated.View
                  style={{
                    height: 12,
                    borderRadius: 4,
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    width: "40%",
                    marginBottom: 8,
                    opacity: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.7],
                    }),
                  }}
                />
                <Animated.View
                  style={{
                    height: 14,
                    borderRadius: 4,
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    width: "50%",
                    opacity: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.7],
                    }),
                  }}
                />
              </>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {t.accountType}
                  </Text>
                  <View
                    style={{
                      backgroundColor:
                        userType === "member"
                          ? theme.primary
                          : theme.mode === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.05)",
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: userType === "member" ? "#FFFFFF" : theme.text,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {userType === "member" ? t.memberUser : t.generalUser}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.divider,
                    marginBottom: 12,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {t.loginMethod}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {userProfile?.provider === "apple" ? (
                      <Image
                        source={
                          theme.mode === "dark"
                            ? require("./assets/apple-100(dark).png")
                            : require("./assets/apple-90(light).png")
                        }
                        style={{ width: 18, height: 18, marginRight: 8 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Image
                        source={require("./assets/google-logo.png")}
                        style={{ width: 18, height: 18, marginRight: 8 }}
                        resizeMode="contain"
                      />
                    )}
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {userProfile?.provider === "apple"
                        ? t.appleAccount
                        : userProfile?.provider === "google"
                          ? t.googleAccount
                          : t.googleAccount}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Developer Tools */}
        {__DEV__ && (
          <View style={{ marginTop: 24, marginBottom: 8 }}>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 13,
                fontWeight: "600",
                marginLeft: 28,
                marginBottom: 12,
                letterSpacing: 0.3,
                textTransform: "uppercase",
              }}
            >
              {t.devTools || "Developer Tools"}
            </Text>
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                marginHorizontal: 20,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                shadowColor: theme.shadow,
                shadowOpacity: theme.shadowOpacity,
                shadowRadius: 6,
                elevation: 1,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => handleUserTypeChange("member")}
                activeOpacity={0.6}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor:
                    userType === "member"
                      ? theme.calendarSelected
                      : "transparent",
                }}
              >
                <MaterialIcons
                  name="card-membership"
                  size={20}
                  color={
                    userType === "member" ? theme.primary : theme.textSecondary
                  }
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    color: userType === "member" ? theme.primary : theme.text,
                    fontSize: 15,
                    fontWeight: userType === "member" ? "600" : "400",
                  }}
                >
                  {t.switchToMember || "Switch to Member"}
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.divider,
                  marginHorizontal: 20,
                }}
              />

              <TouchableOpacity
                onPress={() => handleUserTypeChange("general")}
                activeOpacity={0.6}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor:
                    userType === "general"
                      ? theme.calendarSelected
                      : "transparent",
                }}
              >
                <MaterialIcons
                  name="person-outline"
                  size={20}
                  color={
                    userType === "general" ? theme.primary : theme.textSecondary
                  }
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    color: userType === "general" ? theme.primary : theme.text,
                    fontSize: 15,
                    fontWeight: userType === "general" ? "600" : "400",
                  }}
                >
                  {t.switchToGeneral || "Switch to General"}
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.divider,
                  marginHorizontal: 20,
                }}
              />

              <TouchableOpacity
                onPress={() => {
                  setUpdateInfo({
                    latestVersion: "1.3.0",
                    releaseNotes:
                      "新版本功能：\n• 支援 iOS 原生風格更新彈窗\n• 優化深色模式顯示效果\n• 提升應用程式啟動速度\n• 修復已知的小錯誤",
                    forceUpdate: false,
                    updateUrl: "https://apps.apple.com/app/id6753785239",
                  });
                  setIsUpdateModalVisible(true);
                }}
                activeOpacity={0.6}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                }}
              >
                <MaterialIcons
                  name="system-update"
                  size={20}
                  color={theme.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: theme.text, fontSize: 15 }}>
                  {"Test Update Modal"}
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.divider,
                  marginHorizontal: 20,
                }}
              />

              <TouchableOpacity
                onPress={() => setIsSimulatingUpdate(!isSimulatingUpdate)}
                activeOpacity={0.6}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: isSimulatingUpdate
                    ? theme.primary + "10"
                    : "transparent",
                }}
              >
                <MaterialIcons
                  name={isSimulatingUpdate ? "toggle-on" : "toggle-off"}
                  size={24}
                  color={
                    isSimulatingUpdate ? theme.primary : theme.textSecondary
                  }
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: isSimulatingUpdate ? theme.primary : theme.text,
                      fontSize: 15,
                      fontWeight: isSimulatingUpdate ? "600" : "400",
                    }}
                  >
                    {"Simulate Update Available"}
                  </Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                    {"Force Settings UI to show 'Update Available'"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* General Section */}
        <View style={{ marginTop: 24, marginBottom: 8 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              fontWeight: "600",
              marginLeft: 28,
              marginBottom: 12,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            {t.general}
          </Text>
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 16,
              marginHorizontal: 20,
              overflow: "hidden",
              shadowColor: theme.shadow,
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: 6,
              elevation: 1,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            {/* Language Selection */}
            <TouchableOpacity
              onPress={() => {
                setLanguageDropdownVisible(!languageDropdownVisible);
                setThemeDropdownVisible(false);
                setReminderDropdownVisible(false);
              }}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <MaterialIcons
                  name="language"
                  size={20}
                  color={theme.primary}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: "500" }}
                >
                  {t.language}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    marginRight: 4,
                  }}
                >
                  {language === "en"
                    ? t.english
                    : language === "zh"
                      ? t.chinese
                      : t.spanish}
                </Text>
                <MaterialIcons
                  name={
                    languageDropdownVisible
                      ? "keyboard-arrow-up"
                      : "keyboard-arrow-right"
                  }
                  size={20}
                  color={theme.textTertiary}
                />
              </View>
            </TouchableOpacity>

            {languageDropdownVisible && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.divider,
                  backgroundColor:
                    themeMode === "light"
                      ? "#f9f9f9"
                      : theme.backgroundTertiary,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setLanguage("en");
                    setLanguageDropdownVisible(false);
                  }}
                  activeOpacity={0.6}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 52,
                    backgroundColor:
                      language === "en"
                        ? theme.calendarSelected
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color:
                        language === "en" ? theme.primary : theme.textSecondary,
                      fontSize: 15,
                      fontWeight: language === "en" ? "600" : "400",
                    }}
                  >
                    {t.english}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setLanguage("zh");
                    setLanguageDropdownVisible(false);
                  }}
                  activeOpacity={0.6}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 52,
                    backgroundColor:
                      language === "zh"
                        ? theme.calendarSelected
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color:
                        language === "zh" ? theme.primary : theme.textSecondary,
                      fontSize: 15,
                      fontWeight: language === "zh" ? "600" : "400",
                    }}
                  >
                    {t.chinese}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setLanguage("es");
                    setLanguageDropdownVisible(false);
                  }}
                  activeOpacity={0.6}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 52,
                    backgroundColor:
                      language === "es"
                        ? theme.calendarSelected
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color:
                        language === "es" ? theme.primary : theme.textSecondary,
                      fontSize: 15,
                      fontWeight: language === "es" ? "600" : "400",
                    }}
                  >
                    {t.spanish}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                marginHorizontal: 20,
              }}
            />

            {/* Theme Selection */}
            <TouchableOpacity
              onPress={() => {
                setThemeDropdownVisible(!themeDropdownVisible);
                setLanguageDropdownVisible(false);
                setReminderDropdownVisible(false);
              }}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <MaterialIcons
                  name="palette"
                  size={20}
                  color={theme.primary}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: "500" }}
                >
                  {t.theme}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    marginRight: 4,
                  }}
                >
                  {themeMode === "light" ? t.lightMode : t.darkMode}
                </Text>
                <MaterialIcons
                  name={
                    themeDropdownVisible
                      ? "keyboard-arrow-up"
                      : "keyboard-arrow-right"
                  }
                  size={20}
                  color={theme.textTertiary}
                />
              </View>
            </TouchableOpacity>

            {themeDropdownVisible && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.divider,
                  backgroundColor:
                    themeMode === "light"
                      ? "#f9f9f9"
                      : theme.backgroundTertiary,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setThemeMode("light");
                    setThemeDropdownVisible(false);
                  }}
                  activeOpacity={0.6}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 52,
                    backgroundColor:
                      themeMode === "light"
                        ? theme.calendarSelected
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color:
                        themeMode === "light"
                          ? theme.primary
                          : theme.textSecondary,
                      fontSize: 15,
                      fontWeight: themeMode === "light" ? "600" : "400",
                    }}
                  >
                    {t.lightMode}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setThemeMode("dark");
                    setThemeDropdownVisible(false);
                  }}
                  activeOpacity={0.6}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 52,
                    backgroundColor:
                      themeMode === "dark"
                        ? theme.calendarSelected
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color:
                        themeMode === "dark"
                          ? theme.primary
                          : theme.textSecondary,
                      fontSize: 15,
                      fontWeight: themeMode === "dark" ? "600" : "400",
                    }}
                  >
                    {t.darkMode}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                marginHorizontal: 20,
              }}
            />

            {/* Reminder Settings */}
            <TouchableOpacity
              onPress={() => {
                setReminderDropdownVisible(!reminderDropdownVisible);
                setLanguageDropdownVisible(false);
                setThemeDropdownVisible(false);
              }}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                {isLoadingSettings ? (
                  <Animated.View
                    style={{
                      height: 16,
                      borderRadius: 4,
                      backgroundColor:
                        theme.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      width: "60%",
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.7],
                      }),
                    }}
                  />
                ) : (
                  <>
                    <MaterialIcons
                      name="notifications"
                      size={20}
                      color={theme.primary}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 16,
                        fontWeight: "500",
                      }}
                    >
                      {t.reminderSettings}
                    </Text>
                  </>
                )}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {!isLoadingSettings && (
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 14,
                      marginRight: 4,
                    }}
                  >
                    {reminderSettings?.enabled === true
                      ? t.reminderEnabled
                      : t.reminderDisabled}
                  </Text>
                )}
                <MaterialIcons
                  name={
                    reminderDropdownVisible
                      ? "keyboard-arrow-up"
                      : "keyboard-arrow-right"
                  }
                  size={20}
                  color={theme.textTertiary}
                />
              </View>
            </TouchableOpacity>

            {reminderDropdownVisible && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.divider,
                  backgroundColor:
                    themeMode === "light"
                      ? "#f9f9f9"
                      : theme.backgroundTertiary,
                  paddingVertical: 8,
                }}
              >
                {/* 啟用/停用提醒 */}
                <TouchableOpacity
                  onPress={() => {
                    try {
                      const newEnabled = !(reminderSettings?.enabled === true);
                      const newTimes = newEnabled
                        ? [30, 10, 5]
                        : Array.isArray(reminderSettings?.times)
                          ? reminderSettings.times
                          : [30, 10, 5];
                      updateReminderSettings({
                        enabled: newEnabled,
                        times: newTimes,
                      });
                    } catch (error) {
                      console.error("Error toggling reminder enabled:", error);
                    }
                  }}
                  activeOpacity={0.6}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: 15 }}>
                    {t.reminderEnabled}
                  </Text>
                  <MaterialIcons
                    name={
                      reminderSettings?.enabled !== false
                        ? "check-box"
                        : "check-box-outline-blank"
                    }
                    size={24}
                    color={
                      reminderSettings?.enabled !== false
                        ? theme.primary
                        : theme.textTertiary
                    }
                  />
                </TouchableOpacity>

                {reminderSettings?.enabled !== false && (
                  <>
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: theme.divider,
                        marginVertical: 4,
                      }}
                    />

                    {/* 提醒時間選項 */}
                    {[
                      { value: 30, label: t.reminder30min },
                      { value: 10, label: t.reminder10min },
                      { value: 5, label: t.reminder5min },
                    ].map((option) => {
                      const times = Array.isArray(reminderSettings.times)
                        ? reminderSettings.times
                        : [30, 10, 5];
                      const isSelected = times.includes(option.value);

                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => {
                            const currentTimes = Array.isArray(
                              reminderSettings.times,
                            )
                              ? reminderSettings.times
                              : [30, 10, 5];
                            const newTimes = isSelected
                              ? currentTimes.filter(
                                  (time) => time !== option.value,
                                )
                              : [...currentTimes, option.value].sort(
                                  (a, b) => b - a,
                                );

                            updateReminderSettings({
                              ...reminderSettings,
                              times: newTimes,
                            });
                          }}
                          activeOpacity={0.6}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingVertical: 12,
                            paddingHorizontal: 20,
                          }}
                        >
                          <Text style={{ color: theme.text, fontSize: 15 }}>
                            {option.label}
                          </Text>
                          <MaterialIcons
                            name={
                              isSelected
                                ? "check-box"
                                : "check-box-outline-blank"
                            }
                            size={24}
                            color={
                              isSelected ? theme.primary : theme.textTertiary
                            }
                          />
                        </TouchableOpacity>
                      );
                    })}

                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: theme.divider,
                        marginVertical: 4,
                      }}
                    />
                    <Text
                      style={{
                        color: theme.textTertiary,
                        fontSize: 12,
                        paddingHorizontal: 20,
                        paddingVertical: 8,
                        fontStyle: "italic",
                      }}
                    >
                      {t.reminderNote}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={{ marginTop: 24, marginBottom: 8 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              fontWeight: "600",
              marginLeft: 28,
              marginBottom: 12,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            {t.support}
          </Text>
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 16,
              marginHorizontal: 20,
              overflow: "hidden",
              shadowColor: theme.shadow,
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: 6,
              elevation: 1,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            {/* Rate Us on App Store */}
            <TouchableOpacity
              onPress={async () => {
                // iOS: Try native StoreReview first (shows native iOS rating dialog)
                if (
                  Platform.OS === "ios" &&
                  StoreReview &&
                  StoreReview.isAvailableAsync
                ) {
                  try {
                    const isAvailable = await StoreReview.isAvailableAsync();
                    if (isAvailable) {
                      await StoreReview.requestReview();
                      return;
                    }
                  } catch (reviewError) {
                    console.warn(
                      "StoreReview not available:",
                      reviewError.message,
                    );
                  }
                }
                setRateUsModalVisible(true);
              }}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <MaterialIcons
                  name="star"
                  size={20}
                  color={theme.primary}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: "500" }}
                >
                  {t.rateUs || "Rate Us"}
                </Text>
              </View>
              <MaterialIcons
                name="open-in-new"
                size={20}
                color={theme.textTertiary}
              />
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                marginHorizontal: 20,
              }}
            />

            {/* Send Feedback Button */}
            <TouchableOpacity
              onPress={() => setFeedbackModalVisible(true)}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <MaterialIcons
                  name="feedback"
                  size={20}
                  color={theme.primary}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: "500" }}
                >
                  {t.feedback || "Send Feedback"}
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={20}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Rate Us Modal with Brand Colors */}
        <Modal
          visible={rateUsModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRateUsModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 20,
                padding: 28,
                width: "100%",
                maxWidth: 400,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              {/* Title */}
              <Text
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: "600",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                喜歡 TaskCal 嗎？
              </Text>

              {/* Description */}
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 15,
                  marginBottom: 20,
                  textAlign: "center",
                  lineHeight: 22,
                }}
              >
                點擊星星為我們評分，這會幫助更多用戶發現我們
              </Text>

              {/* Star Rating */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 28,
                  gap: 8,
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons
                      name={star <= rating ? "star" : "star-border"}
                      size={44}
                      color={
                        star <= rating
                          ? "#6c63ff" // Brand color (purple)
                          : theme.textTertiary
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={{ gap: 12 }}>
                {/* Submit Button - Brand Color */}
                <TouchableOpacity
                  onPress={async () => {
                    if (rating === 0) {
                      Alert.alert("提示", "請先選擇評分", [
                        { text: "好", style: "default" },
                      ]);
                      return;
                    }
                    setRateUsModalVisible(false);
                    setRating(0);
                    await openAppStoreReview();
                  }}
                  activeOpacity={0.8}
                  disabled={rating === 0}
                  style={{
                    backgroundColor:
                      rating === 0 ? theme.textTertiary : "#6c63ff", // Brand color (purple)
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    alignItems: "center",
                    shadowColor: "#6c63ff",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: rating === 0 ? 0 : 0.3,
                    shadowRadius: 4,
                    elevation: rating === 0 ? 0 : 3,
                    opacity: rating === 0 ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    提交
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={() => {
                    setRateUsModalVisible(false);
                    setRating(0);
                  }}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 15,
                      fontWeight: "500",
                    }}
                  >
                    取消
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Feedback Form Modal */}
        <Modal
          visible={feedbackModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            if (!isSubmittingFeedback) setFeedbackModalVisible(false);
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: "100%" }}
            >
              <View
                style={{
                  backgroundColor: theme.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  maxHeight: Dimensions.get("window").height * 0.85,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 20,
                      fontWeight: "700",
                    }}
                  >
                    {t.feedback || "Send Feedback"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFeedbackModalVisible(false)}
                    disabled={isSubmittingFeedback}
                  >
                    <MaterialIcons
                      name="close"
                      size={24}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Category Selection */}
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 12,
                    }}
                  >
                    {t.feedbackType}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    {[
                      { id: "bug", label: t.bugReport, icon: "bug-report" },
                      {
                        id: "suggestion",
                        label: t.improvementSuggestion,
                        icon: "auto-fix-high",
                      },
                      {
                        id: "feature",
                        label: t.featureRequest,
                        icon: "auto-awesome",
                      },
                      {
                        id: "other",
                        label: t.feedbackOther,
                        icon: "more-horiz",
                      },
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setFeedbackCategory(cat.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 20,
                          backgroundColor:
                            feedbackCategory === cat.id
                              ? theme.primary
                              : theme.background,
                          borderWidth: 1,
                          borderColor:
                            feedbackCategory === cat.id
                              ? theme.primary
                              : theme.divider,
                        }}
                      >
                        <MaterialIcons
                          name={cat.icon}
                          size={16}
                          color={
                            feedbackCategory === cat.id ? "#fff" : theme.text
                          }
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            color:
                              feedbackCategory === cat.id ? "#fff" : theme.text,
                            fontSize: 14,
                            fontWeight:
                              feedbackCategory === cat.id ? "600" : "400",
                          }}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Feedback Text Area */}
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 12,
                    }}
                  >
                    {t.feedbackDetails}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderRadius: 12,
                      padding: 16,
                      minHeight: 120,
                      textAlignVertical: "top",
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: theme.divider,
                    }}
                    placeholder={t.feedbackPlaceholder}
                    placeholderTextColor={theme.textTertiary}
                    multiline={true}
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    maxLength={1000}
                  />
                  <Text
                    style={{
                      color: theme.textTertiary,
                      fontSize: 12,
                      textAlign: "right",
                      marginTop: 4,
                      marginBottom: 20,
                    }}
                  >
                    {feedbackText.length} / 1000
                  </Text>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={async () => {
                      if (!feedbackText.trim()) {
                        Alert.alert(t.confirm, t.pleaseEnterFeedback);
                        return;
                      }

                      setIsSubmittingFeedback(true);
                      try {
                        const {
                          data: { user },
                        } = await supabase.auth.getUser();

                        if (!user) {
                          Alert.alert(t.confirm, t.pleaseLoginFirst);
                          setIsSubmittingFeedback(false);
                          return;
                        }

                        const { error } = await supabase
                          .from("user_feedback")
                          .insert({
                            user_id: user.id,
                            email: user.email,
                            category: feedbackCategory,
                            feedback: feedbackText.trim(),
                            app_version: Application.nativeApplicationVersion,
                            build_number: Application.nativeBuildVersion,
                            os_version: Platform.Version,
                            platform: Platform.OS,
                          });

                        if (error) throw error;

                        // Mixpanel: Track feedback submission
                        mixpanelService.track("Feedback Submitted", {
                          category: feedbackCategory,
                          feedback_length: feedbackText.trim().length,
                          app_version: Application.nativeApplicationVersion,
                          platform: Platform.OS,
                        });

                        Alert.alert(t.submitSuccess, t.thanksFeedback, [
                          {
                            text: t.done,
                            onPress: () => {
                              setFeedbackModalVisible(false);
                              setFeedbackText("");
                              setFeedbackCategory("suggestion");
                            },
                          },
                        ]);
                      } catch (err) {
                        console.error("Error submitting feedback:", err);
                        Alert.alert(t.submitFailed, t.pleaseTryAgainLater);
                      } finally {
                        setIsSubmittingFeedback(false);
                      }
                    }}
                    disabled={isSubmittingFeedback || !feedbackText.trim()}
                    style={{
                      backgroundColor:
                        isSubmittingFeedback || !feedbackText.trim()
                          ? theme.textTertiary
                          : "#6c63ff", // Brand purple
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {isSubmittingFeedback ? t.submitting : t.submitFeedback}
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      color: theme.textTertiary,
                      fontSize: 13,
                      textAlign: "center",
                      marginBottom: 40,
                      lineHeight: 18,
                    }}
                  >
                    {t.feedbackMotivation}
                  </Text>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* About & Legal Section */}
        <View style={{ marginTop: 24, marginBottom: 8 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              fontWeight: "600",
              marginLeft: 28,
              marginBottom: 12,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            {t.about || "About"}
          </Text>
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 16,
              marginHorizontal: 20,
              overflow: "hidden",
              shadowColor: theme.shadow,
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: 6,
              elevation: 1,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            {/* Terms of Use */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Terms")}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <MaterialIcons
                  name="description"
                  size={20}
                  color={theme.primary}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: "500" }}
                >
                  {t.terms}
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={20}
                color={theme.textTertiary}
              />
            </TouchableOpacity>

            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                marginHorizontal: 20,
              }}
            />

            {/* Privacy Policy */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Privacy")}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <MaterialIcons
                  name="privacy-tip"
                  size={20}
                  color={theme.primary}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: "500" }}
                >
                  {t.privacy}
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={20}
                color={theme.textTertiary}
              />
            </TouchableOpacity>

            {Platform.OS !== "web" && (
              <>
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.divider,
                    marginHorizontal: 20,
                  }}
                />

                {/* Version Info */}
                {effectiveHasUpdate ? (
                  <TouchableOpacity
                    onPress={handleVersionPress}
                    activeOpacity={0.6}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <MaterialIcons
                        name="system-update"
                        size={20}
                        color={theme.primary}
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: 16,
                          fontWeight: "500",
                        }}
                      >
                        {t.version}{" "}
                        {effectiveVersionInfo?.version ||
                          Application.nativeApplicationVersion ||
                          "1.2.2"}
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          backgroundColor: theme.primary + "20",
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          marginRight: 10,
                          borderWidth: 1,
                          borderColor: theme.primary + "60",
                        }}
                      >
                        <Text
                          style={{
                            color: theme.primary,
                            fontSize: 10,
                            fontWeight: "700",
                            letterSpacing: 0.3,
                          }}
                        >
                          {t.updateAvailable || "Download Latest"}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="open-in-new"
                        size={18}
                        color={theme.primary}
                      />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <MaterialIcons
                        name="info-outline"
                        size={20}
                        color={theme.primary}
                        style={{ marginRight: 12 }}
                      />
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: 16,
                          fontWeight: "500",
                        }}
                      >
                        {t.version}{" "}
                        {effectiveVersionInfo?.version ||
                          Application.nativeApplicationVersion ||
                          "1.2.2"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: theme.textTertiary,
                        fontSize: 14,
                      }}
                    >
                      {t.latestVersion || "Latest"}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Log Out Button */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            marginHorizontal: 20,
            marginTop: 32,
            marginBottom: 0,
            overflow: "hidden",
            shadowColor: theme.shadow,
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 6,
            elevation: 1,
            borderWidth: 1,
            borderColor: theme.cardBorder,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setLogoutModalVisible(true);
            }}
            activeOpacity={0.6}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 14,
              paddingHorizontal: 20,
            }}
          >
            <MaterialIcons
              name="logout"
              size={20}
              color={theme.error}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{ color: theme.error, fontSize: 16, fontWeight: "600" }}
            >
              {t.logout || "Log out"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <TouchableOpacity
          onPress={() => {
            setDeleteAccountModalVisible(true);
          }}
          activeOpacity={0.6}
          style={{
            alignItems: "center",
            marginTop: 12,
            marginBottom: 40,
            paddingVertical: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              opacity: 0.8,
            }}
          >
            <MaterialIcons
              name="delete-outline"
              size={16}
              color={theme.textTertiary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                color: theme.textTertiary,
                fontSize: 13,
                fontWeight: "500",
                textDecorationLine: "underline",
              }}
            >
              {t.deleteAccount || "Delete Account"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Developer Tools (Only in __DEV__ mode) */}
        {/* Banner Ad at bottom of settings */}
        <AdBanner
          position="bottom"
          size="banner"
          userType={userType}
          loadingUserType={loadingUserType}
        />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        accessibilityViewIsModal={true}
        accessibilityLabel="Information Modal"
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: theme.modalOverlay,
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: theme.modalBackground,
              padding: 32,
              borderRadius: 12,
              minWidth: 220,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, color: theme.text, marginBottom: 16 }}>
              {modalText}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: 8,
                paddingVertical: 6,
                paddingHorizontal: 18,
                backgroundColor: theme.button,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: theme.buttonText, fontSize: 16 }}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLogoutModalVisible(false)}
        accessibilityViewIsModal={true}
        accessibilityLabel="Logout Confirmation Modal"
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: theme.modalOverlay,
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setLogoutModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: theme.modalBackground,
              borderRadius: 12,
              minWidth: 280,
              maxWidth: 320,
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <View style={{ padding: 24, paddingBottom: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  color: theme.text,
                  textAlign: "center",
                  fontWeight: "600",
                  lineHeight: 24,
                }}
              >
                {t.logoutConfirm}
              </Text>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                width: "100%",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                width: "100%",
              }}
            >
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  alignItems: "center",
                  borderRightWidth: 1,
                  borderRightColor: theme.divider,
                }}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 17,
                    fontWeight: "400",
                  }}
                >
                  {t.cancel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.error,
                    fontSize: 17,
                    fontWeight: "600",
                  }}
                >
                  {t.logout}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteAccountModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteAccountModalVisible(false)}
        accessibilityViewIsModal={true}
        accessibilityLabel="Delete Account Confirmation Modal"
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: theme.modalOverlay,
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setDeleteAccountModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: theme.modalBackground,
              borderRadius: 12,
              minWidth: 280,
              maxWidth: 320,
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <View style={{ padding: 24, paddingBottom: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  color: theme.text,
                  textAlign: "center",
                  fontWeight: "600",
                  lineHeight: 24,
                  marginBottom: 12,
                }}
              >
                {t.deleteAccount || "Delete Account"}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {t.deleteAccountConfirm}
              </Text>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                width: "100%",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                width: "100%",
              }}
            >
              <TouchableOpacity
                onPress={() => setDeleteAccountModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  alignItems: "center",
                  borderRightWidth: 1,
                  borderRightColor: theme.divider,
                }}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 17,
                    fontWeight: "400",
                  }}
                >
                  {t.cancel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.error,
                    fontSize: 17,
                    fontWeight: "600",
                  }}
                >
                  {t.delete}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function CalendarScreen({ navigation, route }) {
  const { language, t } = useContext(LanguageContext);
  const { theme, themeMode } = useContext(ThemeContext);
  const { userType, loadingUserType } = useContext(UserContext);
  const insets = useSafeAreaInsets();
  const { isDesktop, isMobile, isTablet } = useResponsive();
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [tasks, setTasks] = useState({});
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [modalVisible, setModalVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(getCurrentDate()).getMonth(),
  );
  const [visibleYear, setVisibleYear] = useState(
    new Date(getCurrentDate()).getFullYear(),
  );
  const [taskText, setTaskText] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [taskLink, setTaskLink] = useState("");
  const [taskDate, setTaskDate] = useState(selectedDate);
  const [taskNote, setTaskNote] = useState("");
  const [noteInputHeight, setNoteInputHeight] = useState(100); // 動態高度，初始 100
  const [linkInputFocused, setLinkInputFocused] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const [tempTime, setTempTime] = useState(null);
  const taskTitleInputRef = useRef(null);
  const scrollViewRef = useRef(null); // 日曆 ScrollView
  const modalScrollViewRef = useRef(null); // Modal ScrollView
  const fetchedRangesRef = useRef(new Set()); // Track fetched date ranges for caching
  const visibleRangeRef = useRef({
    visibleYear: new Date(getCurrentDate()).getFullYear(),
    visibleMonth: new Date(getCurrentDate()).getMonth(),
  });
  const lastScrollY = useRef(0); // Track last scroll position for month detection
  const scrollTimeoutRef = useRef(null); // Debounce scroll updates
  const isScrollingProgrammatically = useRef(false); // Prevent infinite scroll loop
  const scrollStartY = useRef(0); // Track scroll start position for swipe detection
  const isScrolling = useRef(false); // Track if user is actively scrolling

  // 格式化日期輸入 (YYYY-MM-DD)
  const formatDateInput = (text) => {
    // 移除所有非數字字符
    const numbersOnly = text.replace(/\D/g, "");

    // 限制長度為8位數字 (YYYYMMDD)
    const limitedNumbers = numbersOnly.slice(0, 8);

    // 根據長度添加分隔符
    if (limitedNumbers.length <= 4) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4)}`;
    } else {
      return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(
        4,
        6,
      )}-${limitedNumbers.slice(6)}`;
    }
  };

  // 格式化時間輸入 (HH:MM)
  const formatTimeInput = (text) => {
    // 移除所有非數字字符
    const numbersOnly = text.replace(/\D/g, "");

    // 限制長度為4位數字 (HHMM)
    const limitedNumbers = numbersOnly.slice(0, 4);

    // 根據長度添加分隔符
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else {
      return `${limitedNumbers.slice(0, 2)}:${limitedNumbers.slice(2)}`;
    }
  };

  // Web 平台：ESC 鍵關閉 modal，阻止 Enter 鍵觸發 back button
  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      !modalVisible ||
      typeof window === "undefined"
    ) {
      return;
    }

    const handleKeyDown = (event) => {
      // ESC 鍵關閉 modal
      if (event.key === "Escape" || event.keyCode === 27) {
        event.preventDefault();
        setModalVisible(false);
        return;
      }

      // 阻止 Enter 鍵觸發 back button（當焦點不在輸入框或按鈕時）
      if (event.key === "Enter" || event.keyCode === 13) {
        const target = event.target;
        const isInput =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA";
        const isButton =
          target.tagName === "BUTTON" || target.closest("button");

        // 如果焦點不在輸入框或按鈕上，阻止預設行為並將焦點移到輸入框
        if (!isInput && !isButton) {
          event.preventDefault();
          event.stopPropagation();
          // 將焦點移到任務輸入框
          setTimeout(() => {
            if (taskTitleInputRef.current) {
              taskTitleInputRef.current.focus();
            }
          }, 0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true); // 使用 capture phase
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [modalVisible]);

  // Web 平台：modal 開啟時自動將焦點放在任務輸入框
  useEffect(() => {
    if (
      Platform.OS === "web" &&
      modalVisible &&
      typeof requestAnimationFrame !== "undefined"
    ) {
      const frame = requestAnimationFrame(() => {
        taskTitleInputRef.current?.focus?.();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [modalVisible]);

  // 同步 taskDate 和 selectedDate
  useEffect(() => {
    if (!modalVisible) {
      setTaskDate(selectedDate);
    }
  }, [selectedDate, modalVisible]);

  // Track if initial setup is done to avoid duplicate fetches
  const [isInitialized, setIsInitialized] = useState(false);

  // Load tasks from Supabase based on visible range
  useEffect(() => {
    if (!isInitialized) return; // 等待初始化完成

    const fetchTasksForVisibleRange = async () => {
      try {
        // 首先檢查用戶認證狀態
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!user) {
          console.warn("⚠️ [CalendarScreen] No authenticated user found");
          setTasks({});
          setIsLoadingTasks(false);
          return;
        }

        console.log("✅ [CalendarScreen] User authenticated:", {
          id: user.id,
          email: user.email,
        });

        // Calculate start and end date of the visible month
        // We fetch previous, current, and next month to ensure smooth scrolling
        const startDate = new Date(visibleYear, visibleMonth - 1, 1);
        const endDate = new Date(visibleYear, visibleMonth + 2, 0);

        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");

        // Check cache before fetching
        const rangeKey = `${startDateStr}_${endDateStr}`;
        if (fetchedRangesRef.current.has(rangeKey)) {
          console.log(
            `📦 [Cache] Using cached tasks for ${startDateStr} to ${endDateStr}`,
          );
          setIsLoadingTasks(false);
          return; // Skip API call
        }

        setIsLoadingTasks(true);

        // 優先檢查預載入的數據
        // 如果預載入還在進行中，等待它完成（最多等待 3 秒）
        let cachedData = dataPreloadService.getCachedData();

        // 如果沒有緩存數據，檢查預載入是否正在進行中
        if (!cachedData || !cachedData.calendarTasks) {
          // 檢查預載入是否正在進行中（通過檢查 preloadPromise 或 isPreloading）
          // 注意：dataPreloadService 是一個類，preloadPromise 是靜態屬性
          const preloadPromise = dataPreloadService.preloadPromise;
          if (preloadPromise) {
            console.log(
              "⏳ [CalendarScreen] Waiting for preload to complete...",
            );
            try {
              // 等待預載入完成，但設置超時避免無限等待
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Preload timeout")), 1000),
              );
              await Promise.race([preloadPromise, timeoutPromise]);
              // 預載入完成後，重新檢查緩存
              cachedData = dataPreloadService.getCachedData();
            } catch (error) {
              // 超時或錯誤時，繼續執行後續的 API 請求
              if (error.message === "Preload timeout") {
                console.log(
                  "⚠️ [CalendarScreen] Preload timeout after 1s, fetching directly",
                );
              } else {
                console.log(
                  "⚠️ [CalendarScreen] Preload error, fetching directly:",
                  error.message,
                );
              }
            }
          }
        }

        // 檢查預載入的數據是否包含當前範圍的任務
        if (
          cachedData &&
          cachedData.calendarTasks &&
          Object.keys(cachedData.calendarTasks).length > 0
        ) {
          // 檢查預載入的任務是否涵蓋當前範圍
          const preloadedTasks = cachedData.calendarTasks;
          const hasTasksInRange = Object.keys(preloadedTasks).some((date) => {
            const taskDate = new Date(date);
            return taskDate >= startDate && taskDate <= endDate;
          });

          if (hasTasksInRange) {
            // 過濾出當前範圍的任務
            const filteredTasks = {};
            Object.keys(preloadedTasks).forEach((date) => {
              const taskDate = new Date(date);
              if (taskDate >= startDate && taskDate <= endDate) {
                filteredTasks[date] = preloadedTasks[date];
              }
            });

            if (Object.keys(filteredTasks).length > 0) {
              setTasks((prevTasks) => {
                const updatedTasks = {
                  ...prevTasks,
                  ...filteredTasks,
                };

                // Sync to widget
                widgetService.syncTodayTasks(updatedTasks);

                return updatedTasks;
              });

              setIsLoadingTasks(false);

              // Mark this range as fetched
              fetchedRangesRef.current.add(rangeKey);
              return;
            } else {
              console.log(
                `⚠️ [CalendarScreen] Preloaded tasks exist but none in range ${startDateStr} to ${endDateStr}, fetching from API`,
              );
            }
          } else {
            console.log(
              `⚠️ [CalendarScreen] Preloaded tasks exist but not in range ${startDateStr} to ${endDateStr}, fetching from API`,
            );
          }
        } else {
          console.log(
            `📥 [CalendarScreen] No cached data available, fetching from API for ${startDateStr} to ${endDateStr}`,
          );
        }

        console.log(`Fetching tasks from ${startDateStr} to ${endDateStr}`);

        const newTasks = await TaskService.getTasksByDateRange(
          startDateStr,
          endDateStr,
        );

        // Mark this range as fetched
        fetchedRangesRef.current.add(rangeKey);

        setTasks((prevTasks) => {
          const updatedTasks = {
            ...prevTasks,
            ...newTasks,
          };

          // Sync to widget
          widgetService.syncTodayTasks(updatedTasks);

          return updatedTasks;
        });

        setIsLoadingTasks(false);
      } catch (error) {
        console.error("❌ [CalendarScreen] Error loading tasks:", error);
        console.error("❌ [CalendarScreen] Error details:", {
          message: error.message,
          stack: error.stack,
          code: error.code,
        });
        // 即使出錯，也要設置為 false，避免無限載入狀態
        setIsLoadingTasks(false);
        // 嘗試清除緩存並重新載入
        if (
          error.message?.includes("Network") ||
          error.message?.includes("Failed to fetch")
        ) {
          console.warn(
            "⚠️ [CalendarScreen] Network error detected, will retry on next mount",
          );
        }
      }
    };

    fetchTasksForVisibleRange();

    // Cleanup scroll timeout on unmount
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [visibleYear, visibleMonth, isInitialized]);

  // 同步目前可見範圍到 ref，供 preload 更新回調使用
  useEffect(() => {
    visibleRangeRef.current = {
      visibleYear,
      visibleMonth,
    };
  }, [visibleYear, visibleMonth]);

  // 訂閱預載入服務：背景載入前後月完成時合併到畫面的 tasks，解決登入後只顯示當月的問題
  useEffect(() => {
    const handleCalendarTasksUpdated = (newCalendarTasks) => {
      if (!newCalendarTasks || Object.keys(newCalendarTasks).length === 0)
        return;
      const { visibleYear: y, visibleMonth: m } = visibleRangeRef.current;
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m + 2, 0);
      const filtered = {};
      Object.keys(newCalendarTasks).forEach((date) => {
        const taskDate = new Date(date);
        if (taskDate >= startDate && taskDate <= endDate) {
          filtered[date] = newCalendarTasks[date];
        }
      });
      if (Object.keys(filtered).length > 0) {
        setTasks((prev) => {
          const updated = { ...prev, ...filtered };
          widgetService.syncTodayTasks(updated);
          return updated;
        });
      }
    };
    dataPreloadService.addCalendarTasksListener(handleCalendarTasksUpdated);
    return () => {
      dataPreloadService.removeCalendarTasksListener(
        handleCalendarTasksUpdated,
      );
    };
  }, []);

  // Center calendar to today (only called on init, not when month changes)
  const centerToday = useCallback(() => {
    if (!scrollViewRef.current) return;
    const todayDate = new Date(getToday());
    todayDate.setHours(12, 0, 0, 0);
    const currentMonth = new Date(getCurrentDate()).getMonth();
    const currentYear = new Date(getCurrentDate()).getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const firstSunday = new Date(firstDayOfMonth);
    firstSunday.setDate(firstDayOfMonth.getDate() - firstDayOfWeek);
    const diffInDays = Math.floor(
      (todayDate - firstSunday) / (1000 * 60 * 60 * 24),
    );
    const weekNumber = Math.floor(diffInDays / 7);
    const weekHeight = 50;
    const scrollPosition = Math.max(0, weekNumber * weekHeight - weekHeight);
    scrollViewRef.current.scrollTo({
      y: scrollPosition,
      animated: true,
    });
  }, []); // 移除依賴，只在初始化時調用

  // Initialize calendar to today when app loads/reloads
  useEffect(() => {
    if (isInitialized) {
      console.log("⏭️ Initialization skipped - already initialized");
      return; // 已經初始化過，不再執行
    }

    console.log("🚀 Initializing calendar to today");
    const today = getCurrentDate();
    const todayDate = new Date(today);
    const todayMonth = todayDate.getMonth();
    const todayYear = todayDate.getFullYear();

    console.log("📅 Setting initial month/year:", todayMonth, todayYear);
    setSelectedDate(today);
    setVisibleMonth(todayMonth);
    setVisibleYear(todayYear);

    // 立即檢查並使用預載入的數據
    const cachedData = dataPreloadService.getCachedData();
    if (
      cachedData &&
      cachedData.calendarTasks &&
      Object.keys(cachedData.calendarTasks).length > 0
    ) {
      console.log("📦 [CalendarScreen] Using preloaded tasks on mount");
      const preloadedTasks = cachedData.calendarTasks;

      // 計算當前可見範圍
      const startDate = new Date(todayYear, todayMonth - 1, 1);
      const endDate = new Date(todayYear, todayMonth + 2, 0);

      // 過濾出當前範圍的任務
      const filteredTasks = {};
      Object.keys(preloadedTasks).forEach((date) => {
        const taskDate = new Date(date);
        if (taskDate >= startDate && taskDate <= endDate) {
          filteredTasks[date] = preloadedTasks[date];
        }
      });

      if (Object.keys(filteredTasks).length > 0) {
        console.log(
          `✅ [CalendarScreen] Loaded ${
            Object.keys(filteredTasks).length
          } dates with tasks from cache`,
        );
        setTasks(filteredTasks);
        setIsLoadingTasks(false);

        // 標記這個範圍已經獲取
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");
        const rangeKey = `${startDateStr}_${endDateStr}`;
        fetchedRangesRef.current.add(rangeKey);

        // Sync to widget
        widgetService.syncTodayTasks(filteredTasks);
      } else {
        console.log(
          "⚠️ [CalendarScreen] Preloaded tasks exist but none in current range, will fetch from API",
        );
        // 保持 isLoadingTasks 為 true，讓後續的 fetchTasksForVisibleRange 來處理
      }
    } else {
      console.log(
        "📥 [CalendarScreen] No preloaded tasks available, will fetch from API",
      );
      // 如果沒有預載入數據，保持 isLoadingTasks 為 true，讓後續的 fetchTasksForVisibleRange 來處理
    }

    // 標記初始化完成（無論是否有預載入數據）
    console.log("✅ [CalendarScreen] Initialization complete");
    setIsInitialized(true);

    // Center calendar to today after state is set
    setTimeout(() => {
      centerToday();
    }, 500);
  }, [centerToday, isInitialized]); // Include centerToday and isInitialized in dependencies

  // Reset to today when Calendar tab is focused (but avoid duplicate fetches)
  useFocusEffect(
    React.useCallback(() => {
      const today = getCurrentDate();
      const todayDate = new Date(today);
      const todayMonth = todayDate.getMonth();
      const todayYear = todayDate.getFullYear();

      // Check if focusToday param is passed (e.g., when session expired)
      const shouldFocusToday = route?.params?.focusToday;

      // Only update if shouldFocusToday is true (explicit request to focus today)
      // Don't reset month/year if user has navigated to a different month
      if (shouldFocusToday) {
        setSelectedDate(today);
        setVisibleMonth(todayMonth);
        setVisibleYear(todayYear);
        setTimeout(() => {
          centerToday();
        }, 100);
      }
    }, [route?.params?.focusToday, centerToday]),
  );

  // Note: We no longer need to save tasks to AsyncStorage
  // Tasks are automatically saved to Supabase when modified

  const openAddTask = (date) => {
    setEditingTask(null);
    setTaskText("");
    setTaskTime("");
    setTaskLink("");
    setTaskDate(date);
    setTaskNote("");
    setNoteInputHeight(100); // 重置為初始高度
    setLinkInputFocused(false);
    setSelectedDate(date);
    setModalVisible(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskText(task.title);
    setTaskTime(formatTimeDisplay(task.time) || "");
    setTaskLink(task.link || "");
    setTaskDate(task.date);
    const note = task.note || "";
    setTaskNote(note);
    // 根據現有 note 內容設置初始高度
    if (note) {
      const lineCount = note.split("\n").length;
      const estimatedHeight = Math.max(100, lineCount * 24 + 24);
      setNoteInputHeight(Math.min(estimatedHeight, 300));
    } else {
      setNoteInputHeight(100);
    }
    setSelectedDate(task.date);
    setModalVisible(true);
  };

  // Helper function to clear task cache when tasks are modified
  const clearTaskCache = () => {
    fetchedRangesRef.current.clear();
    console.log("🗑️ [Cache] Cleared task cache");
  };

  const saveTask = async () => {
    if (taskText.trim() === "") return;
    if (taskDate.trim() === "") return;

    const targetDate = taskDate || selectedDate;
    const previousTasks = { ...tasks }; // Backup for rollback
    let tempId = null;

    // Prepare task data
    const taskData = {
      title: taskText,
      time: taskTime,
      link: taskLink,
      date: targetDate,
      note: taskNote,
    };

    // 1. Optimistic Update
    if (editingTask) {
      const updatedTask = { ...editingTask, ...taskData };

      if (editingTask.date !== targetDate) {
        // Date changed
        const oldDayTasks = tasks[editingTask.date] || [];
        const newOldDayTasks = oldDayTasks.filter(
          (t) => t.id !== editingTask.id,
        );
        const newDayTasks = tasks[targetDate] || [];
        const updatedNewDayTasks = [...newDayTasks, updatedTask];

        const newTasksState = {
          ...tasks,
          [editingTask.date]: newOldDayTasks,
          [targetDate]: updatedNewDayTasks,
        };
        setTasks(newTasksState);
        widgetService.syncTodayTasks(newTasksState);
      } else {
        // Same date
        const dayTasks = tasks[targetDate] || [];
        const updatedDayTasks = dayTasks.map((t) =>
          t.id === editingTask.id ? updatedTask : t,
        );
        const newTasksState = { ...tasks, [targetDate]: updatedDayTasks };
        setTasks(newTasksState);
        widgetService.syncTodayTasks(newTasksState);
      }
    } else {
      // Create new task
      tempId = `temp-${Date.now()}`;
      const newTask = {
        id: tempId,
        ...taskData,
        is_completed: false,
        checked: false,
      };

      const dayTasks = tasks[targetDate] || [];
      const newTasksState = { ...tasks, [targetDate]: [...dayTasks, newTask] };
      setTasks(newTasksState);
      widgetService.syncTodayTasks(newTasksState);
    }

    // Close modal immediately
    setModalVisible(false);
    const currentEditingTask = editingTask; // Capture for async use
    setEditingTask(null);
    setTaskText("");
    setTaskTime("");
    setTaskLink("");
    setTaskDate(selectedDate);
    setTaskNote("");
    setNoteInputHeight(100); // 重置為初始高度
    setLinkInputFocused(false);

    try {
      // 2. Perform Background Operations
      if (currentEditingTask) {
        // --- UPDATE TASK ---
        console.log("Updating existing task:", currentEditingTask.id);

        // Check if it's a temporary task
        if (String(currentEditingTask.id).startsWith("temp-")) {
          console.log(
            "Updating temporary task locally:",
            currentEditingTask.id,
          );
          return; // Skip API call, the create flow will handle the sync
        }

        // Cancel old notifications
        if (currentEditingTask.notificationIds) {
          await cancelTaskNotification(currentEditingTask.notificationIds);
        } else if (currentEditingTask.notificationId) {
          await cancelTaskNotification(currentEditingTask.notificationId);
        }

        // API Call
        const updatedTaskFromServer = await TaskService.updateTask(
          currentEditingTask.id,
          taskData,
        );

        // Schedule new notification
        if (Platform.OS !== "web") {
          const notificationIds = await scheduleTaskNotification(
            {
              id: updatedTaskFromServer.id,
              title: taskText,
              date: targetDate,
              time: taskTime,
              notificationIds: currentEditingTask.notificationIds,
            },
            t.taskReminder,
            getActiveReminderMinutes(),
            null,
            t,
          );

          // Update local state with new notification IDs (silent update)
          if (notificationIds.length > 0) {
            setTasks((currentTasks) => {
              const dayTasks = currentTasks[targetDate] || [];
              const updatedDayTasks = dayTasks.map((t) =>
                t.id === updatedTaskFromServer.id
                  ? { ...t, notificationIds }
                  : t,
              );
              return { ...currentTasks, [targetDate]: updatedDayTasks };
            });
          }
        }

        // Mixpanel
        mixpanelService.track("Task Updated", {
          task_id: currentEditingTask.id,
          has_time: !!taskTime,
          has_link: !!taskLink,
          has_note: !!taskNote,
          date_changed: currentEditingTask.date !== targetDate,
          platform: Platform.OS,
        });

        // Clear cache after update
        clearTaskCache();
      } else {
        // --- CREATE TASK ---
        // API Call
        const createdTask = await TaskService.addTask({
          ...taskData,
          is_completed: false,
        });

        // Clear cache after creation
        clearTaskCache();

        // Replace temp ID with real ID and handle any pending actions/changes
        setTasks((currentTasks) => {
          // Check if task was deleted while creating
          if (pendingTempActions.current[tempId] === "delete") {
            console.log(
              "Task deleted while creating, deleting from server:",
              createdTask.id,
            );
            TaskService.deleteTask(createdTask.id).catch((e) =>
              console.error("Failed to delete ghost task", e),
            );

            // Remove from state if it exists
            const dayTasks = currentTasks[targetDate] || [];
            const filteredTasks = dayTasks.filter((t) => t.id !== tempId);
            const updatedTasksState = {
              ...currentTasks,
              [targetDate]: filteredTasks,
            };
            widgetService.syncTodayTasks(updatedTasksState);
            return updatedTasksState;
          }

          const dayTasks = currentTasks[targetDate] || [];
          // Find the current state of this task (it might have been edited or toggled)
          const currentTempTask = dayTasks.find((t) => t.id === tempId);

          if (!currentTempTask) {
            // Task not found in state? Maybe moved date?
            // For now, just return currentTasks, but this is an edge case.
            return currentTasks;
          }

          // Merge server data with local changes
          // We keep the real ID from server
          // We take other fields from local state to preserve edits/toggles
          const finalTask = {
            ...createdTask,
            ...currentTempTask,
            id: createdTask.id,
          };

          // Sync changes to server if local state diverged from initial creation
          const needsUpdate =
            finalTask.title !== createdTask.title ||
            finalTask.date !== createdTask.date ||
            finalTask.time !== createdTask.time ||
            finalTask.link !== createdTask.link ||
            finalTask.note !== createdTask.note;

          const needsToggle =
            finalTask.is_completed !== createdTask.is_completed;

          if (needsUpdate) {
            console.log("Syncing pending updates for new task");
            TaskService.updateTask(createdTask.id, {
              title: finalTask.title,
              date: finalTask.date,
              time: finalTask.time,
              link: finalTask.link,
              note: finalTask.note,
            }).catch((e) => console.error("Failed to sync update", e));
          }

          if (needsToggle) {
            console.log("Syncing pending toggle for new task");
            TaskService.toggleTaskChecked(
              createdTask.id,
              finalTask.is_completed,
            ).catch((e) => console.error("Failed to sync toggle", e));
          }

          const updatedDayTasks = dayTasks.map((t) =>
            t.id === tempId ? finalTask : t,
          );
          const updatedTasksState = {
            ...currentTasks,
            [targetDate]: updatedDayTasks,
          };

          // Sync widget again with real ID
          widgetService.syncTodayTasks(updatedTasksState);

          return updatedTasksState;
        });

        // Schedule notification for new task (native only)
        if (Platform.OS !== "web") {
          const notificationIds = await scheduleTaskNotification(
            {
              id: createdTask.id,
              title: taskText,
              date: targetDate,
              time: taskTime,
            },
            t.taskReminder,
            getActiveReminderMinutes(),
            null,
            t,
          );

          if (notificationIds.length > 0) {
            // Update local state with notification IDs
            setTasks((currentTasks) => {
              const dayTasks = currentTasks[targetDate] || [];
              const updatedDayTasks = dayTasks.map((t) =>
                t.id === createdTask.id ? { ...t, notificationIds } : t,
              );
              return { ...currentTasks, [targetDate]: updatedDayTasks };
            });
          }
        }

        // Mixpanel
        mixpanelService.track("Task Created", {
          task_id: createdTask.id,
          has_time: !!taskTime,
          has_link: !!taskLink,
          has_note: !!taskNote,
          platform: Platform.OS,
        });
      }
    } catch (error) {
      console.error("Error saving task:", error);
      // 3. Rollback
      setTasks(previousTasks);
      widgetService.syncTodayTasks(previousTasks);
      Alert.alert("Error", "Failed to save task. Data has been restored.");
    }
  };

  const showDeleteConfirm = () => {
    // Web 平台使用原生 confirm，其他平台使用 Alert.alert
    if (Platform.OS === "web") {
      const confirmed = window.confirm(t.deleteConfirm);
      if (confirmed) {
        deleteTask();
      }
    } else {
      Alert.alert(
        t.deleteConfirm,
        "",
        [
          {
            text: t.cancel,
            onPress: () => {},
            style: "cancel",
          },
          {
            text: t.delete,
            onPress: deleteTask,
            style: "destructive",
          },
        ],
        { cancelable: true },
      );
    }
  };

  // Ref to track pending actions for temporary tasks
  const pendingTempActions = useRef({});

  const deleteTask = async () => {
    if (!editingTask) return;

    // Mixpanel: Track task deletion
    const taskAgeMs = editingTask.created_at
      ? Date.now() - new Date(editingTask.created_at).getTime()
      : null;
    const taskAgeDays = taskAgeMs ? Math.floor(taskAgeMs / (1000 * 60 * 60 * 24)) : null;

    mixpanelService.track("Task Deleted", {
      task_id: editingTask.id,
      was_completed: !!editingTask.isCompleted,
      had_time: !!editingTask.time,
      had_link: !!editingTask.link,
      had_note: !!editingTask.note,
      task_age_days: taskAgeDays,
    });

    // 1. Optimistic Update: Remove from UI immediately
    const day = editingTask.date;
    const previousTasks = { ...tasks }; // Backup for rollback
    const dayTasks = tasks[day] ? [...tasks[day]] : [];
    const filteredTasks = dayTasks.filter((t) => t.id !== editingTask.id);
    const newTasks = { ...tasks, [day]: filteredTasks };

    setTasks(newTasks);
    widgetService.syncTodayTasks(newTasks);

    // Close modal immediately
    setModalVisible(false);
    setEditingTask(null);
    setTaskText("");
    setTaskTime("");
    setTaskLink("");
    setTaskDate(selectedDate);
    setTaskNote("");
    setNoteInputHeight(100); // 重置為初始高度
    setLinkInputFocused(false);

    // Check if it's a temporary task
    if (String(editingTask.id).startsWith("temp-")) {
      console.log("Deleting temporary task locally:", editingTask.id);
      pendingTempActions.current[editingTask.id] = "delete";
      return; // Skip API call
    }

    try {
      // 2. Perform Background Operation
      // Cancel notification if exists
      if (editingTask.notificationIds) {
        await cancelTaskNotification(editingTask.notificationIds);
      } else if (editingTask.notificationId) {
        await cancelTaskNotification(editingTask.notificationId);
      }

      await TaskService.deleteTask(editingTask.id);

      // Clear cache after deletion
      clearTaskCache();
    } catch (error) {
      console.error("Error deleting task:", error);
      // 3. Rollback on Failure
      setTasks(previousTasks);
      widgetService.syncTodayTasks(previousTasks);
      Alert.alert("Error", "Failed to delete task. Data has been restored.");
    }
  };

  const startMoveTask = (task) => {
    setMoveMode(true);
    setTaskToMove(task);
    Alert.alert(t.moveTask, t.moveTaskAlert, [{ text: t.confirm }]);
  };

  const moveTaskToDate = async (task, toDate) => {
    if (task.date === toDate) return;
    if (task.date !== selectedDate) return;

    // Optimistic update: 立即更新 UI
    const fromTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];
    const toTasks = tasks[toDate] ? [...tasks[toDate]] : [];
    const filteredTasks = fromTasks.filter((t) => t.id !== task.id);
    const updatedTask = { ...task, date: toDate };
    toTasks.push(updatedTask);
    const updatedTasks = {
      ...tasks,
      [selectedDate]: filteredTasks,
      [toDate]: toTasks,
    };

    // 保存舊狀態以便回滾
    const previousTasks = { ...tasks };

    // 立即更新 UI
    setTasks(updatedTasks);

    // 非阻塞 widget sync（不等待完成）
    widgetService.syncTodayTasks(updatedTasks).catch((error) => {
      console.error("Error syncing widget:", error);
    });

    setMoveMode(false);
    setTaskToMove(null);

    // 在背景更新數據庫（不阻塞 UI）
    try {
      await TaskService.updateTask(task.id, { date: toDate });
    } catch (error) {
      console.error("Error moving task:", error);
      // 回滾 UI 狀態
      setTasks(previousTasks);
      widgetService.syncTodayTasks(previousTasks).catch((err) => {
        console.error("Error syncing widget on rollback:", err);
      });
      Alert.alert("Error", "Failed to move task. Changes have been reverted.");
    }
  };

  // Format Date to YYYY-MM-DD in local time (avoid UTC shift in getMonthDates/getAdjacentDate/getWeekStart)
  const toLocalDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Helper to get all dates in a month
  const getMonthDates = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const dates = [];
    // Add previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      dates.push(
        toLocalDateStr(new Date(year, month - 1, prevMonthLastDay - i)),
      );
    }
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(toLocalDateStr(new Date(year, month, i)));
    }
    // Add next month's leading days to fill 6 weeks
    const remainingDays = 42 - dates.length;
    for (let i = 1; i <= remainingDays; i++) {
      dates.push(toLocalDateStr(new Date(year, month + 1, i)));
    }
    return dates;
  };

  const renderCalendar = () => {
    const monthDates = getMonthDates(visibleYear, visibleMonth);
    const today = getCurrentDate();
    const currentMonth = new Date(visibleYear, visibleMonth, 1);

    // Group dates into weeks
    const weeks = [];
    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7));
    }

    return (
      <View style={styles.monthContainer}>
        <View
          style={[styles.customCalendar, { backgroundColor: theme.background }]}
        >
          {/* Week day headers */}
          <View
            style={[
              styles.weekDaysHeader,
              { borderBottomColor: theme.divider },
            ]}
          >
            {t.weekDays.map((day, index) => (
              <Text
                key={index}
                style={[styles.weekDayText, { color: theme.textSecondary }]}
              >
                {day}
              </Text>
            ))}
          </View>
          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeekRow}>
              {week.map((dateStr) => {
                const dateObj = new Date(dateStr);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const isCurrentMonth = dateObj.getMonth() === visibleMonth;
                const dayTasks = tasks[dateStr] || [];
                const taskCount = dayTasks.length; // Show dot for all tasks, including completed ones

                return (
                  <TouchableOpacity
                    key={dateStr}
                    onPress={() => {
                      if (moveMode && taskToMove) {
                        moveTaskToDate(taskToMove, dateStr);
                        setMoveMode(false);
                        setTaskToMove(null);
                      } else {
                        setSelectedDate(dateStr);
                      }
                    }}
                    style={[
                      styles.calendarDay,
                      isSelected && [
                        styles.selectedDay,
                        { backgroundColor: theme.calendarSelected },
                      ],
                      !isSelected && { backgroundColor: theme.background },
                      moveMode && styles.calendarDayMoveTarget,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.calendarDayContent}>
                      <View style={styles.dateContainer}>
                        {isToday ? (
                          <View
                            style={[
                              styles.todayCircle,
                              { backgroundColor: theme.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                styles.todayText,
                                // 如果是 today，文字永遠是白色，不受 selectedDayText 影響
                              ]}
                            >
                              {dateObj.getDate()}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.calendarDayText,
                              {
                                color: isCurrentMonth
                                  ? theme.text
                                  : theme.textTertiary,
                              },
                              isSelected && [
                                styles.selectedDayText,
                                { color: theme.primary },
                              ],
                              !isCurrentMonth && styles.otherMonthText,
                            ]}
                          >
                            {dateObj.getDate()}
                          </Text>
                        )}
                        {taskCount > 0 && (
                          <View
                            style={[
                              styles.taskDot,
                              { backgroundColor: theme.primary },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDate = (date) => {
    const isSelected = date === selectedDate;
    const dateObj = new Date(date);

    // Format the current date to match the date string format (YYYY-MM-DD)
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const isToday = date === todayFormatted;

    const renderDateContent = () => {
      return (
        <View style={styles.dateContainer}>
          <View
            style={[
              styles.dayViewDateContainer,
              isToday && styles.todayCircleLarge,
              isSelected && styles.selectedDateLarge,
            ]}
          >
            <Text
              style={[
                styles.dayViewDayNumber,
                { color: theme.text },
                isSelected && [
                  styles.selectedDayText,
                  { color: theme.primary },
                ],
                isToday && styles.todayTextLarge,
              ]}
            >
              {String(dateObj.getDate())}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <TouchableOpacity
        key={date}
        onPress={() => {
          if (moveMode && taskToMove) {
            moveTaskToDate(taskToMove, date);
            setMoveMode(false);
            setTaskToMove(null);
          } else {
            setSelectedDate(date);
          }
        }}
        style={[
          styles.dayViewDayButton,
          { backgroundColor: "transparent" },
          isSelected && [
            styles.selectedDayLarge,
            { backgroundColor: theme.calendarSelected },
          ],
          moveMode && styles.calendarDayMoveTarget,
        ]}
        activeOpacity={0.7}
      >
        {renderDateContent()}
        {tasks[date] && tasks[date].length > 0 && (
          <View
            style={[styles.taskDotLarge, { backgroundColor: theme.primary }]}
          />
        )}
      </TouchableOpacity>
    );
  };

  const toggleTaskChecked = async (task) => {
    const newCompletedState = !(task.is_completed || task.checked);
    const previousTasks = { ...tasks }; // Backup for rollback

    // 1. Optimistic Update: Update UI immediately
    const dayTasks = tasks[task.date] ? [...tasks[task.date]] : [];
    const updatedTasksList = dayTasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            checked: newCompletedState,
            is_completed: newCompletedState,
          }
        : t,
    );
    const newTasksState = { ...tasks, [task.date]: updatedTasksList };

    setTasks(newTasksState);
    widgetService.syncTodayTasks(newTasksState);

    // Check if it's a temporary task
    if (String(task.id).startsWith("temp-")) {
      console.log("Toggling temporary task locally:", task.id);
      return; // Skip API call, the create flow will handle the sync
    }

    try {
      // 2. Perform Background Operation
      // If task is being marked as completed, cancel notification
      if (newCompletedState) {
        if (task.notificationIds) {
          await cancelTaskNotification(task.notificationIds);
        } else if (task.notificationId) {
          await cancelTaskNotification(task.notificationId);
        }
      }

      await TaskService.toggleTaskChecked(task.id, newCompletedState);

      // Mixpanel: Track event
      mixpanelService.track(
        newCompletedState ? "Task Completed" : "Task Uncompleted",
        {
          task_id: task.id,
          platform: Platform.OS,
        },
      );
    } catch (error) {
      console.error("Error toggling task:", error);
      // 3. Rollback on Failure
      setTasks(previousTasks);
      widgetService.syncTodayTasks(previousTasks);
      Alert.alert("Error", "Failed to update task. Please try again.");
    }
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskItemRow}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleTaskChecked(item)}
        activeOpacity={0.7}
      >
        {item.is_completed || item.checked ? (
          <MaterialIcons name="check-box" size={24} color={theme.primary} />
        ) : (
          <MaterialIcons
            name="check-box-outline-blank"
            size={24}
            color={theme.textTertiary}
          />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.taskItem,
          {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.mode === "dark" ? "rgb(58, 58, 60)" : "#fff",
          },
        ]}
        onPress={() => openEditTask(item)}
        onLongPress={() => startMoveTask(item)}
        activeOpacity={0.7}
      >
        <View style={styles.taskTextContainer}>
          <Text
            style={[
              styles.taskText,
              {
                color:
                  item.is_completed || item.checked
                    ? theme.textTertiary
                    : theme.text,
              },
              (item.is_completed || item.checked) && styles.taskTextChecked,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
        </View>
        <View style={styles.taskTimeContainer}>
          {item.time ? (
            <Text style={[styles.taskTimeRight, { color: theme.primary }]}>
              {formatTimeDisplay(item.time)}
            </Text>
          ) : null}
          {moveMode && taskToMove && taskToMove.id === item.id ? (
            <Text style={[styles.moveHint, { color: theme.primary }]}>
              {t.moveHint}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );

  // Helper to get previous/next day in YYYY-MM-DD (local time)
  const getAdjacentDate = (dateStr, diff) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + diff);
    return toLocalDateStr(date);
  };

  // Helper to get week start date (Sunday) in local YYYY-MM-DD
  const getWeekStart = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    return toLocalDateStr(date);
  };

  // Handler for horizontal swipe in task area
  const handleTaskAreaGesture = ({ nativeEvent }) => {
    const { translationX, translationY, state } = nativeEvent;
    // Only trigger on gesture end (state === 5 for END) and minimal vertical movement
    if (state === 5 && Math.abs(translationY) < 20) {
      if (translationX < -1) {
        // Swipe left, go to next day
        setSelectedDate(getAdjacentDate(selectedDate, 1));
      } else if (translationX > 1) {
        // Swipe right, go to previous day
        setSelectedDate(getAdjacentDate(selectedDate, -1));
      }
    }
  };

  const renderTaskArea = () => {
    const dayTasks = tasks[selectedDate] || [];
    // 如果正在載入且還沒有任何任務數據，顯示 skeleton
    const shouldShowSkeleton =
      isLoadingTasks && Object.keys(tasks).length === 0;

    const taskAreaContent = (
      <View
        style={[
          styles.taskArea,
          { flex: 1, backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <View style={[styles.taskAreaContent, { flex: 1 }]}>
          <View
            style={[
              styles.tasksHeaderRow,
              {
                paddingLeft: 0,
                paddingHorizontal: 0,
                marginLeft: 4,
                backgroundColor: "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.tasksHeader,
                {
                  textAlign: "left",
                  paddingLeft: 0,
                  marginLeft: 4,
                  color: theme.text,
                },
              ]}
            >
              {selectedDate}
            </Text>
          </View>

          {/* Floating Add Button */}
          <TouchableOpacity
            style={[
              styles.fabAddButton,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
                // Web 版需要更多底部空間，避免被底部導航欄切到
                bottom: Platform.OS === "web" ? 80 : 8,
              },
            ]}
            onPress={() => openAddTask(selectedDate)}
            activeOpacity={0.7}
          >
            <View style={styles.addButtonIcon}>
              <Svg
                width={32}
                height={32}
                viewBox="0 0 32 32"
                style={{
                  display: "flex",
                  alignSelf: "center",
                  justifyContent: "center",
                }}
              >
                <Line
                  x1="16"
                  y1="6"
                  x2="16"
                  y2="26"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Line
                  x1="6"
                  y1="16"
                  x2="26"
                  y2="16"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>

          {shouldShowSkeleton ? (
            <View style={{ flex: 1 }}>
              <FlatList
                data={[1, 2, 3, 4]} // 顯示 4 個 skeleton
                keyExtractor={(item) => `skeleton-${item}`}
                renderItem={() => <TaskSkeleton theme={theme} />}
                contentContainerStyle={styles.tasksScrollContent}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ) : dayTasks.length === 0 ? (
            <View style={styles.noTaskContainer}>
              <Svg
                width={64}
                height={64}
                viewBox="0 0 64 64"
                style={{ marginBottom: 12 }}
              >
                <Rect x="10" y="20" width="44" height="32" rx="8" fill="#eee" />
                <Line
                  x1="18"
                  y1="32"
                  x2="46"
                  y2="32"
                  stroke="#bbb"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Line
                  x1="18"
                  y1="40"
                  x2="38"
                  y2="40"
                  stroke="#ccc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Circle cx="32" cy="16" r="6" fill="#e0e0e0" />
              </Svg>
              <Text style={[styles.noTaskText, { color: theme.textSecondary }]}>
                {t.noTasks}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                data={dayTasks.slice().sort((a, b) => {
                  // 已完成的任務排到最底下
                  const aCompleted = a.is_completed || a.checked;
                  const bCompleted = b.is_completed || b.checked;
                  if (aCompleted !== bCompleted) {
                    return aCompleted ? 1 : -1;
                  }
                  // 未完成的任務按時間排序
                  return (a.time || "").localeCompare(b.time || "");
                })}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
                contentContainerStyle={styles.tasksScrollContent}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </View>
    );

    // On web, return content directly without PanGestureHandler to avoid scroll issues
    if (Platform.OS === "web") {
      return taskAreaContent;
    }

    // On native, wrap with PanGestureHandler for swipe gestures
    return (
      <PanGestureHandler
        onHandlerStateChange={handleTaskAreaGesture}
        activeOffsetY={[-1000, 1000]}
        activeOffsetX={[-50, 50]}
      >
        {taskAreaContent}
      </PanGestureHandler>
    );
  };

  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
      accessibilityViewIsModal={true}
      accessibilityLabel="Task Creation/Edit Modal"
    >
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: theme.modalOverlay },
          Platform.OS === "web"
            ? {
                alignItems: "center",
                justifyContent: "flex-start",
                backgroundColor: "#f2f2f2",
              }
            : null,
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.modalBackground },
              Platform.OS === "web"
                ? {
                    width: 375,
                    maxWidth: 375,
                    alignSelf: "center",
                    minHeight: "100vh",
                  }
                : null,
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  paddingTop: insets.top + 16,
                  backgroundColor:
                    theme.mode === "dark" ? theme.background : "#fff",
                  borderBottomColor:
                    theme.mode === "dark" ? "#2a2a2a" : theme.divider,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Go back"
                accessibilityHint="Close the task creation/editing modal"
                focusable={Platform.OS === "web" ? false : undefined}
                tabIndex={Platform.OS === "web" ? -1 : undefined}
              >
                <MaterialIcons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingTask ? t.editTask : t.createTask}
              </Text>
              <View style={styles.modalHeaderSpacer} />
            </View>
            <ScrollView
              ref={modalScrollViewRef}
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 100 }}
              nestedScrollEnabled={true}
              scrollEnabled={true}
            >
              <View style={{ marginBottom: 24, marginTop: 24 }}>
                {/* Task Text Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t.taskLabel} <Text style={{ color: theme.error }}>*</Text>
                  </Text>
                  <TextInput
                    ref={taskTitleInputRef}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.input,
                        borderColor: theme.inputBorder,
                        color: theme.text,
                      },
                    ]}
                    value={taskText}
                    onChangeText={setTaskText}
                    placeholder={t.addTask}
                    placeholderTextColor={theme.textPlaceholder}
                    autoFocus={false}
                    returnKeyType="done"
                    accessibilityLabel="Task title input"
                    accessibilityHint="Enter the task title"
                    onFocus={() => {
                      setTimeout(() => {
                        modalScrollViewRef.current?.scrollTo({
                          y: 0,
                          animated: true,
                        });
                      }, 100);
                    }}
                    onSubmitEditing={() => {
                      // 當用戶按 Enter 時，直接儲存任務（時間是可選的）
                      if (taskText.trim()) {
                        saveTask();
                      }
                    }}
                  />
                </View>

                {/* Link Input Field */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t.link}
                  </Text>
                  <View
                    style={[
                      styles.linkInputContainer,
                      {
                        backgroundColor: theme.input,
                        borderColor: theme.inputBorder,
                      },
                      linkInputFocused && styles.linkInputContainerFocused,
                    ]}
                  >
                    <TextInput
                      style={[styles.linkInput, { color: theme.text }]}
                      value={taskLink}
                      onChangeText={setTaskLink}
                      placeholder={t.linkPlaceholder}
                      placeholderTextColor={theme.textPlaceholder}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel="Task link input"
                      accessibilityHint="Enter a URL link for this task"
                      onFocus={() => {
                        setLinkInputFocused(true);
                        setTimeout(() => {
                          modalScrollViewRef.current?.scrollTo({
                            y: 50,
                            animated: true,
                          });
                        }, 100);
                      }}
                      onBlur={() => {
                        setLinkInputFocused(false);
                      }}
                    />
                    {taskLink && editingTask ? (
                      <TouchableOpacity
                        onPress={() => {
                          const url = taskLink.startsWith("http")
                            ? taskLink
                            : `https://${taskLink}`;
                          Linking.openURL(url).catch((err) =>
                            console.error("Failed to open URL:", err),
                          );
                        }}
                        style={styles.linkPreviewButton}
                      >
                        <MaterialIcons
                          name="open-in-new"
                          size={20}
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {/* Google Maps Preview */}
                  {taskLink ? (
                    <MapPreview
                      url={taskLink}
                      theme={theme}
                      onOpenInBrowser={() => {
                        const url = taskLink.startsWith("http")
                          ? taskLink
                          : `https://${taskLink}`;
                        Linking.openURL(url).catch((err) =>
                          console.error("Failed to open URL:", err),
                        );
                      }}
                    />
                  ) : null}
                </View>

                {/* Date Input Field */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t.date} <Text style={{ color: theme.error }}>*</Text>
                  </Text>
                  {Platform.OS === "web" ? (
                    <View
                      style={[
                        styles.linkInputContainer,
                        {
                          backgroundColor: theme.input,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                    >
                      <style>
                        {`
                        #date-input-field::-webkit-calendar-picker-indicator {
                          position: absolute;
                          width: 100%;
                          height: 100%;
                          top: 0;
                          left: 0;
                          opacity: 0;
                          cursor: pointer;
                        }
                        #date-input-field::-webkit-date-and-time-value {
                          text-align: left;
                        }
                      `}
                      </style>
                      <input
                        id="date-input-field"
                        type="date"
                        value={taskDate}
                        onChange={(e) => setTaskDate(e.target.value)}
                        style={{
                          width: "100%",
                          fontSize: 16,
                          paddingLeft: 16,
                          paddingRight: 16,
                          border: "none",
                          backgroundColor: "transparent",
                          fontFamily: "inherit",
                          outline: "none",
                          height: 50,
                          color: theme.text,
                          cursor: "pointer",
                          position: "relative",
                          textAlign: "left",
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss(); // 關閉鍵盤
                        setTempDate(taskDate ? new Date(taskDate) : new Date());
                        setDatePickerVisible(true);
                      }}
                      style={[
                        styles.linkInputContainer,
                        {
                          backgroundColor: theme.input,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateTimeText,
                          { color: theme.text },
                          !taskDate && [
                            styles.placeholderText,
                            { color: theme.textPlaceholder },
                          ],
                        ]}
                      >
                        {taskDate || t.datePlaceholder}
                      </Text>
                      <View
                        style={styles.linkPreviewButton}
                        pointerEvents="none"
                      >
                        <MaterialIcons
                          name="event"
                          size={20}
                          color={theme.primary}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Time Input Field */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t.time}
                  </Text>
                  {Platform.OS === "web" ? (
                    <View
                      style={[
                        styles.linkInputContainer,
                        {
                          backgroundColor: theme.input,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                    >
                      <style>
                        {`
                        #time-input-field::-webkit-calendar-picker-indicator {
                          position: absolute;
                          width: 100%;
                          height: 100%;
                          top: 0;
                          left: 0;
                          opacity: 0;
                          cursor: pointer;
                        }
                        #time-input-field::-webkit-date-and-time-value {
                          text-align: left;
                        }
                      `}
                      </style>
                      <input
                        id="time-input-field"
                        type="time"
                        step="60"
                        value={taskTime}
                        onChange={(e) => setTaskTime(e.target.value)}
                        style={{
                          width: "100%",
                          fontSize: 16,
                          paddingLeft: 16,
                          paddingRight: 16,
                          border: "none",
                          backgroundColor: "transparent",
                          fontFamily: "inherit",
                          outline: "none",
                          height: 50,
                          color: theme.text,
                          cursor: "pointer",
                          position: "relative",
                          textAlign: "left",
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss(); // 關閉鍵盤
                        const now = new Date();
                        setTempTime(
                          taskTime
                            ? new Date(
                                2024,
                                0,
                                1,
                                parseInt(taskTime.split(":")[0]) || 0,
                                parseInt(taskTime.split(":")[1]) || 0,
                              )
                            : now,
                        );
                        setTimePickerVisible(true);
                      }}
                      style={[
                        styles.linkInputContainer,
                        {
                          backgroundColor: theme.input,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dateTimeText,
                          { color: theme.text },
                          !taskTime && [
                            styles.placeholderText,
                            { color: theme.textPlaceholder },
                          ],
                        ]}
                      >
                        {taskTime || t.timePlaceholder}
                      </Text>
                      <View
                        style={styles.linkPreviewButton}
                        pointerEvents="none"
                      >
                        <MaterialIcons
                          name="access-time"
                          size={20}
                          color={theme.primary}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Note Input Field */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t.note}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.noteInput,
                      {
                        backgroundColor: theme.input,
                        borderColor: theme.inputBorder,
                        color: theme.text,
                        height: Math.max(100, Math.min(noteInputHeight, 300)), // 動態高度，最小 100，最大 300
                      },
                    ]}
                    value={taskNote}
                    onChangeText={(text) => {
                      setTaskNote(text);
                      // 根據內容動態調整高度
                      const lineCount = text.split("\n").length;
                      const estimatedHeight = Math.max(
                        100,
                        lineCount * 24 + 24,
                      ); // 每行約 24px + padding
                      setNoteInputHeight(Math.min(estimatedHeight, 300)); // 最大 300px
                    }}
                    placeholder={t.notePlaceholder}
                    placeholderTextColor={theme.textPlaceholder}
                    multiline={true}
                    textAlignVertical="top"
                    accessibilityLabel="Task note input"
                    accessibilityHint="Enter additional notes for this task"
                    onContentSizeChange={(event) => {
                      // 根據實際內容高度調整
                      const { height } = event.nativeEvent.contentSize;
                      setNoteInputHeight(
                        Math.max(100, Math.min(height + 24, 300)),
                      ); // 加上 padding
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        modalScrollViewRef.current?.scrollToEnd({
                          animated: true,
                        });
                      }, 100);
                    }}
                  />
                </View>
              </View>
            </ScrollView>
            <View
              style={[
                styles.modalButtons,
                {
                  backgroundColor:
                    theme.mode === "dark" ? theme.background : "#fff",
                  borderTopColor: theme.mode === "dark" ? "#2a2a2a" : "#f0f0f0",
                },
              ]}
            >
              {editingTask ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      { backgroundColor: theme.backgroundTertiary },
                    ]}
                    onPress={showDeleteConfirm}
                  >
                    <Text
                      style={[styles.deleteButtonText, { color: theme.error }]}
                    >
                      {t.delete}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={saveTask}
                  >
                    <Text
                      style={[
                        styles.saveButtonText,
                        { color: theme.buttonText },
                      ]}
                    >
                      {t.update}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={saveTask}
                  >
                    <Text
                      style={[
                        styles.saveButtonText,
                        { color: theme.buttonText },
                      ]}
                    >
                      {t.save}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
        {renderDatePickerOverlay()}
        {renderTimePickerOverlay()}
      </View>
    </Modal>
  );

  const renderDeleteConfirmModal = () => {
    console.log(
      "renderDeleteConfirmModal called, deleteConfirmVisible:",
      deleteConfirmVisible,
    );

    if (!deleteConfirmVisible) return null;

    return (
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmVisible(false)}
        accessibilityViewIsModal={true}
        accessibilityLabel="Delete Confirmation Modal"
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: theme.modalOverlay,
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setDeleteConfirmVisible(false)}
        >
          <View
            style={{
              backgroundColor: theme.modalBackground,
              borderRadius: 12,
              minWidth: 280,
              maxWidth: 320,
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <View style={{ padding: 24, paddingBottom: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  color: theme.text,
                  textAlign: "center",
                  fontWeight: "600",
                  lineHeight: 24,
                }}
              >
                {t.deleteConfirm}
              </Text>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                width: "100%",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                width: "100%",
              }}
            >
              <TouchableOpacity
                onPress={() => setDeleteConfirmVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  alignItems: "center",
                  borderRightWidth: 1,
                  borderRightColor: theme.divider,
                }}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 17,
                    fontWeight: "400",
                  }}
                >
                  {t.cancel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={deleteTask}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.error,
                    fontSize: 17,
                    fontWeight: "600",
                  }}
                >
                  {t.delete}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderDatePickerOverlay = () => {
    if (!datePickerVisible || Platform.OS === "web") return null;

    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setDatePickerVisible(false)}
        >
          <View
            style={{
              backgroundColor:
                theme.mode === "dark" ? theme.background : "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: insets.bottom,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor:
                  theme.mode === "dark" ? "#2a2a2a" : "#f0f0f0",
              }}
            >
              <TouchableOpacity
                onPress={() => setDatePickerVisible(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 8 }}
              >
                <Text style={{ color: theme.primary, fontSize: 17 }}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (tempDate) {
                    const year = tempDate.getFullYear();
                    const month = String(tempDate.getMonth() + 1).padStart(
                      2,
                      "0",
                    );
                    const day = String(tempDate.getDate()).padStart(2, "0");
                    setTaskDate(`${year}-${month}-${day}`);
                  }
                  setDatePickerVisible(false);
                }}
                style={{ paddingVertical: 8, paddingHorizontal: 8 }}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 17,
                    fontWeight: "600",
                  }}
                >
                  {t.confirm}
                </Text>
              </TouchableOpacity>
            </View>
            {tempDate && (
              <View style={{ alignItems: "center", width: "100%" }}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "calendar"}
                  themeVariant={themeMode === "dark" ? "dark" : "light"}
                  accentColor={theme.primary}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                  style={{ width: "100%" }}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTimePickerOverlay = () => {
    if (!timePickerVisible || Platform.OS === "web") return null;

    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setTimePickerVisible(false)}
        >
          <View
            style={{
              backgroundColor:
                theme.mode === "dark" ? theme.background : "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: insets.bottom,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor:
                  theme.mode === "dark" ? "#2a2a2a" : "#f0f0f0",
              }}
            >
              <TouchableOpacity
                onPress={() => setTimePickerVisible(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 8 }}
              >
                <Text style={{ color: theme.primary, fontSize: 17 }}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (tempTime) {
                    const hours = String(tempTime.getHours()).padStart(2, "0");
                    const minutes = String(tempTime.getMinutes()).padStart(
                      2,
                      "0",
                    );
                    setTaskTime(`${hours}:${minutes}`);
                  }
                  setTimePickerVisible(false);
                }}
                style={{ paddingVertical: 8, paddingHorizontal: 8 }}
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 17,
                    fontWeight: "600",
                  }}
                >
                  {t.confirm}
                </Text>
              </TouchableOpacity>
            </View>
            {tempTime && (
              <View style={{ alignItems: "center", width: "100%" }}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  themeVariant={themeMode === "dark" ? "dark" : "light"}
                  accentColor={theme.primary}
                  onChange={(event, selectedTime) => {
                    if (selectedTime) {
                      setTempTime(selectedTime);
                    }
                  }}
                  style={{ width: "100%" }}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Handle scroll start to detect swipe direction
  const handleScrollBeginDrag = (event) => {
    scrollStartY.current = event.nativeEvent.contentOffset.y;
    isScrolling.current = true;
  };

  // Handle scroll end to detect month changes via swipe
  const handleScrollEnd = (event) => {
    if (!isScrolling.current) {
      return;
    }

    const scrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = scrollStartY.current - scrollY;
    const weekHeight = 50;
    const swipeThreshold = 30; // Minimum scroll distance to change month (30px)

    // Check if user swiped significantly (not just scrolled within calendar)
    // 方向已交換：向下滾動（scrollDelta > 0）→ 上一個月，向上滾動（scrollDelta < 0）→ 下一個月
    if (Math.abs(scrollDelta) > swipeThreshold) {
      if (scrollDelta > 0) {
        // Scrolled down (content moved up) - user wants to see previous month
        goToPrevMonth();
      } else {
        // Scrolled up (content moved down) - user wants to see next month
        goToNextMonth();
      }
    }

    isScrolling.current = false;
    lastScrollY.current = scrollY;
  };

  // Calendar navigation functions
  // Handles vertical swipe gestures for month navigation (fallback for gesture handler)
  const handleVerticalGesture = ({ nativeEvent }) => {
    const { translationY, state } = nativeEvent;
    // State.END = 5 in react-native-gesture-handler
    // Only trigger on gesture end
    if (state === State.END || state === 5) {
      if (translationY < -50) {
        console.log("Gesture: Swipe up detected, going to next month");
        goToNextMonth(); // Swipe up
      } else if (translationY > 50) {
        console.log("Gesture: Swipe down detected, going to previous month");
        goToPrevMonth(); // Swipe down
      }
    }
  };

  // Calendar header UI - Month view
  const monthNames = t.months;
  const monthName = monthNames[visibleMonth];
  const year = visibleYear;

  const goToPrevMonth = () => {
    const newMonth = visibleMonth === 0 ? 11 : visibleMonth - 1;
    const newYear = visibleMonth === 0 ? visibleYear - 1 : visibleYear;
    setVisibleMonth(newMonth);
    setVisibleYear(newYear);
    // Don't change selectedDate when navigating months
    // User is just browsing different months, not selecting a new date
  };

  const goToNextMonth = () => {
    const newMonth = visibleMonth === 11 ? 0 : visibleMonth + 1;
    const newYear = visibleMonth === 11 ? visibleYear + 1 : visibleYear;
    setVisibleMonth(newMonth);
    setVisibleYear(newYear);
    // Don't change selectedDate when navigating months
    // User is just browsing different months, not selecting a new date
  };

  const header = (
    <View style={styles.fixedHeader}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeftContainer}>
          <Text
            style={[
              styles.currentMonthTitle,
              { color: theme.text, marginRight: 4 },
            ]}
          >
            {year} {monthName}
          </Text>
          <TouchableOpacity
            onPress={goToPrevMonth}
            style={styles.dayNavButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={styles.dayNavButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-right" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={[
              styles.todayButton,
              {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => {
              const today = getCurrentDate();
              setSelectedDate(today);
              setVisibleMonth(new Date(today).getMonth());
              setVisibleYear(new Date(today).getFullYear());
            }}
          >
            <Text style={[styles.todayButtonText, { color: "#ffffff" }]}>
              {t.today}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const calendarContent = (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[styles.calendarSection, { backgroundColor: theme.background }]}
      >
        {header}
        <View style={styles.calendarScrollView}>
          <ScrollView
            ref={scrollViewRef}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEnd}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderCalendar()}
            <View style={styles.scrollSpacer} />
          </ScrollView>
        </View>
      </View>
      <View
        style={[
          styles.taskAreaContainer,
          {
            backgroundColor: theme.backgroundSecondary,
            paddingBottom: !loadingUserType && userType === "general" ? 58 : 0,
          },
        ]}
      >
        {renderTaskArea()}
      </View>
      {/* Banner Ad 固定底部，general 一進日曆即可見 */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <AdBanner
          position="bottom"
          size="banner"
          userType={userType}
          loadingUserType={loadingUserType}
        />
      </View>
      {renderModal()}
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ResponsiveContainer style={{ flex: 1 }}>
        {Platform.OS === "web" ? (
          calendarContent
        ) : (
          <GestureHandlerRootView
            style={[styles.container, { backgroundColor: theme.background }]}
          >
            {calendarContent}
          </GestureHandlerRootView>
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

export default function App() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    NotoSansTC_400Regular,
    NotoSansTC_500Medium,
    NotoSansTC_700Bold,
  });

  useEffect(() => {
    // Add Google Fonts for web only - keep it simple for native
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const cleanupElements = [];

      // Add Google Fonts links
      const fontsLink = document.createElement("link");
      fontsLink.href =
        "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap";
      fontsLink.rel = "stylesheet";
      document.head.appendChild(fontsLink);
      cleanupElements.push(fontsLink);

      // Apply fonts using more specific selectors to avoid icon interference
      const style = document.createElement("style");
      style.textContent = `
        /* Apply to all text content containers, but not icons */
        [dir] > * {
          font-family: 'Roboto', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
            Helvetica, Arial, sans-serif !important;
        }
        
        /* Exclude icons and SVG elements */
        [dir] > svg,
        [dir] > * > svg,
        [dir] [role="img"],
        [dir] [aria-label*="icon" i] {
          font-family: inherit !important;
        }
        
        /* Apply to input fields */
        input, textarea, select {
          font-family: 'Roboto', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
            Helvetica, Arial, sans-serif !important;
        }

        body {
          display: flex;
          justify-content: center;
          background-color: #f2f2f2;
        }

        #root {
          width: 375px;
          max-width: 375px;
          min-height: 100vh;
          background-color: #fff;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
        }
      `;
      document.head.appendChild(style);
      cleanupElements.push(style);

      return () => {
        cleanupElements.forEach((el) => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      };
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      const title = getAppDisplayName();
      const setTitle = () => {
        document.title = title;
      };
      setTitle();
      const observer = new MutationObserver(() => {
        if (document.title !== title) {
          document.title = title;
        }
      });
      const titleTag = document.querySelector("title");
      if (titleTag) {
        observer.observe(titleTag, { childList: true });
      }

      return () => observer.disconnect();
    }
  }, []);
  // Always set browser tab title on web
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = getAppDisplayName();
    }
  }, []);
  const [language, setLanguageState] = useState("en");
  const [loadingLang, setLoadingLang] = useState(true);
  const [themeMode, setThemeModeState] = useState("light");
  const [loadingTheme, setLoadingTheme] = useState(true);
  const [userType, setUserTypeState] = useState("general");
  const [loadingUserType, setLoadingUserType] = useState(true);

  // 版本更新狀態
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isSimulatingUpdate, setIsSimulatingUpdate] = useState(false);

  // Load theme function (定義在外部，可以在登入後重新調用)
  // 注意：這個函數會在 App 啟動時和登入後調用
  // 在 App 啟動時，會通過 useEffect 中的 startEarlyPreload 來協調
  const loadTheme = React.useCallback(async () => {
    try {
      console.log("🎨 Loading theme settings...");

      // 檢查預載入是否正在進行中
      if (dataPreloadService.isPreloading) {
        console.log(
          "⏳ [Theme] Preload in progress, waiting for userSettings...",
        );
        try {
          // 等待預載入的 userSettings 部分完成
          await new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 40; // 最多檢查 40 次（2秒）
            const checkInterval = setInterval(() => {
              checkCount++;
              const cachedData = dataPreloadService.getCachedData();
              if (cachedData?.userSettings) {
                console.log(
                  `✅ [Theme] UserSettings found after ${checkCount * 50}ms`,
                );
                clearInterval(checkInterval);
                resolve();
                return;
              }
              // 最多等待 2 秒
              if (checkCount >= maxChecks) {
                console.log(
                  `⏳ [Theme] Timeout after ${maxChecks * 50}ms, proceeding...`,
                );
                clearInterval(checkInterval);
                resolve();
              }
            }, 50); // 每 50ms 檢查一次
          });
        } catch (error) {
          console.log("⏳ [Theme] Preload wait error:", error);
        }
      }

      // 優先檢查預載入緩存
      const cachedData = dataPreloadService.getCachedData();
      let userSettings = cachedData?.userSettings;

      if (userSettings) {
        console.log("📦 [Theme] Using preloaded user settings");
      } else {
        // 如果還是沒有緩存，才從 API 載入（加逾時避免登入後卡住）
        console.log("📥 [Theme] Loading theme settings from Supabase...");
        const THEME_LOAD_TIMEOUT_MS = 5000;
        try {
          userSettings = await Promise.race([
            UserService.getUserSettings(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Theme load timeout")),
                THEME_LOAD_TIMEOUT_MS,
              ),
            ),
          ]);
        } catch (timeoutErr) {
          if (timeoutErr?.message === "Theme load timeout") {
            console.warn(
              `⚠️ [Theme] Supabase timeout after ${THEME_LOAD_TIMEOUT_MS}ms, using default theme`,
            );
            userSettings = { theme: "light" };
          } else {
            throw timeoutErr;
          }
        }
      }

      console.log("📦 Theme settings received:", userSettings);
      console.log(
        "📦 Theme value:",
        userSettings.theme,
        "Type:",
        typeof userSettings.theme,
      );

      // 明確檢查 theme 值
      if (userSettings.theme === "dark" || userSettings.theme === "light") {
        console.log(`✅ Theme loaded: ${userSettings.theme}`);
        setThemeModeState(userSettings.theme);
      } else {
        console.log(
          `⚠️ Invalid theme setting (${userSettings.theme}), using default: light`,
        );
        setThemeModeState("light");
      }
    } catch (error) {
      console.error("❌ Error loading theme settings:", error);
      // 錯誤時使用預設值
      setThemeModeState("light");
    } finally {
      setLoadingTheme(false);
    }
  }, []);

  const loadUserType = useCallback(async () => {
    try {
      setLoadingUserType(true);

      // 先等待預載入開始
      const preloadPromise = dataPreloadService.preloadPromise;
      if (preloadPromise) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2000),
          );
          await Promise.race([preloadPromise, timeoutPromise]);
        } catch (error) {
          console.log("⏳ [UserType] Preload wait error:", error);
        }
      }

      // 優先檢查預載入緩存
      const cachedData = dataPreloadService.getCachedData();
      let userSettings = cachedData?.userSettings;

      if (!userSettings) {
        userSettings = await UserService.getUserSettings();
      }

      if (userSettings && userSettings.user_type) {
        setUserTypeState(userSettings.user_type);
      }
    } catch (error) {
      console.error("❌ Error loading user type settings:", error);
    } finally {
      setLoadingUserType(false);
    }
  }, []);

  // Request notification permissions on app start (native only)
  useEffect(() => {
    if (Platform.OS !== "web") {
      const requestNotificationPermissions = async () => {
        try {
          const granted = await registerForPushNotificationsAsync();
          if (granted) {
            console.log("✅ Notification permissions granted");
          } else {
            console.log("❌ Notification permissions denied");
          }
        } catch (error) {
          console.error("Error requesting notification permissions:", error);
        }
      };
      requestNotificationPermissions();
    }
  }, []);

  useEffect(() => {
    // Set browser tab title
    if (typeof document !== "undefined") {
      document.title = getAppDisplayName();
    }

    // 初始化 Google Analytics (僅 Web 平台且 Production 環境)
    if (Platform.OS === "web") {
      const env = getCurrentEnvironment();
      if (env === "production") {
        ReactGA.initialize(process.env.EXPO_PUBLIC_GA_WEB_ID || "G-EW2TBM5EML");
        console.log("✅ [GA] Web Production 環境 - 已初始化");
      } else {
        console.log(
          `🔧 [GA] Web ${env} 環境 - 跳過初始化（僅 Production 追蹤）`,
        );
      }
    }

    // 初始化 Mixpanel (僅 iOS/Android 平台且 Production 環境)
    if (Platform.OS !== "web") {
      const env = getCurrentEnvironment();
      if (env === "production") {
        mixpanelService.initialize();
        mixpanelService.track("App Opened");
      }
    }

    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.location
    ) {
      ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }

    // 在 App 層級提前開始預載入（如果有 session）
    // 這樣可以確保 loadLanguage/loadTheme 能使用預載入緩存
    const startEarlyPreload = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          console.log("🚀 [App] Starting early preload...");
          // 開始預載入，但不等待完成
          dataPreloadService.preloadAllData().catch((preloadError) => {
            console.error("❌ [App] Error in early preload:", preloadError);
          });
          return true; // 返回 true 表示預載入已開始
        }
        return false; // 沒有 session，不預載入
      } catch (error) {
        console.error(
          "❌ [App] Error checking session for early preload:",
          error,
        );
        return false;
      }
    };

    // 先啟動預載入（如果有的話）
    const preloadStartedPromise = startEarlyPreload();

    // Load language from Supabase user settings
    const loadLanguage = async () => {
      try {
        console.log("🌐 Loading language settings...");

        // 等待預載入開始（如果有的話）
        const preloadStarted = await preloadStartedPromise;

        // 如果預載入已開始，等待 userSettings 載入完成（最多等待 2 秒）
        if (preloadStarted && dataPreloadService.isPreloading) {
          console.log(
            "⏳ [Language] Preload in progress, waiting for userSettings...",
          );
          try {
            // 等待預載入的 userSettings 部分完成
            await new Promise((resolve) => {
              let checkCount = 0;
              const maxChecks = 40; // 最多檢查 40 次（2秒）
              const checkInterval = setInterval(() => {
                checkCount++;
                const cachedData = dataPreloadService.getCachedData();
                if (cachedData?.userSettings) {
                  console.log(
                    `✅ [Language] UserSettings found after ${checkCount * 50}ms`,
                  );
                  clearInterval(checkInterval);
                  resolve();
                  return;
                }
                // 最多等待 2 秒
                if (checkCount >= maxChecks) {
                  console.log(
                    `⏳ [Language] Timeout after ${maxChecks * 50}ms, proceeding...`,
                  );
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 50); // 每 50ms 檢查一次
            });
          } catch (error) {
            console.log("⏳ [Language] Preload wait error:", error);
          }
        }

        // 優先檢查預載入緩存
        const cachedData = dataPreloadService.getCachedData();
        let userSettings = cachedData?.userSettings;

        if (userSettings) {
          console.log("📦 [Language] Using preloaded user settings");
        } else {
          // 如果還是沒有緩存，才從 API 載入
          console.log(
            "📥 [Language] Loading language settings from Supabase...",
          );
          userSettings = await UserService.getUserSettings();
        }

        console.log("📦 User settings received:", userSettings);

        if (
          userSettings.language &&
          (userSettings.language === "en" ||
            userSettings.language === "zh" ||
            userSettings.language === "es")
        ) {
          console.log(`✅ Language loaded: ${userSettings.language}`);
          setLanguageState(userSettings.language);
        } else {
          console.log("⚠️ No language setting found, using default: en");
        }
      } catch (error) {
        console.error("❌ Error loading language settings:", error);
        // Fallback to AsyncStorage if Supabase fails
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((lang) => {
          if (lang && (lang === "en" || lang === "zh" || lang === "es")) {
            console.log(`📱 Language loaded from AsyncStorage: ${lang}`);
            setLanguageState(lang);
          }
        });
      } finally {
        setLoadingLang(false);
      }
    };

    // 每次 App 啟動時都更新平台資訊
    const updatePlatformOnStart = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await UserService.updatePlatformInfo();
          console.log("📱 Platform info updated on app start");
        }
      } catch (error) {
        console.error("Error updating platform on start:", error);
      }
    };

    // 先等待預載入開始，然後再載入 language 和 theme
    // 這樣可以確保它們能使用預載入緩存
    (async () => {
      await preloadStartedPromise;
      loadLanguage();
      loadTheme();
      loadUserType();
    })();

    updatePlatformOnStart();
  }, [loadTheme]);

  // 主動檢查版本更新
  useEffect(() => {
    if (Platform.OS === "web") return;

    const LAST_UPDATE_PROMPT_KEY = "LAST_UPDATE_PROMPT_INFO";

    const checkShouldShowPrompt = async (latestVersion, forceUpdate) => {
      if (forceUpdate) return true;

      try {
        const storedInfo = await AsyncStorage.getItem(LAST_UPDATE_PROMPT_KEY);
        if (!storedInfo) return true;

        const { version, timestamp } = JSON.parse(storedInfo);

        // 如果偵測到更新的版本，不受 24 小時限制
        if (versionService.compareVersions(latestVersion, version) > 0) {
          return true;
        }

        // 否則檢查是否超過 24 小時 (24 * 60 * 60 * 1000)
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        return now - timestamp > oneDay;
      } catch (error) {
        console.error("Error checking version prompt frequency:", error);
        return true; // 發生錯誤時預設顯示，確保用戶看到更新
      }
    };

    const checkUpdateProactively = async () => {
      try {
        console.log("🔍 [App] 開始主動檢查版本更新...");
        const info = await versionService.checkForUpdates();

        if (info.hasUpdate) {
          const shouldShow = await checkShouldShowPrompt(
            info.latestVersion,
            info.forceUpdate,
          );

          if (shouldShow) {
            console.log("🔔 [App] 顯示版本更新提示:", info.latestVersion);
            setUpdateInfo(info);
            setIsUpdateModalVisible(true);

            // 記錄本次提示的版本與時間
            await AsyncStorage.setItem(
              LAST_UPDATE_PROMPT_KEY,
              JSON.stringify({
                version: info.latestVersion,
                timestamp: Date.now(),
              }),
            );
          }
        }
      } catch (error) {
        console.error("❌ [App] 主動檢查版本失敗:", error);
      }
    };

    // EAS OTA：僅在 production build 檢查並套用 JS 更新（dev client 不執行）
    const checkAndApplyOTA = async () => {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.warn("⚠️ [OTA] 檢查/套用更新失敗:", e?.message ?? e);
      }
    };

    // 延遲一下再檢查，避免與啟動流程競爭資源；OTA 先跑（2s），商店版本檢查 3s
    const otaTimer = setTimeout(checkAndApplyOTA, 2000);
    const storeTimer = setTimeout(checkUpdateProactively, 3000);
    return () => {
      clearTimeout(otaTimer);
      clearTimeout(storeTimer);
    };
  }, []);

  const setLanguage = async (lang) => {
    console.log(`🌐 Setting language to: ${lang}`);
    setLanguageState(lang);

    try {
      // Save to Supabase user settings (platform 會自動更新)
      const result = await UserService.updateUserSettings({
        language: lang,
      });
      console.log("✅ Language saved to Supabase:", result);

      // 更新預載入緩存，確保 reminder_settings 等設定保持最新
      // 使用 Supabase 返回的完整結果更新緩存，這樣可以保留 reminder_settings
      if (result) {
        dataPreloadService.updateCachedUserSettings(result);
      }
    } catch (error) {
      // 檢查是否為網絡錯誤
      const isNetworkError =
        error.message?.includes("Network request failed") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("network") ||
        (!error.code && error.message);

      if (isNetworkError) {
        console.warn(
          "⚠️ Network error saving language to Supabase:",
          error.message,
        );
      } else {
        console.error("❌ Error saving language to Supabase:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      }
      // Fallback to AsyncStorage
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  };

  const setThemeMode = async (mode) => {
    console.log(`🎨 Setting theme to: ${mode}`);
    setThemeModeState(mode);

    try {
      // Save to Supabase user settings (platform 會自動更新)
      const result = await UserService.updateUserSettings({
        theme: mode,
      });
      console.log("✅ Theme saved to Supabase:", result);
    } catch (error) {
      console.error("❌ Error saving theme to Supabase:", error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
  };

  const t = translations[language] || translations.en;
  const theme = getTheme(themeMode);

  // Wait for fonts and language to load
  // Add timeout fallback to prevent infinite white screen
  const [fontTimeout, setFontTimeout] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Font loading timeout - continuing anyway");
      setFontTimeout(true);
    }, 3000); // Reduced from 5s to 3s
    return () => clearTimeout(timer);
  }, []);

  // Log font loading status
  React.useEffect(() => {
    console.log("Font loading status:", {
      fontsLoaded,
      fontTimeout,
      loadingLang,
      loadingTheme,
    });
  }, [fontsLoaded, fontTimeout, loadingLang, loadingTheme]);

  // Allow app to start even if fonts aren't loaded (with fallback)
  if (!fontsLoaded && !fontTimeout) {
    console.log("Waiting for fonts...");
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16, color: "#666" }}>Loading...</Text>
      </View>
    );
  }
  if ((loadingLang || loadingTheme || loadingUserType) && !fontTimeout) {
    console.log("Waiting for language, theme and user type...");
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16, color: "#666" }}>Loading...</Text>
      </View>
    );
  }

  function MainTabs() {
    const { t } = useContext(LanguageContext);
    const { theme } = useContext(ThemeContext);
    React.useEffect(() => {
      if (typeof document !== "undefined") {
        setTimeout(() => {
          document.title = getAppDisplayName();
        }, 0);
      }
    });
    return (
      <Tab.Navigator
        initialRouteName="Calendar"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === "Calendar") {
              iconName = "calendar-today";
            } else if (route.name === "Setting") {
              iconName = "settings";
            }
            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.mode === "dark" ? "#ffffff" : "#000000",
          tabBarInactiveTintColor: "#888888",
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 80,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: theme.tabBarBackground,
            borderTopWidth: 1,
            borderTopColor: theme.divider,
          },
          tabBarIconStyle: {
            justifyContent: "center",
            alignItems: "center",
            marginTop: "auto",
            marginBottom: "auto",
          },
        })}
      >
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: t.calendar }}
        />
        <Tab.Screen
          name="Setting"
          component={SettingScreen}
          options={{ title: t.settings }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <ThemeContext.Provider
      value={{ theme, themeMode, setThemeMode, toggleTheme, loadTheme }}
    >
      <UserContext.Provider
        value={{
          userType,
          loadingUserType,
          setUserType: setUserTypeState,
          loadUserType,
          setUpdateInfo,
          setIsUpdateModalVisible,
          isSimulatingUpdate,
          setIsSimulatingUpdate,
        }}
      >
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
          <NavigationContainer
            linking={{
              prefixes: [
                getRedirectUrl(),
                "http://localhost:8081",
                "taskcal://",
              ],
              config: {
                screens: {
                  Splash: "",
                  MainTabs: "app",
                  Terms: "terms",
                  Privacy: "privacy",
                },
              },
            }}
            onStateChange={() => {
              if (typeof document !== "undefined") {
                document.title = getAppDisplayName();
              }
            }}
          >
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: "horizontal",
              }}
              initialRouteName="Splash"
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  animationEnabled: false,
                }}
              />
              <Stack.Screen
                name="Terms"
                component={TermsScreen}
                options={{
                  headerShown: false,
                  presentation: "card",
                  gestureEnabled: true,
                  gestureDirection: "horizontal",
                }}
              />
              <Stack.Screen
                name="Privacy"
                component={PrivacyScreen}
                options={{
                  headerShown: false,
                  presentation: "card",
                  gestureEnabled: true,
                  gestureDirection: "horizontal",
                }}
              />
            </Stack.Navigator>
            <VersionUpdateModal
              visible={isUpdateModalVisible}
              onClose={() => setIsUpdateModalVisible(false)}
              updateInfo={updateInfo}
              forceUpdate={updateInfo?.forceUpdate}
              theme={theme}
            />
          </NavigationContainer>
        </LanguageContext.Provider>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

// ...

// Helper function to get font family based on platform and language
const getFontFamily = (language = "en", weight = "regular") => {
  if (Platform.OS === "web") {
    // For web, use CSS font family with fallback
    const isChinese = language === "zh";
    if (weight === "bold") {
      return isChinese
        ? '"Noto Sans TC", "Roboto", -apple-system, system-ui, sans-serif'
        : '"Roboto", "Noto Sans TC", -apple-system, system-ui, sans-serif';
    }
    return isChinese
      ? '"Noto Sans TC", "Roboto", -apple-system, system-ui, sans-serif'
      : '"Roboto", "Noto Sans TC", -apple-system, system-ui, sans-serif';
  }

  // For native apps, use loaded fonts
  const isChinese = language === "zh";
  if (weight === "bold") {
    return isChinese ? "NotoSansTC_700Bold" : "Roboto_700Bold";
  } else if (weight === "medium") {
    return isChinese ? "NotoSansTC_500Medium" : "Roboto_500Medium";
  }
  return isChinese ? "NotoSansTC_400Regular" : "Roboto_400Regular";
};

const styles = StyleSheet.create({
  taskItemRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  checkbox: {
    marginRight: 2,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTextChecked: {
    textDecorationLine: "line-through",
    color: "#bbb",
  },
  fabAddButton: {
    position: "absolute",
    right: 20,
    bottom: 8,
    zIndex: 10,
    borderRadius: 32,
    backgroundColor: "#6c63ff",
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },
  // ...
  // Removed bottomMenuBar style, handled by Tab.Navigator now

  container: {
    flex: 1,
    flexDirection: "column",
    // backgroundColor moved to inline style to use theme
  },
  calendarSection: {
    flexShrink: 0,
    paddingVertical: 4, // Reduced from 8 to give more space to task area
    // backgroundColor moved to inline style to use theme
  },
  taskAreaContainer: {
    // backgroundColor moved to inline style to use theme
    width: "100%",
    flex: 1,
  },
  taskArea: {
    flex: 1,
    // backgroundColor moved to inline style to use theme
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  fixedHeader: {
    backgroundColor: "transparent",
    zIndex: 10,
  },
  currentMonthTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "left",
  },
  weekDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16, // 8 (original) + 8 (to compensate for marginHorizontal)
    paddingBottom: 6, // Reduced from 8
    marginHorizontal: -8, // Extend border line to edges (matches customCalendar marginHorizontal)
    borderBottomWidth: 1,
  },
  // Scroll container
  calendarDivider: {
    height: 1,
    backgroundColor: "#bbbbbb",
    marginBottom: 4,
  },
  calendarScrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  scrollSpacer: {
    height: 4, // Reduced from 10 to minimize space
  },
  // Month container
  monthContainer: {
    marginBottom: 0,
  },
  customCalendar: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    padding: 4,
    paddingBottom: 6, // Extra bottom padding to ensure task dots are visible
    marginHorizontal: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontWeight: "400",
    minWidth: 40,
    maxWidth: 40,
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44, // Reduced from 50 to make calendar more compact
    paddingHorizontal: 4,
  },
  emptyDate: {
    width: 40,
    height: 40,
    margin: 2,
  },
  hiddenDate: {
    opacity: 0,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    borderRadius: 8,
    zIndex: 1,
    minWidth: 40,
    maxWidth: 40,
    minHeight: 40,
    maxHeight: 40,
    overflow: "visible", // Ensure task dots are visible
  },
  calendarDayContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible", // Ensure task dots are visible
  },
  dateContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible", // Ensure task dots are visible
  },
  calendarDayText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  selectedDay: {
    backgroundColor: "#e8e7fc", // Light mode selected background
    zIndex: 3,
    elevation: 2,
    minWidth: 40,
    maxWidth: 40,
    minHeight: 40,
    maxHeight: 40,
  },
  selectedDayText: {
    color: "#6c63ff", // Light mode selected text color
    fontWeight: "700",
    zIndex: 4,
  },
  otherMonthText: {
    color: "#999999",
  },
  calendarDayMoveTarget: {
    borderColor: "#ffb300",
    borderWidth: 2,
  },
  taskDot: {
    position: "absolute",
    bottom: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6c63ff",
    zIndex: 10,
  },
  todayCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: {
    color: "#ffffff", // Always white for better contrast on purple background
    fontWeight: "600",
    fontSize: 14,
  },
  dateTextContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  dayViewDateContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
  },
  dayViewDayButton: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    position: "relative",
  },
  dayViewDayNumber: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 56,
  },
  selectedDayLarge: {
    backgroundColor: "#e8e7fc",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  todayCircleLarge: {
    backgroundColor: "#6c63ff",
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  todayTextLarge: {
    color: "white",
    fontWeight: "700",
  },
  selectedDateLarge: {
    // No additional styling needed
  },
  taskDotLarge: {
    position: "absolute",
    bottom: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6c63ff",
  },
  noTaskContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDate: {
    // No background color, just text color change
  },
  selectedDayText: {
    color: "#6c63ff", // Same as add button color
    fontWeight: "600",
  },
  tasksContainer: {
    flex: 1,
    backgroundColor: "#f7f7fa",
  },
  taskAreaContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  taskArea: {
    flex: 1,
    backgroundColor: "#f7f7fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  tasksHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 12,
    width: "100%",
    backgroundColor: "#f7f7fa", // Match tasks container background
    paddingTop: 8,
  },
  tasksHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3d3d4e",
    flex: 1,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  addButton: {
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: "#6c63ff",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
  },
  addButtonText: {
    fontSize: 20,
    lineHeight: 24,
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  taskList: {
    width: "100%",
    paddingHorizontal: 12,
  },
  taskItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  taskTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    flexShrink: 1,
  },
  taskText: {
    fontSize: 16,
    color: "#333",
    textDecorationLine: "none",
    flexShrink: 1,
    maxWidth: "100%",
  },
  taskTimeContainer: {
    flexShrink: 0,
    alignItems: "flex-end",
    minWidth: 60,
  },
  moveHint: {
    color: "#ffb300",
    fontWeight: "700",
    marginLeft: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#3d3d4e",
  },
  linkInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    height: 50,
  },
  linkInputContainerFocused: {
    borderColor: "#6c63ff",
  },
  linkInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: "transparent",
    textAlignVertical: "center",
    borderRadius: 12,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        lineHeight: 50, // iOS: 使用 lineHeight 實現垂直置中
      },
      android: {
        textAlignVertical: "center",
      },
    }),
  },
  linkPreviewButton: {
    padding: 8,
    marginLeft: 8,
  },
  placeholderText: {
    color: "#888",
  },
  timeInput: {
    height: 50,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  timeInputSelected: {
    borderColor: "#6c63ff",
    backgroundColor: "#f0f0ff",
  },
  timeInputText: {
    fontSize: 16,
    color: "#888",
    flex: 1,
  },
  timeInputTextFilled: {
    color: "#222",
    fontWeight: "500",
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  timePickerCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  timePickerBody: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  timeWheelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeWheel: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  timeWheelLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  timeWheelList: {
    height: 200,
    width: 80,
  },
  timeWheelContent: {
    alignItems: "center",
    paddingVertical: 75,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6c63ff",
    marginHorizontal: 10,
  },
  timeWheelItem: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  timeWheelItemSelected: {
    backgroundColor: "#6c63ff",
  },
  timeWheelText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
  timeWheelTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  timeWheelHighlight: {
    position: "absolute",
    top: 75,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#6c63ff",
  },
  timePickerActions: {
    flexDirection: "row",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  simpleTimePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  simpleTimePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  simpleTimePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  simpleTimePickerCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  simpleTimePickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  simpleTimePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  simpleTimePickerDone: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  simpleTimePickerDoneText: {
    fontSize: 16,
    color: "#6c63ff",
    fontWeight: "600",
  },
  simpleTimePickerBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  simpleTimeInputs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  simpleTimeInput: {
    alignItems: "center",
    flex: 1,
  },
  simpleTimeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  simpleTimeTextInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: "center",
    width: 80,
    backgroundColor: "#f9f9f9",
  },
  simpleTimeSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6c63ff",
    marginHorizontal: 20,
  },
  timeInputContainer: {
    padding: 20,
    alignItems: "center",
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeNumberInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    width: 60,
    backgroundColor: "#f9f9f9",
  },
  timeColon: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#666",
    marginHorizontal: 10,
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  timePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  timePickerCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  timePickerDone: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerDoneText: {
    fontSize: 16,
    color: "#6c63ff",
    fontWeight: "600",
  },
  timePickerBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timeWheelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeWheel: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  timeWheelList: {
    height: 200,
    width: 80,
  },
  timeWheelContent: {
    alignItems: "center",
    paddingVertical: 75,
  },
  timeWheelItem: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  timeWheelItemSelected: {
    backgroundColor: "#6c63ff",
  },
  timeWheelText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
  timeWheelTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  timeWheelHighlight: {
    position: "absolute",
    top: 75,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#6c63ff",
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6c63ff",
    marginHorizontal: 10,
  },
  spinnerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: 280,
    alignItems: "center",
  },
  spinnerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  spinnerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  spinnerColumn: {
    alignItems: "center",
    flex: 1,
  },
  spinnerLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  spinner: {
    height: 120,
    width: 60,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  spinnerList: {
    flex: 1,
  },
  spinnerContent: {
    paddingVertical: 40,
  },
  spinnerItem: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerText: {
    fontSize: 16,
    color: "#333",
  },
  spinnerColon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginHorizontal: 10,
  },
  spinnerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  spinnerCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  spinnerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  spinnerDone: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#6c63ff",
    alignItems: "center",
  },
  spinnerDoneText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  taskTimeRight: {
    fontSize: 14,
    color: "#6c63ff",
    fontWeight: "600",
    textAlign: "right",
  },
  timePickerModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  timeWheelContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
  },
  timeWheel: {
    height: 200,
    width: 80,
    position: "relative",
    overflow: "hidden",
  },
  timeWheelItem: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  timeWheelItemSelected: {
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    borderRadius: 20,
  },
  timeWheelText: {
    fontSize: 20,
    color: "#888",
  },
  timeWheelTextSelected: {
    fontSize: 24,
    color: "#6c63ff",
    fontWeight: "600",
  },
  timeWheelHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 40,
    marginTop: -20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#6c63ff",
    zIndex: -1,
  },
  timeSeparator: {
    fontSize: 28,
    marginHorizontal: 8,
    color: "#6c63ff",
    fontWeight: "600",
  },
  timePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 10,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f9fa",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "500",
  },
  timePickerContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3d3d4e",
  },
  timePickerClose: {
    padding: 8,
  },
  timePickerBody: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timePicker: {
    width: "100%",
  },
  timePicker: {
    width: "100%",
  },
  doneButton: {
    padding: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 10,
  },
  doneButtonText: {
    color: "#6c63ff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 24,
    ...(Platform.OS === "web" && {
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputFilled: {
    borderColor: "#6c63ff",
  },
  noteInput: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  modalButtons: {
    minHeight: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 26,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
  },
  saveButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 80,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  modalBackButton: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    zIndex: 999,
    backgroundColor: "transparent",
  },
  modalHeaderSpacer: {
    width: 48,
  },
  modalCloseButton: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ff5a5f",
    fontWeight: "500",
    fontSize: 14,
  },
  taskContent: {
    flex: 1,
  },
  taskUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  userAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  userDisplayName: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  // 簡化時間選擇器樣式
  simpleTimePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  simpleTimePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  simpleTimePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  simpleTimePickerCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  simpleTimePickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  simpleTimePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  simpleTimePickerDone: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  simpleTimePickerDoneText: {
    fontSize: 16,
    color: "#6c63ff",
    fontWeight: "600",
  },
  simpleTimePickerBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  simpleTimeWheelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  simpleTimeWheel: {
    height: 200,
    width: 80,
    marginHorizontal: 10,
  },
  simpleTimeWheelContent: {
    alignItems: "center",
    paddingVertical: 75,
  },
  simpleTimeWheelItem: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  simpleTimeWheelItemSelected: {
    backgroundColor: "#6c63ff",
  },
  simpleTimeWheelText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
  },
  simpleTimeWheelTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  simpleTimeSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6c63ff",
    marginHorizontal: 10,
  },
  // 原生時間選擇器樣式
  nativeTimePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  nativeTimePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  nativeTimePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  nativeTimePickerCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  nativeTimePickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  nativeTimePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  nativeTimePickerDone: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  nativeTimePickerDoneText: {
    fontSize: 16,
    color: "#6c63ff",
    fontWeight: "600",
  },
  nativeTimePickerBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  nativeDateTimePicker: {
    width: 200,
    height: 200,
  },
  // 簡化的時間選擇器樣式
  timePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  timePickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  timePickerCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  timePickerDone: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerDoneText: {
    fontSize: 16,
    color: "#6c63ff",
    fontWeight: "600",
  },
  timePickerBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  dateTimePicker: {
    width: 200,
    height: 200,
  },
  // Web 時間選擇器樣式
  webTimePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  webTimePickerRow: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  webTimePickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  webTimePickerColumn: {
    height: 200,
    width: 60,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  webTimePickerContent: {
    alignItems: "center",
    paddingVertical: 84, // 讓當前時間顯示在中間
  },
  webTimePickerItem: {
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 1,
    borderRadius: 4,
  },
  webTimePickerItemSelected: {
    backgroundColor: "#6c63ff",
  },
  webTimePickerText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  webTimePickerTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  webTimePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  webTimePickerColumn: {
    alignItems: "center",
    marginHorizontal: 15,
  },
  webTimePickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  webTimePickerList: {
    height: 200,
    width: 80,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  webTimePickerContent: {
    paddingVertical: 85, // 讓中間的項目居中顯示
  },
  webTimePickerItem: {
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 1,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  webTimePickerItemSelected: {
    backgroundColor: "#6c63ff",
  },
  webTimePickerText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  webTimePickerTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  webTimeSeparator: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6c63ff",
    marginHorizontal: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  headerLeftContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 0,
  },
  dayNavButton: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayViewHeaderContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  dayViewDateText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  dayViewDateNumber: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 40,
  },
  dayViewMonthYear: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 2,
  },
  dayViewCalendarContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    minHeight: 120,
  },
  dayViewContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  todayButton: {
    backgroundColor: "#6c63ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  todayButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  taskAreaContent: {
    flex: 1,
  },
  tasksScrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 8, // Minimal padding for last item visibility
  },
});
