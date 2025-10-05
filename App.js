import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import Svg, { Path, Circle, Rect, Line, Ellipse } from "react-native-svg";
import ReactGA from "react-ga4";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
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
  Platform,
  Dimensions,
} from "react-native";
import { supabase } from "./supabaseClient";
import { SafeAreaView } from "react-native-safe-area-context";

// Services
import { TaskService } from "./src/services/taskService";
import { UserService } from "./src/services/userService";

// Storage
import AsyncStorage from "@react-native-async-storage/async-storage";

// Navigation
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

// UI Components
import { MaterialIcons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
  Swipeable,
} from "react-native-gesture-handler";
import DateTimePicker from "@react-native-community/datetimepicker";

const TASKS_STORAGE_KEY = "TASKS_STORAGE_KEY";
const LANGUAGE_STORAGE_KEY = "LANGUAGE_STORAGE_KEY";

// Translation dictionaries
const translations = {
  en: {
    settings: "Settings",
    userName: "User Name",
    account: "Account",
    logout: "Log out",
    comingSoon: "Coming soon...",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    version: "Version",
    general: "General",
    legal: "Legal",
    calendar: "Calendar",
    noTasks: "No tasks for this day.",
    addTask: "Enter a new task...",
    createTask: "Create task",
    editTask: "Edit task",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    moveHint: "Tap a date to move",
    moveTask: "Move Task",
    moveTaskAlert: "Now tap a date on the calendar to move this task.",
    language: "Language",
    english: "English",
    chinese: "繁體中文(台灣)",
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    weekDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    signOutSuccess: "Successfully signed out!",
    alreadySignedOut: "You are already signed out.",
    signOutError: "Failed to sign out. Please try again.",
  },
  zh: {
    settings: "設定",
    userName: "使用者名稱",
    account: "帳號",
    logout: "登出",
    comingSoon: "敬請期待...",
    terms: "使用條款",
    privacy: "隱私政策",
    version: "版本",
    general: "一般",
    legal: "法律",
    calendar: "行事曆",
    noTasks: "這天沒有任務。",
    addTask: "輸入新任務...",
    createTask: "新增任務",
    editTask: "編輯任務",
    save: "儲存",
    cancel: "取消",
    delete: "刪除",
    moveHint: "點選日期以移動",
    moveTask: "移動任務",
    moveTaskAlert: "請點選日曆上的日期以移動此任務。",
    language: "語言",
    english: "English",
    chinese: "繁體中文(台灣)",
    months: [
      "一月",
      "二月",
      "三月",
      "四月",
      "五月",
      "六月",
      "七月",
      "八月",
      "九月",
      "十月",
      "十一月",
      "十二月",
    ],
    weekDays: ["日", "一", "二", "三", "四", "五", "六"],
    signOutSuccess: "成功登出！",
    alreadySignedOut: "您已經登出。",
    signOutError: "登出失敗。請再試一次。",
  },
};

// Language context
const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Handle OAuth callback if this is a redirect from OAuth
    const handleOAuthCallback = async () => {
      try {
        // First, try to get the session from the URL if this is an OAuth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (data?.session) {
          console.warn("OAuth callback: User session found");
          // Force a refresh of the auth state
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error("Failed to get user after OAuth:", userError);
            return;
          }

          console.warn("OAuth callback: User verified, navigating to main app");
          navigateToMainApp();
        }
      } catch (error) {
        console.error("Error handling OAuth callback:", error);
      }
    };

    // Navigate to main app
    const navigateToMainApp = () => {
      if (!navigation) {
        console.error("Navigation object is not available");
        return;
      }

      try {
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } catch (error) {
        console.error("Navigation error:", error);
      }
    };

    // Set up auth state change listener
    const { data: { subscription: authSubscription } = {} } =
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.warn("Auth state changed:", { event, session });

        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          try {
            // Get the current session
            const {
              data: { session: currentSession },
              error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !currentSession) {
              console.error("Error getting current session:", sessionError);
              return;
            }

            // Verify the user
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
              console.error("User verification failed:", userError);
              return;
            }

            console.log("User verified, navigating to main app");
            navigateToMainApp();
          } catch (error) {
            console.error("Error in auth state change handler:", error);
          }
        }
      });

    // Cleanup auth subscription on unmount
    const cleanupAuthSubscription = () => {
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };

    // Check for existing session on mount
    const checkSession = async () => {
      try {
        console.warn("Checking for existing session...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (session) {
          console.warn("Existing session found, verifying user...");
          // Verify the user is still valid
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error("Session invalid or user not found:", userError);
            return;
          }

          console.warn("Session and user verified, navigating to main app");
          navigateToMainApp();
        } else {
          console.warn("No existing session found, showing login");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    // Handle deep linking for OAuth redirects
    const handleDeepLink = (event) => {
      if (event?.url) {
        console.warn("Deep link received:", event.url);
        const url = new URL(event.url);
        if (url.pathname.includes("auth/callback")) {
          console.warn("Auth callback detected in deep link");
          handleOAuthCallback();
        }
      }
    };

    // Check for initial URL if this is a web app
    const checkInitialUrl = async () => {
      if (Platform.OS === "web") {
        const url = new URL(window.location.href);
        if (
          url.pathname.includes("auth/callback") ||
          url.hash.includes("access_token")
        ) {
          console.warn("Initial URL is an auth callback");
          await handleOAuthCallback();
          return;
        }
      }

      // If not an auth callback, check for existing session
      await checkSession();
    };

    // Add deep link listener
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Initial check for session or auth callback
    checkInitialUrl();

    // Add a fallback check after a short delay for web OAuth
    if (Platform.OS === "web") {
      const fallbackCheck = setTimeout(async () => {
        console.warn("Fallback: Checking session after delay");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          console.warn("Fallback: Session found, navigating to main app");
          navigateToMainApp();
        }
      }, 2000);

      return () => {
        clearTimeout(fallbackCheck);
        if (subscription?.remove) {
          subscription.remove();
        } else if (subscription) {
          // Fallback for older React Native versions
          Linking.removeEventListener("url", handleDeepLink);
        }
        cleanupAuthSubscription();
      };
    }

    // Cleanup
    return () => {
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
    const unsubscribe = navigation.addListener("state", (e) => {
      console.warn("Navigation state changed:", e.data.state);
    });
    return unsubscribe;
  }, [navigation]);

  const handleGoogleSignIn = async () => {
    console.group("Google Authentication");
    try {
      console.warn("VERBOSE: Starting Google authentication process");

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
        console.warn("VERBOSE: User is already signed in");
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
        return;
      }

      // Use the correct redirect URL for Expo
      const redirectUrl =
        Platform.OS === "web"
          ? `${window.location.origin}/auth/callback`
          : Linking.createURL("auth/callback");
      console.warn("VERBOSE: Using redirect URL:", redirectUrl);

      // Start the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
          skipBrowserRedirect: false, // Let Supabase handle the redirect
        },
      });

      if (error) {
        console.error("CRITICAL: OAuth sign-in failed:", error);
        throw error;
      }

      if (data?.url) {
        console.warn("VERBOSE: Opening auth URL in browser");
        if (Platform.OS === "web") {
          // For web, we need to redirect to the auth URL
          console.warn("VERBOSE: Redirecting to:", data.url);
          // Use window.location.replace to avoid back button issues
          window.location.replace(data.url);
        } else {
          // For mobile, open the auth URL in a web browser
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );
          console.warn("VERBOSE: Auth session result:", result);

          // After returning from the auth flow, check the session
          const {
            data: { session: newSession },
            error: sessionCheckError,
          } = await supabase.auth.getSession();
          if (sessionCheckError) {
            console.error(
              "Error checking session after auth:",
              sessionCheckError
            );
            return;
          }

          if (newSession) {
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            });
          }
        }
      } else {
        console.warn("VERBOSE: No URL returned from OAuth");
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
          },
          {
            text: "Retry",
            onPress: handleGoogleSignIn,
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    } finally {
      console.groupEnd();
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
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
          source={require("./assets/logo.png")}
          style={{ width: 140, height: 140, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#3d3d4e",
            marginBottom: 48,
            letterSpacing: 1,
          }}
        >
          Too Doo List
        </Text>
        <View style={{ width: 260 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#6c63ff",
              borderRadius: 12,
              paddingVertical: 16,
              width: "100%",
              alignItems: "center",
              marginBottom: 18,
              shadowColor: "#6c63ff",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 5,
              elevation: 3,
            }}
            onPress={() => navigation.navigate("MainTabs")}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "bold",
                fontSize: 19,
                letterSpacing: 0.5,
              }}
            >
              Quick Start
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderColor: "#dadada",
              borderWidth: 1,
              borderRadius: 4,
              paddingVertical: 12,
              justifyContent: "center",
              marginBottom: 10,
              width: "100%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            }}
            onPress={handleGoogleSignIn}
          >
            <Image
              source={require("./assets/google-logo.png")}
              style={{ width: 24, height: 24, marginRight: 8 }}
              resizeMode="contain"
            />
            <Text
              style={{ color: "#4285F4", fontWeight: "bold", fontSize: 16 }}
            >
              Sign in with Google
            </Text>
          </TouchableOpacity>
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
        <Text style={{ color: "#888", fontSize: 13, textAlign: "center" }}>
          By continuing, you agree to our
          <Text
            style={{ color: "#6c63ff", fontWeight: "bold" }}
            onPress={() => navigation.navigate("Terms")}
          >
            {" "}
            Terms of Use
          </Text>{" "}
          and
          <Text
            style={{ color: "#6c63ff", fontWeight: "bold" }}
            onPress={() => navigation.navigate("Privacy")}
          >
            {" "}
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
};

function LoginScreen({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log("Starting Google Sign In...");

      // Use the correct scheme from app.json
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "too-doo-list",
        path: "auth/callback",
      });

      console.log("Using redirect URL:", redirectUrl);

      // Start the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        console.error("OAuth error:", error);
        throw error;
      }

      // Open the URL in the browser
      if (data?.url) {
        console.log("Opening auth URL in browser:", data.url);
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log("Auth session completed with type:", result.type);

        if (result.type === "success") {
          console.log("Auth URL:", result.url);
          // The URL will be handled by the deep link listener in supabaseClient.js
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));

          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          console.log(
            "Extracted tokens - accessToken:",
            !!accessToken,
            "refreshToken:",
            !!refreshToken
          );

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) {
              console.error("Session error:", sessionError);
              throw sessionError;
            }

            console.log("Session data:", sessionData);

            // Navigate to main app if successful
            if (sessionData?.session) {
              console.log("Navigation to Main screen");
              navigation.navigate("Main");
            } else {
              console.log("No session data available");
            }
          } else {
            console.log("Missing tokens in URL");
          }
        } else if (result.type === "cancel") {
          console.log("User cancelled the sign in");
          Alert.alert("Cancelled", "Sign in was cancelled");
        } else {
          console.log("Auth session result type:", result.type);
        }
      } else {
        console.log("No URL returned from OAuth");
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
      Alert.alert("Error", error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 36,
          left: 16,
          flexDirection: "row",
          alignItems: "center",
          padding: 8,
          zIndex: 10,
        }}
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <MaterialIcons name="arrow-back" size={28} color="#6c63ff" />
        <Text style={{ color: "#6c63ff", fontSize: 18, marginLeft: 4 }}>
          Back
        </Text>
      </TouchableOpacity>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#6c63ff",
            marginBottom: 32,
          }}
        >
          Login
        </Text>
        <View style={{ width: 260 }}>
          <Text
            style={{
              marginBottom: 4,
              color: "#3d3d4e",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Email
          </Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={{
              borderWidth: 1,
              borderColor: "#bbb",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 16,
              backgroundColor: "#fafafa",
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text
            style={{
              marginBottom: 4,
              color: "#3d3d4e",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Password
          </Text>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              borderColor: "#bbb",
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              fontSize: 16,
              backgroundColor: "#fafafa",
            }}
            secureTextEntry
          />
          <TouchableOpacity
            style={{
              backgroundColor: "#6c63ff",
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: "center",
              marginBottom: 12,
            }}
            onPress={() => {
              /* TODO: Implement email login logic */
            }}
            disabled={loading}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
              {loading ? "Loading..." : "Login with Email"}
            </Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 16,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
            <Text style={{ marginHorizontal: 12, color: "#888" }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
          </View>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              paddingVertical: 14,
              marginBottom: 16,
            }}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Image
              source={{ uri: "https://www.google.com/favicon.ico" }}
              style={{ width: 20, height: 20, marginRight: 12 }}
            />
            <Text style={{ color: "#444", fontWeight: "600", fontSize: 16 }}>
              {loading ? "Signing in..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>
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
        <Text style={{ color: "#888", fontSize: 13, textAlign: "center" }}>
          By continuing, you agree to our
          <Text
            style={{ color: "#6c63ff", fontWeight: "bold" }}
            onPress={() => navigation.navigate("Terms")}
          >
            {" "}
            Terms of Use
          </Text>{" "}
          and
          <Text
            style={{ color: "#6c63ff", fontWeight: "bold" }}
            onPress={() => navigation.navigate("Privacy")}
          >
            {" "}
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
}

function SignupScreen({ navigation }) {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 36,
          left: 16,
          flexDirection: "row",
          alignItems: "center",
          padding: 8,
          zIndex: 10,
        }}
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <MaterialIcons name="arrow-back" size={28} color="#6c63ff" />
        <Text style={{ color: "#6c63ff", fontSize: 18, marginLeft: 4 }}>
          Back
        </Text>
      </TouchableOpacity>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#6c63ff",
            marginBottom: 32,
          }}
        >
          Sign Up
        </Text>
        <View style={{ width: 260 }}>
          <Text
            style={{
              marginBottom: 4,
              color: "#3d3d4e",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Username
          </Text>
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={{
              borderWidth: 1,
              borderColor: "#bbb",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 16,
              backgroundColor: "#fafafa",
            }}
            autoCapitalize="none"
          />
          <Text
            style={{
              marginBottom: 4,
              color: "#3d3d4e",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Email
          </Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={{
              borderWidth: 1,
              borderColor: "#bbb",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 16,
              backgroundColor: "#fafafa",
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text
            style={{
              marginBottom: 4,
              color: "#3d3d4e",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Password
          </Text>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              borderColor: "#bbb",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 16,
              backgroundColor: "#fafafa",
            }}
            secureTextEntry
          />
          <Text
            style={{
              marginBottom: 4,
              color: "#3d3d4e",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Confirm Password
          </Text>
          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={{
              borderWidth: 1,
              borderColor: "#bbb",
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              fontSize: 16,
              backgroundColor: "#fafafa",
            }}
            secureTextEntry
          />
          <TouchableOpacity
            style={{
              backgroundColor: "#6c63ff",
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: "center",
              marginBottom: 12,
            }}
            onPress={() => {
              /* TODO: Implement signup logic */
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
              Sign Up
            </Text>
          </TouchableOpacity>
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
        <Text style={{ color: "#888", fontSize: 13, textAlign: "center" }}>
          By continuing, you agree to our
          <Text
            style={{ color: "#6c63ff", fontWeight: "bold" }}
            onPress={() => navigation.navigate("Terms")}
          >
            {" "}
            Terms of Use
          </Text>{" "}
          and
          <Text
            style={{ color: "#6c63ff", fontWeight: "bold" }}
            onPress={() => navigation.navigate("Privacy")}
          >
            {" "}
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
}

function TermsScreen() {
  const { t } = useContext(LanguageContext);
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "rgb(247, 247, 250)" }}>
      {/* Custom Header with Back Chevron */}
      <View
        style={{
          backgroundColor: "rgb(247, 247, 250)",
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
              stroke="#222"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Line
              x1={4}
              y1={14}
              x2={12}
              y2={22}
              stroke="#222"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            color: "#222",
            fontWeight: "bold",
            letterSpacing: 0.5,
            textAlign: "left",
            marginLeft: 4,
          }}
        >
          {t.terms}
        </Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* Simple Hourglass Illustration */}
        <Svg width={56} height={56} style={{ marginBottom: 12 }}>
          <Rect x={18} y={10} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Rect x={18} y={42} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Path
            d="M20 14 Q28 28 20 42"
            stroke="#B0B0B0"
            strokeWidth={2}
            fill="none"
          />
          <Path
            d="M36 14 Q28 28 36 42"
            stroke="#B0B0B0"
            strokeWidth={2}
            fill="none"
          />
          <Ellipse cx={28} cy={28} rx={5} ry={3} fill="#FFD580" />
          <Rect x={26} y={28} width={4} height={10} rx={2} fill="#FFD580" />
        </Svg>
        <ScrollView
          style={{ paddingHorizontal: 24 }}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text
            style={{
              fontSize: 18,
              color: "#444",
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            Terms of Use
          </Text>
          <Text style={{ fontSize: 15, color: "#444", marginBottom: 10 }}>
            Welcome to Too-Doo List. By using this application, you agree to the
            following terms and conditions:
          </Text>
          <Text style={{ fontSize: 15, color: "#444", marginBottom: 10 }}>
            1. You are responsible for maintaining the confidentiality of your
            device and any information stored within the app.{"\n"}
            2. All content you create or manage within the app remains your
            responsibility.{"\n"}
            3. The app is provided "as is" without warranties of any kind,
            either express or implied.{"\n"}
            4. We are not liable for any loss of data, productivity, or other
            damages arising from the use of this app.{"\n"}
            5. You agree not to use the app for any unlawful or prohibited
            activities.
          </Text>
          <Text style={{ fontSize: 14, color: "#888", marginTop: 12 }}>
            For questions regarding these terms, please contact support.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function PrivacyScreen() {
  const { t } = useContext(LanguageContext);
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "rgb(247, 247, 250)" }}>
      {/* Custom Header with Back Chevron */}
      <View
        style={{
          backgroundColor: "rgb(247, 247, 250)",
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
              stroke="#222"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Line
              x1={4}
              y1={14}
              x2={12}
              y2={22}
              stroke="#222"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            color: "#222",
            fontWeight: "bold",
            letterSpacing: 0.5,
            textAlign: "left",
            marginLeft: 4,
          }}
        >
          {t.privacy}
        </Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* Simple Hourglass Illustration */}
        <Svg width={56} height={56} style={{ marginBottom: 12 }}>
          <Rect x={18} y={10} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Rect x={18} y={42} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Path
            d="M20 14 Q28 28 20 42"
            stroke="#B0B0B0"
            strokeWidth={2}
            fill="none"
          />
          <Path
            d="M36 14 Q28 28 36 42"
            stroke="#B0B0B0"
            strokeWidth={2}
            fill="none"
          />
          <Ellipse cx={28} cy={28} rx={5} ry={3} fill="#FFD580" />
          <Rect x={26} y={28} width={4} height={10} rx={2} fill="#FFD580" />
        </Svg>
        <ScrollView
          style={{ paddingHorizontal: 24 }}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text
            style={{
              fontSize: 18,
              color: "#444",
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            Privacy Policy
          </Text>
          <Text style={{ fontSize: 15, color: "#444", marginBottom: 10 }}>
            Your privacy is important to us. This policy explains how
            information is handled in Too-Doo List:
          </Text>
          <Text style={{ fontSize: 15, color: "#444", marginBottom: 10 }}>
            1. All data you enter is stored locally on your device and is not
            transmitted to any external server.{"\n"}
            2. We do not collect, access, or share your personal information.
            {"\n"}
            3. You are responsible for managing and securing your own data on
            your device.{"\n"}
            4. The app does not use third-party analytics or advertising
            services.
          </Text>
          <Text style={{ fontSize: 14, color: "#888", marginTop: 12 }}>
            If you have questions about this policy, please contact support.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SettingScreen() {
  const { language, setLanguage, t } = useContext(LanguageContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");
  const [userName, setUserName] = useState("Anonymous");
  const navigation = useNavigation();

  useEffect(() => {
    const getName = async () => {
      try {
        const userProfile = await UserService.getUserProfile();
        if (userProfile) {
          setUserName(userProfile.name);
        } else {
          setUserName("Anonymous");
        }
      } catch (error) {
        console.error("Error retrieving user name:", error);
        setUserName("Anonymous");
      }
    };
    getName();
  }, []);

  const openModal = (text) => {
    setModalText(text);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "rgb(247, 247, 250)" }}>
      <View
        style={{
          backgroundColor: "rgb(247, 247, 250)",
          height: 64,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 22,
            color: "#222",
            fontWeight: "bold",
            letterSpacing: 0.5,
            textAlign: "left",
            paddingLeft: 24,
          }}
        >
          {t.settings}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 0,
          backgroundColor: "rgb(247, 247, 250)",
        }}
      >
        {/* Account Section Title */}
        <Text
          style={{
            color: "#666",
            fontSize: 15,
            fontWeight: "bold",
            marginLeft: 28,
            marginTop: 18,
            marginBottom: 2,
            letterSpacing: 0.5,
          }}
        >
          {t.account}
        </Text>
        {/* Account Info Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ color: "#222", fontSize: 16, marginBottom: 10 }}>
            {t.userName}
          </Text>
          <Text style={{ color: "#666", fontSize: 15, marginBottom: 0 }}>
            {userName}
          </Text>
        </View>
        {/* General Section Title */}
        <Text
          style={{
            color: "#666",
            fontSize: 15,
            fontWeight: "bold",
            marginLeft: 28,
            marginTop: 18,
            marginBottom: 2,
            letterSpacing: 0.5,
          }}
        >
          {t.general}
        </Text>
        {/* Language selection block */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ color: "#222", fontSize: 16, marginBottom: 10 }}>
            {t.language}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={{
                backgroundColor: language === "en" ? "#222" : "#eee",
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 8,
                marginRight: 10,
                borderWidth: language === "en" ? 0 : 1,
                borderColor: "#ddd",
              }}
              onPress={() => setLanguage("en")}
            >
              <Text
                style={{
                  color: language === "en" ? "#fff" : "#222",
                  fontWeight: "bold",
                }}
              >
                {t.english}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: language === "zh" ? "#222" : "#eee",
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 8,
                borderWidth: language === "zh" ? 0 : 1,
                borderColor: "#ddd",
              }}
              onPress={() => setLanguage("zh")}
            >
              <Text
                style={{
                  color: language === "zh" ? "#fff" : "#222",
                  fontWeight: "bold",
                }}
              >
                {t.chinese}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Legal Section Title */}
        <Text
          style={{
            color: "#666",
            fontSize: 15,
            fontWeight: "bold",
            marginLeft: 28,
            marginTop: 18,
            marginBottom: 2,
            letterSpacing: 0.5,
          }}
        >
          {t.legal}
        </Text>
        {/* Links */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.03,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("Terms")}
            activeOpacity={0.6}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{ color: "#222", fontSize: 16 }}>{t.terms}</Text>
            <Svg width={12} height={18} style={{ marginLeft: 6 }}>
              <Line
                x1={3}
                y1={4}
                x2={9}
                y2={9}
                stroke="#bbb"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Line
                x1={9}
                y1={9}
                x2={3}
                y2={14}
                stroke="#bbb"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
          <View
            style={{ height: 1, backgroundColor: "#ececec", marginLeft: 20 }}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate("Privacy")}
            activeOpacity={0.6}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{ color: "#222", fontSize: 16 }}>{t.privacy}</Text>
            <Svg width={12} height={18} style={{ marginLeft: 6 }}>
              <Line
                x1={3}
                y1={4}
                x2={9}
                y2={9}
                stroke="#bbb"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Line
                x1={9}
                y1={9}
                x2={3}
                y2={14}
                stroke="#bbb"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.2)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 32,
              borderRadius: 12,
              minWidth: 220,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, color: "#333", marginBottom: 16 }}>
              {modalText}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: 8,
                paddingVertical: 6,
                paddingHorizontal: 18,
                backgroundColor: "#111",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16 }}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <View
        style={{
          alignItems: "center",
          marginBottom: 18,
          backgroundColor: "rgb(247, 247, 250)",
          paddingVertical: 8,
        }}
      >
        <TouchableOpacity
          onPress={async () => {
            try {
              // Check if we're already on Splash screen
              if (navigation.canGoBack()) {
                // Close any modals first
                setModalVisible(false);
                // Go back to main tabs
                navigation.goBack();
                // Wait a bit before showing the modal
                setTimeout(() => setModalVisible(true), 100);
              }

              console.log("Attempting to sign out...");

              // Check if we have a valid session
              const {
                data: { session },
              } = await supabase.auth.getSession();
              console.log("Current session:", session);

              if (!session) {
                setModalText(
                  t.alreadySignedOut || "You are already signed out."
                );
                setModalVisible(true);
                return;
              }

              // Try to sign out
              const { error } = await supabase.auth.signOut();

              if (error) {
                console.error("Sign out error:", error);
                throw error;
              }

              console.log("Successfully signed out");

              // Clear session data from AsyncStorage
              await AsyncStorage.multiRemove(["loginType", "session"]);

              // Reset navigation
              console.log("Resetting navigation...");
              const resetAction = StackActions.replace("Splash");
              navigation.dispatch(resetAction);

              // Show success message
              setModalText(t.signOutSuccess || "Successfully signed out!");
              setModalVisible(true);

              // Force a re-render of the app
              console.log("Forcing re-render...");
              setModalVisible(false);
              setTimeout(() => setModalVisible(true), 100);
            } catch (error) {
              console.error("Error signing out:", error);
              console.error("Error details:", {
                message: error?.message,
                name: error?.name,
                code: error?.code,
                stack: error?.stack,
              });

              // Show detailed error message
              const errorMessage =
                error?.message || "Failed to sign out. Please try again.";
              setModalText(t.signOutError || errorMessage);
              setModalVisible(true);
            }
          }}
          style={{
            backgroundColor: "#fff",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#e0e0e0",
            marginBottom: 16,
            width: "80%",
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <Text style={{ color: "#e74c3c", fontSize: 16, fontWeight: "600" }}>
            {t.signOut || "Sign Out"}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: "#aaa", fontSize: 14 }}>{t.version} 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

function CalendarScreen({ navigation, route }) {
  const { language, t } = useContext(LanguageContext);
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [tasks, setTasks] = useState({});
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [modalVisible, setModalVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(getCurrentDate()).getMonth()
  );
  const [visibleYear, setVisibleYear] = useState(
    new Date(getCurrentDate()).getFullYear()
  );
  const [taskText, setTaskText] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempHour, setTempHour] = useState("00");
  const [tempMinute, setTempMinute] = useState("00");
  const scrollViewRef = useRef(null);

  // Load tasks from Supabase
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasksData = await TaskService.getTasks();
        setTasks(tasksData);
      } catch (error) {
        console.error("Error loading tasks:", error);
        // Fallback to empty tasks if there's an error
        setTasks({});
      }
    };

    loadTasks();
  }, []);

  // Note: We no longer need to save tasks to AsyncStorage
  // Tasks are automatically saved to Supabase when modified

  useEffect(() => {
    const today = getToday();
    setSelectedDate(today);
    const timer = setTimeout(centerToday, 500);
    return () => clearTimeout(timer);
  }, []);

  const centerToday = () => {
    if (!scrollViewRef.current) return;
    const todayDate = new Date(getToday());
    todayDate.setHours(12, 0, 0, 0);
    const firstDayOfMonth = new Date(visibleYear, visibleMonth, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const firstSunday = new Date(firstDayOfMonth);
    firstSunday.setDate(firstDayOfMonth.getDate() - firstDayOfWeek);
    const diffInDays = Math.floor(
      (todayDate - firstSunday) / (1000 * 60 * 60 * 24)
    );
    const weekNumber = Math.floor(diffInDays / 7);
    const weekHeight = 50;
    const visibleWeeks = 4;
    const scrollPosition =
      weekNumber * weekHeight - (visibleWeeks / 2) * weekHeight;
    scrollViewRef.current.scrollTo({
      y: scrollPosition,
      animated: true,
    });
  };

  const openAddTask = (date) => {
    setEditingTask(null);
    setTaskText("");
    setTaskTime("");
    setSelectedDate(date);
    setModalVisible(true);
  };

  const openEditTask = (task) => {
    console.log("Open edit task:", task);
    setEditingTask(task);
    setTaskText(task.text);
    setTaskTime(task.time || "");
    setSelectedDate(task.date);
    setModalVisible(true);
  };

  const saveTask = async () => {
    if (taskText.trim() === "") return;

    try {
      let newTask;
      let dayTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];

      if (editingTask) {
        // Update existing task
        await TaskService.updateTask(editingTask.id, {
          text: taskText,
          time: taskTime,
          date: selectedDate,
        });

        dayTasks = dayTasks.map((t) =>
          t.id === editingTask.id
            ? { ...t, text: taskText, time: taskTime, date: selectedDate }
            : t
        );
      } else {
        // Create new task
        newTask = await TaskService.addTask({
          text: taskText,
          time: taskTime,
          date: selectedDate,
          checked: false,
        });

        dayTasks.push(newTask);
      }

      setTasks({ ...tasks, [selectedDate]: dayTasks });
      setModalVisible(false);
      setEditingTask(null);
      setTaskText("");
      setTaskTime("");
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to save task. Please try again.");
    }
  };

  const deleteTask = async (task) => {
    if (!task) return;

    try {
      await TaskService.deleteTask(task.id);

      // Update local state
      const day = task.date;
      const dayTasks = tasks[day] ? [...tasks[day]] : [];
      const filteredTasks = dayTasks.filter((t) => t.id !== task.id);
      const newTasks = { ...tasks, [day]: filteredTasks };
      setTasks(newTasks);

      setModalVisible(false);
      setEditingTask(null);
      setTaskText("");
      setTaskTime("");
      console.log("Deleted task", task.id);
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task. Please try again.");
    }
  };

  const startMoveTask = (task) => {
    setMoveMode(true);
    setTaskToMove(task);
    Alert.alert(t.moveTask, t.moveTaskAlert);
  };

  const moveTaskToDate = (task, toDate) => {
    if (task.date === toDate) return;
    if (task.date !== selectedDate) return;
    const fromTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];
    const toTasks = tasks[toDate] ? [...tasks[toDate]] : [];
    const filteredTasks = fromTasks.filter((t) => t.id !== task.id);
    toTasks.push({ ...task });
    setTasks({ ...tasks, [selectedDate]: filteredTasks, [toDate]: toTasks });
    setMoveMode(false);
    setTaskToMove(null);
  };

  const renderCalendar = () => {
    const weeks = []; // For calendar rendering
    const currentDate = new Date(visibleYear, visibleMonth, 1);

    // Get the first day of the month and the last day of the month
    const firstDayOfMonth = new Date(visibleYear, visibleMonth, 1);
    const lastDayOfMonth = new Date(visibleYear, visibleMonth + 1, 0);

    // Find the first Sunday on or before the first day of the month
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const firstSunday = new Date(firstDayOfMonth);
    firstSunday.setDate(firstDayOfMonth.getDate() - firstDayOfWeek);

    // We want exactly 5 weeks (35 days)
    for (let week = 0; week < 5; week++) {
      const weekDates = [];

      // Generate all 7 days of the week
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(firstSunday);
        dayDate.setDate(firstSunday.getDate() + week * 7 + day);
        dayDate.setHours(12, 0, 0, 0);

        const dateStr = dayDate.toISOString().split("T")[0];
        weekDates.push(renderDate(dateStr));
      }

      weeks.push(
        <View key={`week-${week}`} style={styles.calendarWeekRow}>
          {weekDates}
        </View>
      );
    }

    return (
      <PanGestureHandler onHandlerStateChange={handleVerticalGesture}>
        <View>{weeks}</View>
      </PanGestureHandler>
    );
  };

  const renderDate = (date) => {
    const isSelected = date === selectedDate;
    const dateObj = new Date(date);

    const isCurrentMonth =
      dateObj.getMonth() === visibleMonth &&
      dateObj.getFullYear() === visibleYear;

    // Format the current date to match the date string format (YYYY-MM-DD)
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const isToday = date === todayFormatted;
    const isInRange = true; // Always show the date number

    const renderDateContent = () => {
      return (
        <View style={styles.dateContainer}>
          <View
            style={[
              styles.dateTextContainer,
              isToday && styles.todayCircle,
              isSelected && styles.selectedDate,
            ]}
          >
            <Text
              style={[
                styles.calendarDayText,
                !isCurrentMonth && styles.otherMonthText,
                isSelected && styles.selectedDayText,
                isToday && styles.todayText,
                !isInRange && styles.hiddenDate,
              ]}
            >
              {isInRange ? dateObj.getDate() : ""}
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
          styles.calendarDay,
          isSelected && styles.selectedDay,
          moveMode && styles.calendarDayMoveTarget,
        ]}
      >
        {renderDateContent()}
        {tasks[date]?.length > 0 && <View style={styles.taskDot} />}
      </TouchableOpacity>
    );
  };

  const toggleTaskChecked = async (task) => {
    try {
      await TaskService.toggleTaskChecked(task.id, !task.checked);

      // Update local state
      const dayTasks = tasks[task.date] ? [...tasks[task.date]] : [];
      const updatedTasks = dayTasks.map((t) =>
        t.id === task.id ? { ...t, checked: !t.checked } : t
      );
      setTasks({ ...tasks, [task.date]: updatedTasks });
    } catch (error) {
      console.error("Error toggling task:", error);
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
        {item.checked ? (
          <MaterialIcons name="check-box" size={24} color="#6c63ff" />
        ) : (
          <MaterialIcons
            name="check-box-outline-blank"
            size={24}
            color="#bbb"
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
            justifyContent: "space-between",
          },
        ]}
        onPress={() => openEditTask(item)}
        onLongPress={() => startMoveTask(item)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.taskText, item.checked && styles.taskTextChecked]}
          >
            {item.text}
          </Text>
        </View>
        {item.time && <Text style={styles.taskTimeRight}>{item.time}</Text>}
        {moveMode && taskToMove && taskToMove.id === item.id && (
          <Text style={styles.moveHint}>{t.moveHint}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Helper to get previous/next day in YYYY-MM-DD
  const getAdjacentDate = (dateStr, diff) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + diff);
    return date.toISOString().split("T")[0];
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
    console.log("RenderTaskArea dayTasks:", dayTasks);
    return (
      <PanGestureHandler
        onHandlerStateChange={handleTaskAreaGesture}
        activeOffsetY={[-20, 20]}
        activeOffsetX={[-50, 50]}
      >
        <View style={[styles.taskArea, { flex: 1 }]}>
          <View
            style={[styles.taskAreaContent, { flex: 1, overflow: "hidden" }]}
          >
            <View
              style={[
                styles.tasksHeaderRow,
                { paddingLeft: 0, paddingHorizontal: 0, marginLeft: 4 },
              ]}
            >
              <Text
                style={[
                  styles.tasksHeader,
                  { textAlign: "left", paddingLeft: 0, marginLeft: 4 },
                ]}
              >
                {selectedDate}
              </Text>
            </View>

            {/* Floating Add Button */}
            <TouchableOpacity
              style={styles.fabAddButton}
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

            {dayTasks.length === 0 ? (
              <View style={styles.noTaskContainer}>
                <Svg
                  width={64}
                  height={64}
                  viewBox="0 0 64 64"
                  style={{ marginBottom: 12 }}
                >
                  <Rect
                    x="10"
                    y="20"
                    width="44"
                    height="32"
                    rx="8"
                    fill="#eee"
                  />
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
                <Text style={styles.noTaskText}>{t.noTasks}</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <FlatList
                  data={dayTasks
                    .slice()
                    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))}
                  keyExtractor={(item) => item.id}
                  renderItem={renderTask}
                  contentContainerStyle={[
                    styles.tasksScrollContent,
                    { paddingBottom: 32 },
                  ]}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        </View>
      </PanGestureHandler>
    );
  };

  const renderModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setModalVisible(false)}
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingTask ? t.editTask : t.createTask}
            </Text>
          </View>
          <View style={{ marginBottom: 12 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity
                onPress={() => {
                  if (taskTime) {
                    const [hour, minute] = taskTime.split(":");
                    setTempHour(hour || "00");
                    setTempMinute(minute || "00");
                  } else {
                    const now = new Date();
                    setTempHour(now.getHours().toString().padStart(2, "0"));
                    setTempMinute(now.getMinutes().toString().padStart(2, "0"));
                  }
                  setTimePickerVisible(true);
                }}
                style={styles.timeInput}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeInputText,
                    taskTime && styles.timeInputTextFilled,
                  ]}
                >
                  {taskTime || "Select time"}
                </Text>
                <MaterialIcons name="access-time" size={20} color="#6c63ff" />
              </TouchableOpacity>
            </View>
            {timePickerVisible && (
              <Modal
                transparent={true}
                visible={timePickerVisible}
                onRequestClose={() => setTimePickerVisible(false)}
                animationType="slide"
              >
                <SafeAreaView style={styles.timePickerModal}>
                  <View style={styles.timePickerContent}>
                    <View
                      style={[
                        styles.timePickerHeader,
                        { alignItems: "center", borderBottomWidth: 0 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timePickerTitle,
                          {
                            fontSize: 20,
                            fontWeight: "700",
                            color: "#6c63ff",
                            letterSpacing: 1,
                          },
                        ]}
                      >
                        Select Time
                      </Text>
                    </View>
                    <View style={styles.timePickerBody}>
                      <View style={styles.timeWheelContainer}>
                        <View style={styles.timeWheel}>
                          <FlatList
                            data={Array.from({ length: 24 }, (_, i) =>
                              i.toString().padStart(2, "0")
                            )}
                            keyExtractor={(item) => `hour-${item}`}
                            style={{ height: 200, width: 80 }}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={40}
                            decelerationRate="fast"
                            initialScrollIndex={parseInt(tempHour) || 0}
                            getItemLayout={(_, index) => ({
                              length: 40,
                              offset: 40 * index,
                              index,
                            })}
                            contentContainerStyle={{
                              alignItems: "center",
                              paddingVertical: 80,
                            }}
                            onMomentumScrollEnd={({ nativeEvent }) => {
                              const index = Math.round(
                                nativeEvent.contentOffset.y / 40
                              );
                              setTempHour(index.toString().padStart(2, "0"));
                            }}
                            renderItem={({ item }) => (
                              <View
                                style={[
                                  styles.timeWheelItem,
                                  tempHour === item &&
                                    styles.timeWheelItemSelected,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.timeWheelText,
                                    tempHour === item &&
                                      styles.timeWheelTextSelected,
                                  ]}
                                >
                                  {item}
                                </Text>
                              </View>
                            )}
                          />
                          <View
                            style={styles.timeWheelHighlight}
                            pointerEvents="none"
                          />
                        </View>
                        <Text style={styles.timeSeparator}>:</Text>
                        <View style={styles.timeWheel}>
                          <FlatList
                            data={Array.from({ length: 60 }, (_, i) =>
                              i.toString().padStart(2, "0")
                            )}
                            keyExtractor={(item) => `min-${item}`}
                            style={{ height: 200, width: 80 }}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={40}
                            decelerationRate="fast"
                            initialScrollIndex={parseInt(tempMinute) || 0}
                            getItemLayout={(_, index) => ({
                              length: 40,
                              offset: 40 * index,
                              index,
                            })}
                            contentContainerStyle={{
                              alignItems: "center",
                              paddingVertical: 80,
                            }}
                            onMomentumScrollEnd={({ nativeEvent }) => {
                              const index = Math.round(
                                nativeEvent.contentOffset.y / 40
                              );
                              setTempMinute(index.toString().padStart(2, "0"));
                            }}
                            renderItem={({ item }) => (
                              <View
                                style={[
                                  styles.timeWheelItem,
                                  tempMinute === item &&
                                    styles.timeWheelItemSelected,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.timeWheelText,
                                    tempMinute === item &&
                                      styles.timeWheelTextSelected,
                                  ]}
                                >
                                  {item}
                                </Text>
                              </View>
                            )}
                          />
                          <View
                            style={styles.timeWheelHighlight}
                            pointerEvents="none"
                          />
                        </View>
                      </View>
                      <View
                        style={[
                          styles.timePickerActions,
                          { justifyContent: "center" },
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            styles.doneButton,
                            {
                              minWidth: 100,
                              borderRadius: 20,
                              backgroundColor: "#6c63ff",
                              alignItems: "center",
                            },
                          ]}
                          onPress={() => {
                            setTaskTime(`${tempHour}:${tempMinute}`);
                            setTimePickerVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.doneButtonText,
                              {
                                color: "#fff",
                                fontWeight: "700",
                                fontSize: 16,
                              },
                            ]}
                          >
                            Done
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </SafeAreaView>
              </Modal>
            )}
            <Text style={{ fontSize: 15, fontWeight: "600", marginBottom: 4 }}>
              Task
            </Text>
            <TextInput
              style={styles.input}
              value={taskText}
              onChangeText={setTaskText}
              placeholder={t.addTask}
              placeholderTextColor="#888"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.saveButton, { marginRight: 4 }]}
                onPress={saveTask}
              >
                <Text style={styles.saveButtonText}>{t.save}</Text>
              </TouchableOpacity>
              {editingTask && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTask(editingTask)}
                >
                  <Text style={styles.deleteButtonText}>{t.delete}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Calendar navigation functions
  // Handles vertical swipe gestures for month navigation
  const handleVerticalGesture = ({ nativeEvent }) => {
    const { translationY, state } = nativeEvent;
    // Only trigger on gesture end (state === 5 for END in react-native-gesture-handler)
    if (state === 5) {
      if (translationY < -50) {
        goToNextMonth(); // Swipe up
      } else if (translationY > 50) {
        goToPrevMonth(); // Swipe down
      }
    }
  };

  const goToNextMonth = () => {
    let newMonth = visibleMonth + 1;
    let newYear = visibleYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setVisibleMonth(newMonth);
    setVisibleYear(newYear);
  };

  const goToPrevMonth = () => {
    let newMonth = visibleMonth - 1;
    let newYear = visibleYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setVisibleMonth(newMonth);
    setVisibleYear(newYear);
  };

  // Calendar header UI
  const monthNames = t.months;
  const header = (
    <View style={styles.fixedHeader}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Text style={styles.currentMonthTitle}>
          {visibleYear} {monthNames[visibleMonth]}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.calendarSection}>
          {header}
          <View style={styles.weekDaysHeader}>
            {t.weekDays.map((d, i) => (
              <Text key={i} style={styles.weekDayText}>
                {d}
              </Text>
            ))}
          </View>
          <View>
            <PanGestureHandler onHandlerStateChange={handleVerticalGesture}>
              <View>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.calendarScrollView}
                  contentContainerStyle={styles.scrollContent}
                >
                  {renderCalendar()}
                </ScrollView>
              </View>
            </PanGestureHandler>
          </View>
        </View>
        <View style={styles.taskAreaContainer}>{renderTaskArea()}</View>
        {renderModal()}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === "web") {
      const setTitle = () => {
        document.title = "Too Doo List";
      };
      setTitle();
      const observer = new MutationObserver(() => {
        if (document.title !== "Too Doo List") {
          document.title = "Too Doo List";
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
      document.title = "Too Doo List";
    }
  }, []);
  const [language, setLanguageState] = useState("en");
  const [loadingLang, setLoadingLang] = useState(true);

  useEffect(() => {
    // Set browser tab title
    if (typeof document !== "undefined") {
      document.title = "Too Doo List";
    }
    ReactGA.initialize("G-FDKFB5F7VX");
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.location
    ) {
      ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
    // Load language from Supabase user settings
    const loadLanguage = async () => {
      try {
        const userSettings = await UserService.getUserSettings();
        if (
          userSettings.language &&
          (userSettings.language === "en" || userSettings.language === "zh")
        ) {
          setLanguageState(userSettings.language);
        }
      } catch (error) {
        console.error("Error loading language settings:", error);
        // Fallback to AsyncStorage if Supabase fails
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((lang) => {
          if (lang && (lang === "en" || lang === "zh")) {
            setLanguageState(lang);
          }
        });
      } finally {
        setLoadingLang(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang) => {
    setLanguageState(lang);

    try {
      // Save to Supabase user settings
      await UserService.updateUserSettings({ language: lang });
    } catch (error) {
      console.error("Error saving language to Supabase:", error);
      // Fallback to AsyncStorage
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  };

  const t = translations[language] || translations.en;

  if (loadingLang) return null;

  function MainTabs() {
    React.useEffect(() => {
      if (typeof document !== "undefined") {
        setTimeout(() => {
          document.title = "Too Doo List";
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
            return (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name={iconName} size={size} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: "#111",
          tabBarInactiveTintColor: "#888",
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 60,
            paddingBottom: 4,
            paddingTop: 4,
            backgroundColor: "rgba(255,255,255,0.96)",
            borderTopWidth: 1,
            borderTopColor: "#eee",
          },
          tabBarIconStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
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
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <NavigationContainer
        onStateChange={() => {
          if (typeof document !== "undefined") {
            document.title = "Too Doo List";
          }
        }}
      >
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Splash"
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{
              headerShown: false,
              gestureEnabled: false,
              animationEnabled: false,
            }}
          />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen
            name="ComingSoon"
            component={require("./ComingSoonScreen").default}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageContext.Provider>
  );
}

// ...

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
    backgroundColor: "#fff",
  },
  calendarSection: {
    flexShrink: 0,
    backgroundColor: "#fff",
  },
  taskAreaContainer: {
    backgroundColor: "#f4f4f6",
    width: "100%",
    flex: 1,
    paddingBottom: 60, // Add padding equal to bottom bar height
  },
  taskArea: {
    flex: 1,
    backgroundColor: "#f7f7fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  currentMonthTitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "left",
    marginBottom: 10,
    marginLeft: 16,
    marginTop: 10,
  },
  weekDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#bbbbbb",
  },
  // Scroll container
  calendarDivider: {
    height: 1,
    backgroundColor: "#bbbbbb",
    marginBottom: 4,
  },
  calendarScrollView: {
    flexGrow: 0,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 0,
  },
  scrollSpacer: {
    height: 10,
  },
  // Month container
  monthContainer: {
    marginBottom: 0,
  },
  customCalendar: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    backgroundColor: "#fff",
    padding: 6,
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
    height: 50,
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
    backgroundColor: "#fff",
    zIndex: 1,
    minWidth: 40,
    maxWidth: 40,
    minHeight: 40,
    maxHeight: 40,
  },
  calendarDayContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dateContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  calendarDayText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  selectedDay: {
    backgroundColor: "#e8e7fc",
    zIndex: 3,
    elevation: 2,
    minWidth: 40,
    maxWidth: 40,
    minHeight: 40,
    maxHeight: 40,
  },
  selectedDayText: {
    color: "#6c63ff",
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
    bottom: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6c63ff",
  },
  todayCircle: {
    backgroundColor: "#6c63ff",
    width: 22,
    height: 22,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: {
    color: "white", // White for better contrast
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
  noTaskContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 48,
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
  taskText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 12,
    textDecorationLine: "none",
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
  timeInput: {
    height: 48,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  timeInputText: {
    fontSize: 16,
    color: "#888",
  },
  timeInputTextFilled: {
    color: "#222",
    fontWeight: "500",
  },
  taskTimeRight: {
    fontSize: 14,
    color: "#6c63ff",
    fontWeight: "600",
    marginLeft: 12,
    minWidth: 48,
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
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
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
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingHorizontal: 0,
    gap: 4, // Add gap if supported by React Native version
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
  },
  saveButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  modalCloseButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 20,
    padding: 6,
  },
  deleteButton: {
    backgroundColor: "#ff5a5f",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  taskContent: {
    flex: 1,
  },
});
