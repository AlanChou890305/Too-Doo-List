import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Platform,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Application from "expo-application";
import * as Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import Svg, { Path, Circle } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LanguageContext, ThemeContext, UserContext } from "../contexts";
import { supabase } from "../../supabaseClient";
import { UserService } from "../services/userService";
import { versionService } from "../services/versionService";
import { getUpdateUrl } from "../config/updateUrls";
import { mixpanelService } from "../services/mixpanelService";
import { dataPreloadService } from "../services/dataPreloadService";
import { cancelAllNotifications } from "../services/notificationService";
import AdBanner from "../components/AdBanner";

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
  const [feedbackTitle, setFeedbackTitle] = useState("");
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
        Alert.alert(t.error, t.failedToUpdateUserType);
      } else {
        alert(t.failedToUpdateUserType);
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
        const updateInfo = await versionService.checkForUpdates(false, language);
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
                            ? require("../../assets/apple-100(dark).png")
                            : require("../../assets/apple-90(light).png")
                        }
                        style={{ width: 18, height: 18, marginRight: 8 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Image
                        source={require("../../assets/google-logo.png")}
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
                  {themeMode === "light"
                    ? t.lightMode
                    : themeMode === "dark"
                    ? t.darkMode
                    : t.autoMode || "Auto"}
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
                {/* Auto (第一個選項 - 預設推薦) */}
                <TouchableOpacity
                  onPress={() => {
                    setThemeMode("auto");
                    setThemeDropdownVisible(false);
                  }}
                  activeOpacity={0.6}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 52,
                    backgroundColor:
                      themeMode === "auto"
                        ? theme.calendarSelected
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color:
                        themeMode === "auto"
                          ? theme.primary
                          : theme.textSecondary,
                      fontSize: 15,
                      fontWeight: themeMode === "auto" ? "600" : "400",
                    }}
                  >
                    {t.autoMode || "Auto (Follow System)"}
                  </Text>
                </TouchableOpacity>
                {/* Light Mode */}
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
                {/* Dark Mode */}
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
                // Note: iOS may silently refuse to show the dialog (rate limiting, recently rated, etc.)
                // So we always show our custom modal as fallback
                if (
                  Platform.OS === "ios" &&
                  StoreReview &&
                  StoreReview.isAvailableAsync
                ) {
                  try {
                    const isAvailable = await StoreReview.isAvailableAsync();
                    if (isAvailable) {
                      await StoreReview.requestReview();
                      // iOS may or may not show the native dialog (rate limiting)
                      // We always show our custom modal as user feedback
                    }
                  } catch (reviewError) {
                    console.warn(
                      "StoreReview not available:",
                      reviewError.message,
                    );
                  }
                }
                // Always show custom modal for consistent user feedback
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

                  {/* Title Field (Optional) */}
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 12,
                    }}
                  >
                    {t.feedbackTitle || "Title"}{" "}
                    <Text style={{ color: theme.textTertiary, fontWeight: "400" }}>
                      ({t.optional || "Optional"})
                    </Text>
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: theme.divider,
                      marginBottom: 20,
                    }}
                    placeholder={t.feedbackTitlePlaceholder || "Brief summary of your feedback"}
                    placeholderTextColor={theme.textTertiary}
                    value={feedbackTitle}
                    onChangeText={setFeedbackTitle}
                    maxLength={100}
                  />

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
                            title: feedbackTitle.trim() || null,
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
                              setFeedbackTitle("");
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

        {/* Legal & Support Section */}
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
            {t.legalAndSupport || "Legal & Support"}
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

            <View
              style={{
                height: 1,
                backgroundColor: theme.divider,
                marginHorizontal: 20,
              }}
            />

            {Platform.OS !== "web" && (
              <>
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



export default SettingScreen;
