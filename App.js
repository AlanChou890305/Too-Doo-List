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
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";

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
import {
  registerForPushNotificationsAsync,
  scheduleTaskNotification,
  cancelTaskNotification,
} from "./src/services/notificationService";

// Notification Config
import { getActiveReminderMinutes } from "./src/config/notificationConfig";

// Theme Config
import { getTheme, lightTheme, darkTheme } from "./src/config/theme";

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
import { MaterialIcons } from "@expo/vector-icons";
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

// Translation dictionaries
const translations = {
  en: {
    settings: "Settings",
    userName: "User Name",
    account: "Account",
    logout: "Log Out",
    comingSoon: "Coming soon...",
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    version: "Version",
    general: "General",
    legal: "Legal",
    calendar: "Calendar",
    noTasks: "No tasks for this day.",
    addTask: "What needs to be done?",
    createTask: "Create Task",
    editTask: "Edit Task",
    taskPlaceholder: "Enter your task here...",
    timePlaceholder: "Enter time (HH:MM)",
    link: "Link",
    linkPlaceholder: "Add a link",
    taskLabel: "Task",
    date: "Date",
    datePlaceholder: "Enter date (YYYY-MM-DD)",
    note: "Note",
    notePlaceholder: "Add a note",
    save: "Save",
    update: "Update",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    logoutConfirm: "Are you sure you want to log out of the app?",
    logout: "Log Out",
    deleteConfirm: "Are you sure you want to delete this task?",
    done: "Done",
    moveHint: "Tap a date to move",
    moveTask: "Move Task",
    moveTaskAlert: "Now tap a date on the calendar to move this task.",
    language: "Language",
    languageDescription: "Choose your preferred language for the app interface",
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
    logoutSuccess: "Successfully logged out!",
    alreadyLoggedOut: "You are already logged out.",
    logoutError: "Failed to log out. Please try again.",
    accountType: "Account Type",
    // Terms of Use translations
    termsTitle: "Terms of Use",
    termsLastUpdated: "Last updated:",
    termsAcceptance: "1. Acceptance of Terms",
    termsAcceptanceText:
      'By accessing and using To Do ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
    termsDescription: "2. Description of Service",
    termsDescriptionText:
      "To Do is a task management application that allows users to create, organize, and manage their daily tasks and schedules. The app provides calendar integration, Google Single Sign-On authentication, and task organization features.",
    termsAccounts: "3. User Accounts and Authentication",
    termsAccountsText:
      "• You may create an account using Google Single Sign-On (SSO)\n• You are responsible for maintaining the confidentiality of your account\n• You agree to provide accurate and complete information\n• You are responsible for all activities that occur under your account",
    termsContent: "4. User Content and Data",
    termsContentText:
      "• You retain ownership of all content you create within the app\n• You are solely responsible for your content and data\n• We do not claim ownership of your personal tasks or information\n• You grant us necessary permissions to provide the service",
    termsAcceptableUse: "5. Acceptable Use",
    termsAcceptableUseText:
      "You agree not to:\n• Use the app for any unlawful purpose or in violation of any laws\n• Attempt to gain unauthorized access to the app or its systems\n• Interfere with or disrupt the app's functionality\n• Create content that is harmful, offensive, or violates others' rights",
    termsPrivacy: "6. Privacy and Data Protection",
    termsPrivacyText:
      "Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using the app, you consent to the collection and use of information as described in our Privacy Policy.",
    termsAvailability: "7. Service Availability",
    termsAvailabilityText:
      "• We strive to maintain high service availability but cannot guarantee uninterrupted access\n• We may perform maintenance that temporarily affects service\n• We reserve the right to modify or discontinue the service at any time",
    termsLiability: "8. Limitation of Liability",
    termsLiabilityText:
      'The app is provided "as is" without warranties of any kind. We shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the app.',
    termsChanges: "9. Changes to Terms",
    termsChangesText:
      "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the app constitutes acceptance of the modified terms.",
    termsContact: "10. Contact Information",
    termsContactText:
      "If you have any questions about these Terms of Use, please contact us through the app's support channels.",
    termsAcknowledgment:
      "By using To Do, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.",
    // Privacy Policy translations
    privacyTitle: "Privacy Policy",
    privacyLastUpdated: "Last updated:",
    privacyIntroduction: "1. Introduction",
    privacyIntroductionText:
      'To Do ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our task management application.',
    privacyInformation: "2. Information We Collect",
    privacyAccountInfo: "Account Information:",
    privacyAccountInfoText:
      "• Email address (via Google SSO)\n• Display name\n• Profile picture (if provided by Google)\n\nTask Data:\n• Task titles, descriptions, and content\n• Due dates and times\n• Task categories and priorities\n• Links and attachments\n\nUsage Data:\n• App usage patterns and preferences\n• Device information and settings",
    privacyUse: "3. How We Use Your Information",
    privacyUseText:
      "We use your information to:\n• Provide and maintain the app's functionality\n• Sync your tasks across devices\n• Improve our services and user experience\n• Provide customer support\n• Ensure security and prevent fraud",
    privacyStorage: "4. Data Storage and Security",
    privacyStorageText:
      "• Your data is stored securely using Supabase cloud infrastructure\n• We implement industry-standard security measures\n• Data is encrypted in transit and at rest\n• Access to your data is restricted to authorized personnel only\n• We regularly review and update our security practices",
    privacySharing: "5. Data Sharing and Disclosure",
    privacySharingText:
      "We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:\n• With your explicit consent\n• To comply with legal obligations\n• To protect our rights and prevent fraud\n• With service providers who assist in app operations (under strict confidentiality agreements)",
    privacyThirdParty: "6. Third-Party Services",
    privacyThirdPartyText:
      "Our app integrates with:\n• Google: For authentication via Google SSO\n• Supabase: For secure data storage and backend services\n\nThese services have their own privacy policies, which we encourage you to review.",
    privacyRights: "7. Your Rights and Choices",
    privacyRightsText:
      "You have the right to:\n• Access your personal data\n• Correct inaccurate information\n• Delete your account and associated data\n• Export your task data\n• Opt out of certain data processing activities\n• Withdraw consent at any time",
    privacyRetention: "8. Data Retention",
    privacyRetentionText:
      "• We retain your data for as long as your account is active\n• You can delete your account at any time through the app settings\n• Some data may be retained for legal or security purposes\n• Deleted data is permanently removed from our systems",
    privacyChildren: "9. Children's Privacy",
    privacyChildrenText:
      "Our app is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.",
    privacyInternational: "10. International Data Transfers",
    privacyInternationalText:
      "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.",
    privacyChanges: "11. Changes to This Policy",
    privacyChangesText:
      'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app and updating the "Last updated" date. Your continued use of the app after such changes constitutes acceptance of the updated policy.',
    privacyContact: "12. Contact Us",
    privacyContactText:
      "If you have any questions about this Privacy Policy or our data practices, please contact us through the app's support channels or email us at privacy@todo-app.com.",
    privacyAcknowledgment:
      "By using To Do, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and disclosure of your information as described herein.",
    googleAccount: "Google Account",
    logout: "Log Out",
    selectTime: "Select Time",
    hour: "Hour",
    minute: "Min",
    done: "Done",
    time: "Time",
    today: "Today",
    taskReminder: "Task Reminder",
    notificationPermission: "Notification Permission",
    notificationPermissionMessage:
      "To Do needs notification permission to remind you about your tasks 30 minutes before they're due.",
    enableNotifications: "Enable Notifications",
    notLater: "Not Now",
    theme: "Theme",
    themeDescription: "Choose between light and dark appearance",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    appearance: "Appearance",
    byContinuing: "By continuing, you agree to our",
    and: "and",
    // Reminder settings
    reminderSettings: "Reminder Settings",
    reminderSettingsDescription:
      "Choose when to receive notifications before your scheduled tasks",
    reminder30min: "30 minutes before",
    reminder10min: "10 minutes before",
    reminder5min: "5 minutes before",
    reminderEnabled: "Enable reminders",
    reminderDisabled: "Reminders disabled",
    reminderNote:
      "Reminders will only be sent for tasks that have a scheduled time",
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
    addTask: "需要做什麼？",
    createTask: "新增任務",
    editTask: "編輯任務",
    taskPlaceholder: "在這裡輸入您的任務...",
    timePlaceholder: "輸入時間 (HH:MM)",
    link: "連結",
    linkPlaceholder: "添加連結",
    taskLabel: "任務",
    date: "日期",
    datePlaceholder: "輸入日期 (YYYY-MM-DD)",
    note: "備註",
    notePlaceholder: "添加備註",
    save: "儲存",
    update: "更新",
    cancel: "取消",
    confirm: "確認",
    delete: "刪除",
    logoutConfirm: "您確定要登出應用程式嗎？",
    logout: "登出",
    deleteConfirm: "您確定要刪除這個任務嗎？",
    done: "完成",
    moveHint: "點選日期以移動",
    moveTask: "移動任務",
    moveTaskAlert: "請點選日曆上的日期以移動此任務。",
    language: "語言",
    languageDescription: "選擇您偏好的應用程式介面語言",
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
    logoutSuccess: "成功登出！",
    alreadyLoggedOut: "您已經登出。",
    logoutError: "登出失敗。請再試一次。",
    accountType: "帳號類型",
    // Terms of Use translations
    termsTitle: "使用條款",
    termsLastUpdated: "最後更新：",
    termsAcceptance: "1. 條款接受",
    termsAcceptanceText:
      "通過訪問和使用 To Do（「應用程式」），您接受並同意受本協議條款的約束。如果您不同意遵守上述條款，請勿使用此服務。",
    termsDescription: "2. 服務描述",
    termsDescriptionText:
      "To Do 是一個任務管理應用程式，允許用戶創建、組織和管理日常任務和日程安排。該應用程式提供日曆整合、Google 單一登入認證和任務組織功能。",
    termsAccounts: "3. 用戶帳號和認證",
    termsAccountsText:
      "• 您可以使用 Google 單一登入（SSO）創建帳號\n• 您有責任維護帳號的機密性\n• 您同意提供準確和完整的信息\n• 您對帳號下發生的所有活動負責",
    termsContent: "4. 用戶內容和數據",
    termsContentText:
      "• 您保留在應用程式中創建的所有內容的所有權\n• 您對自己的內容和數據負全責\n• 我們不聲稱擁有您的個人任務或信息的所有權\n• 您授予我們提供服務所需的必要權限",
    termsAcceptableUse: "5. 可接受的使用",
    termsAcceptableUseText:
      "您同意不：\n• 將應用程式用於任何非法目的或違反任何法律\n• 嘗試未經授權訪問應用程式或其系統\n• 干擾或破壞應用程式的功能\n• 創建有害、冒犯性或侵犯他人權利的內容",
    termsPrivacy: "6. 隱私和數據保護",
    termsPrivacyText:
      "您的隱私對我們很重要。請查看我們的隱私政策，了解我們如何收集、使用和保護您的信息。通過使用應用程式，您同意按照我們隱私政策中描述的方式收集和使用信息。",
    termsAvailability: "7. 服務可用性",
    termsAvailabilityText:
      "• 我們努力維持高服務可用性，但無法保證不間斷的訪問\n• 我們可能會進行暫時影響服務的維護\n• 我們保留隨時修改或終止服務的權利",
    termsLiability: "8. 責任限制",
    termsLiabilityText:
      "應用程式按「現狀」提供，不提供任何形式的保證。對於因使用或無法使用應用程式而導致的任何直接、間接、偶然、特殊或後果性損害，我們不承擔責任。",
    termsChanges: "9. 條款變更",
    termsChangesText:
      "我們保留隨時修改這些條款的權利。變更將在發布後立即生效。您繼續使用應用程式即表示接受修改後的條款。",
    termsContact: "10. 聯繫信息",
    termsContactText:
      "如果您對這些使用條款有任何疑問，請通過應用程式的支持渠道聯繫我們。",
    termsAcknowledgment:
      "通過使用 To Do，您確認已閱讀、理解並同意受這些使用條款的約束。",
    // Privacy Policy translations
    privacyTitle: "隱私政策",
    privacyLastUpdated: "最後更新：",
    privacyIntroduction: "1. 介紹",
    privacyIntroductionText:
      "To Do（「我們」、「我們的」或「我們」）致力於保護您的隱私。本隱私政策解釋了我們在您使用我們的任務管理應用程式時如何收集、使用、披露和保護您的信息。",
    privacyInformation: "2. 我們收集的信息",
    privacyAccountInfo: "帳號信息：",
    privacyAccountInfoText:
      "• 電子郵件地址（通過 Google SSO）\n• 顯示名稱\n• 個人資料圖片（如果由 Google 提供）\n\n任務數據：\n• 任務標題、描述和內容\n• 截止日期和時間\n• 任務類別和優先級\n• 連結和附件\n\n使用數據：\n• 應用程式使用模式和偏好\n• 設備信息和設置",
    privacyUse: "3. 我們如何使用您的信息",
    privacyUseText:
      "我們使用您的信息來：\n• 提供和維護應用程式的功能\n• 跨設備同步您的任務\n• 改善我們的服務和用戶體驗\n• 提供客戶支持\n• 確保安全並防止欺詐",
    privacyStorage: "4. 數據存儲和安全",
    privacyStorageText:
      "• 您的數據使用 Supabase 雲基礎設施安全存儲\n• 我們實施行業標準的安全措施\n• 數據在傳輸和靜止時都經過加密\n• 只有授權人員才能訪問您的數據\n• 我們定期審查和更新我們的安全實踐",
    privacySharing: "5. 數據共享和披露",
    privacySharingText:
      "我們不出售、交易或出租您的個人信息給第三方。我們只在以下情況下共享您的信息：\n• 在您明確同意的情況下\n• 為了遵守法律義務\n• 為了保護我們的權利並防止欺詐\n• 與協助應用程式運營的服務提供商（在嚴格的保密協議下）",
    privacyThirdParty: "6. 第三方服務",
    privacyThirdPartyText:
      "我們的應用程式整合了：\n• Google：用於通過 Google SSO 進行認證\n• Supabase：用於安全的數據存儲和後端服務\n\n這些服務有自己的隱私政策，我們鼓勵您查看。",
    privacyRights: "7. 您的權利和選擇",
    privacyRightsText:
      "您有權：\n• 訪問您的個人數據\n• 更正不準確的信息\n• 刪除您的帳號和相關數據\n• 導出您的任務數據\n• 選擇退出某些數據處理活動\n• 隨時撤回同意",
    privacyRetention: "8. 數據保留",
    privacyRetentionText:
      "• 我們在您的帳號活躍期間保留您的數據\n• 您可以隨時通過應用程式設置刪除您的帳號\n• 某些數據可能因法律或安全目的而保留\n• 已刪除的數據將從我們的系統中永久移除",
    privacyChildren: "9. 兒童隱私",
    privacyChildrenText:
      "我們的應用程式不適用於 13 歲以下的兒童。我們不會故意收集 13 歲以下兒童的個人信息。如果您發現兒童向我們提供了個人信息，請立即聯繫我們。",
    privacyInternational: "10. 國際數據傳輸",
    privacyInternationalText:
      "您的信息可能會被傳輸到您所在國家以外的國家並在那裡處理。我們確保有適當的保障措施來根據本隱私政策保護您的數據。",
    privacyChanges: "11. 本政策的變更",
    privacyChangesText:
      "我們可能會不時更新本隱私政策。我們將通過在應用程式中發布新的隱私政策並更新「最後更新」日期來通知您任何變更。您在變更後繼續使用應用程式即表示接受更新後的政策。",
    privacyContact: "12. 聯繫我們",
    privacyContactText:
      "如果您對本隱私政策或我們的數據實踐有任何疑問，請通過應用程式的支持渠道聯繫我們，或發送電子郵件至 privacy@todo-app.com。",
    privacyAcknowledgment:
      "通過使用 To Do，您確認已閱讀並理解本隱私政策，並同意按照此處描述的方式收集、使用和披露您的信息。",
    googleAccount: "Google 帳號",
    logout: "登出",
    selectTime: "選擇時間",
    hour: "時",
    minute: "分",
    done: "完成",
    time: "時間",
    today: "今天",
    taskReminder: "任務提醒",
    notificationPermission: "通知權限",
    notificationPermissionMessage:
      "To Do 需要通知權限才能在任務開始前 30 分鐘提醒您。",
    enableNotifications: "啟用通知",
    notLater: "暫不啟用",
    theme: "主題",
    themeDescription: "選擇淺色或深色外觀",
    lightMode: "淺色模式",
    darkMode: "深色模式",
    appearance: "外觀",
    byContinuing: "繼續使用即表示您同意我們的",
    and: "和",
    // 提醒設定
    reminderSettings: "提醒設定",
    reminderSettingsDescription: "選擇在排程任務前多久收到通知提醒",
    reminder30min: "30分鐘前",
    reminder10min: "10分鐘前",
    reminder5min: "5分鐘前",
    reminderEnabled: "啟用提醒",
    reminderDisabled: "提醒已停用",
    reminderNote: "提醒僅會發送給已設定時間的任務",
  },
};

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
});

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 格式化時間為 HH:MM（移除秒數）
function formatTimeDisplay(time) {
  if (!time) return "";
  if (typeof time !== "string") return time;

  // 如果是 HH:MM:SS 格式，只取 HH:MM
  if (time.length > 5 && time.includes(":")) {
    return time.substring(0, 5);
  }

  return time;
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const SplashScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Handle OAuth callback if this is a redirect from OAuth
    const handleOAuthCallback = async () => {
      try {
        // Only handle OAuth callback on web platform
        if (Platform.OS !== "web" || typeof window === "undefined") {
          console.warn(
            "OAuth callback: Not on web platform, skipping callback handling"
          );
          return;
        }

        console.warn("OAuth callback: Starting callback handling");
        console.warn("OAuth callback: Current URL:", window.location.href);

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
              "OAuth callback: Database error - new user cannot be saved"
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
                    settingsError
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
                    JSON.stringify(settingsError, null, 2)
                  );

                  // Check if user_settings table exists and is accessible
                  const { data: tableCheck, error: tableError } = await supabase
                    .from("user_settings")
                    .select("id")
                    .limit(1);

                  alert(
                    "Account created but some settings could not be saved. You can continue using the app."
                  );
                } else {
                  alert("Account created successfully! Welcome to To Do!");
                }

                // Navigate to main app even if there were some issues
                navigateToMainApp();
                return;
              }
            } catch (manualError) {
              console.error("Manual user creation failed:", manualError);
            }

            alert(
              "Unable to create new user account. Please contact support or try with a different Google account."
            );
            return;
          }

          // Handle other OAuth errors
          alert(
            `Authentication error: ${decodeURIComponent(
              errorDescription || oauthError
            )}`
          );
          return;
        }

        // First, try to get the session from the URL if this is an OAuth callback
        const { data, sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("OAuth callback: Error getting session:", sessionError);
          return;
        }

        console.warn("OAuth callback: Session data:", data);

        if (data?.session) {
          console.warn("OAuth callback: User session found");
          // Force a refresh of the auth state
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error(
              "OAuth callback: Failed to get user after OAuth:",
              userError
            );
            return;
          }

          console.warn("OAuth callback: User verified, navigating to main app");
          navigateToMainApp();
        } else {
          console.warn("OAuth callback: No session found in callback");

          // Add fallback mechanisms for incognito mode or session issues

          // Try to get session with a delay (sometimes it takes time to propagate)
          setTimeout(async () => {
            try {
              const { data: fallbackData, error: fallbackError } =
                await supabase.auth.getSession();
              if (fallbackData?.session) {
                navigateToMainApp();
                return;
              }

              // Try one more time with getUser
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();
              if (user && !userError) {
                navigateToMainApp();
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
                navigateToMainApp();
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
    const navigateToMainApp = () => {
      console.warn("📍 [navigateToMainApp] Function called");

      if (hasNavigated) {
        console.warn("📍 [navigateToMainApp] ⚠️ Already navigated, skipping");
        return;
      }

      if (!navigation) {
        console.error(
          "📍 [navigateToMainApp] ❌ Navigation object is not available"
        );
        return;
      }

      console.warn(
        "📍 [navigateToMainApp] Navigation object exists, attempting reset..."
      );

      try {
        setHasNavigated(true);
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
        console.warn("📍 [navigateToMainApp] ✅ Navigation reset successful!");
      } catch (error) {
        console.error("📍 [navigateToMainApp] ❌ Navigation error:", error);
        console.error("📍 [navigateToMainApp] Error stack:", error.stack);
        setHasNavigated(false); // Reset flag on error
      }
    };

    // Set up auth state change listener
    const { data: { subscription: authSubscription } = {} } =
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.warn("Auth state changed:", { event, session });

        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED"
        ) {
          try {
            console.warn(`Processing ${event} event...`);

            // If we already have a session from the event, use it
            let currentSession = session;

            // If no session from event, try to get it
            if (!currentSession) {
              console.warn("No session in event, fetching from Supabase...");
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
              console.warn("No session available after auth state change");
              return;
            }

            console.warn("Session found, verifying user...");
            console.warn("Session user email:", currentSession.user?.email);

            // Use user directly from session to avoid API call issues
            const user = currentSession.user;

            if (!user) {
              console.error("❌ No user in session");
              return;
            }

            console.warn("✅ User verified from session!");
            console.warn("User email:", user.email);
            console.warn("User ID:", user.id);

            // 重置登入狀態
            setIsSigningIn(false);

            // 更新用戶平台資訊（不阻止登入流程）
            UserService.updatePlatformInfo()
              .then(() => {
                console.log("📱 Platform info updated successfully");
              })
              .catch((platformError) => {
                console.error(
                  "❌ Error updating platform info:",
                  platformError
                );
              });

            console.warn("🚀 Navigating to main app...");
            // Check if already navigated to prevent double navigation
            if (!hasNavigated) {
              navigateToMainApp();
            } else {
              console.warn("⚠️ Navigation skipped - already navigated");
            }
          } catch (error) {
            console.error("Error in auth state change handler:", error);
          }
        } else if (event === "SIGNED_OUT") {
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
      navigateToMainApp();
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
          handleCustomAuthSuccess
        );
      }
    };

    // Check for existing session on mount
    const checkSession = async () => {
      try {
        console.warn("[checkSession] Starting session check...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[checkSession] Error getting session:", error);
          return;
        }

        if (session) {
          console.warn("[checkSession] Existing session found!");
          console.warn("[checkSession] Session user ID:", session.user?.id);
          console.warn(
            "[checkSession] Session expires at:",
            new Date(session.expires_at * 1000).toISOString()
          );

          // Verify the user is still valid
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error(
              "[checkSession] Session invalid or user not found:",
              userError
            );
            console.error(
              "[checkSession] Attempting to clear invalid session..."
            );
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error("[checkSession] Error signing out:", signOutError);
            }
            return;
          }

          console.warn("[checkSession] User verified:", {
            id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
          });
          console.warn("[checkSession] Navigating to main app...");
          // Check if already navigated to prevent double navigation
          if (!hasNavigated) {
            navigateToMainApp();
          } else {
            console.warn(
              "⚠️ [checkSession] Navigation skipped - already navigated"
            );
          }
        } else {
          console.warn(
            "[checkSession] No existing session found, showing login screen"
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
        console.warn("🔗🔗🔗 [App.js Deep Link] Received:", event.url);

        // Check if this is an auth callback
        const isAuthCallback =
          event.url.includes("auth/callback") ||
          event.url.includes("access_token=") ||
          event.url.includes("code=") ||
          event.url.includes("error=");

        if (isAuthCallback) {
          console.warn("🔗🔗🔗 [App.js Deep Link] Auth callback detected!");

          try {
            // Parse the URL - handle custom scheme URLs
            let params;
            if (event.url.includes("#")) {
              // Hash parameters (direct token flow)
              const hashPart = event.url.split("#")[1];
              params = new URLSearchParams(hashPart);
              console.warn("🔗🔗🔗 [App.js Deep Link] Parsing from hash");
            } else if (event.url.includes("?")) {
              // Query parameters (PKCE flow)
              const queryPart = event.url.split("?")[1];
              params = new URLSearchParams(queryPart);
              console.warn("🔗🔗🔗 [App.js Deep Link] Parsing from query");
            } else {
              console.error(
                "🔗🔗🔗 [App.js Deep Link] No parameters found in URL"
              );
              return;
            }

            const code = params.get("code");
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            const error = params.get("error");

            console.warn("🔗🔗🔗 [App.js Deep Link] Params:", {
              hasCode: !!code,
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              hasError: !!error,
            });

            if (error) {
              console.error("🔗🔗🔗 [App.js Deep Link] OAuth error:", error);
              Alert.alert(
                "Authentication Error",
                params.get("error_description") || error
              );
              return;
            }

            if (code) {
              // PKCE flow - exchange code for session
              console.warn(
                "🔗🔗🔗 [App.js Deep Link] Exchanging code for session..."
              );

              const { data, error: exchangeError } =
                await supabase.auth.exchangeCodeForSession(code);

              if (exchangeError) {
                console.error(
                  "🔗🔗🔗 [App.js Deep Link] ❌ Code exchange failed:",
                  exchangeError
                );
                Alert.alert(
                  "Authentication Error",
                  "Failed to complete sign in. Please try again."
                );
                return;
              }

              console.warn(
                "🔗🔗🔗 [App.js Deep Link] ✅ Code exchanged successfully!"
              );
              console.warn(
                "🔗🔗🔗 [App.js Deep Link] Session user:",
                data?.session?.user?.email
              );

              // Navigate to main app
              console.warn(
                "🔗🔗🔗 [App.js Deep Link] Navigating to main app..."
              );
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              });
            } else if (accessToken && refreshToken) {
              // Direct token flow
              console.warn(
                "🔗🔗🔗 [App.js Deep Link] Setting session with tokens..."
              );

              const { data, error: sessionError } =
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

              if (sessionError) {
                console.error(
                  "🔗🔗🔗 [App.js Deep Link] ❌ Set session failed:",
                  sessionError
                );
                Alert.alert(
                  "Authentication Error",
                  "Failed to complete sign in. Please try again."
                );
                return;
              }

              console.warn(
                "🔗🔗🔗 [App.js Deep Link] ✅ Session set successfully!"
              );

              // Navigate to main app
              console.warn(
                "🔗🔗🔗 [App.js Deep Link] Navigating to main app..."
              );
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              });
            } else {
              console.error(
                "🔗🔗🔗 [App.js Deep Link] No code or tokens found in callback"
              );
            }
          } catch (error) {
            console.error(
              "🔗🔗🔗 [App.js Deep Link] ❌ Error handling deep link:",
              error
            );
            console.error(
              "🔗🔗🔗 [App.js Deep Link] Error stack:",
              error.stack
            );
          }
        } else {
          console.warn(
            "🔗🔗🔗 [App.js Deep Link] Not an auth callback, ignoring"
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
          console.warn("Initial URL is an auth callback:", url.href);
          await handleOAuthCallback();
          return;
        }
      } else {
        // For mobile, check if app was launched with a deep link
        console.warn("Mobile platform detected, checking for initial URL...");

        try {
          const initialUrl = await Linking.getInitialURL();
          console.warn("Initial URL:", initialUrl || "None");

          if (
            initialUrl &&
            (initialUrl.includes("auth/callback") ||
              initialUrl.includes("code=") ||
              initialUrl.includes("access_token="))
          ) {
            console.warn(
              "🔗🔗🔗 [App.js] App launched with auth callback URL!"
            );
            // Process the deep link
            await handleDeepLink({ url: initialUrl });
            return;
          }
        } catch (error) {
          console.error("Error getting initial URL:", error);
        }

        // If no auth callback in initial URL, check for existing session with retry
        console.warn(
          "No auth callback in initial URL, checking for session..."
        );

        // Try multiple times with delays to handle OAuth callback timing
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.warn(`Session check attempt ${attempt}/3...`);

            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();

            if (error) {
              console.error(
                `Error checking session (attempt ${attempt}):`,
                error
              );
            } else if (session) {
              console.warn(
                `Mobile: Session found on attempt ${attempt}, navigating to main app`
              );
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              });
              return;
            } else {
              console.warn(`No session found on attempt ${attempt}`);
            }

            // Wait before next attempt (except on last attempt)
            if (attempt < 3) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempt)
              );
            }
          } catch (error) {
            console.error(
              `Error in mobile session check (attempt ${attempt}):`,
              error
            );
          }
        }

        console.warn(
          "All session check attempts completed, proceeding to check existing session"
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
        console.warn("Fallback 1: Checking session after 2 seconds");
        await checkSessionAndNavigate();
      }, 2000),

      setTimeout(async () => {
        console.warn("Fallback 2: Checking session after 5 seconds");
        await checkSessionAndNavigate();
      }, 5000),

      setTimeout(async () => {
        console.warn("Fallback 3: Final session check after 10 seconds");
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
          console.warn("Fallback: Session found, verifying user...");
          // Verify the user before navigating
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error("Fallback: User verification failed:", userError);
            return;
          }

          console.warn("Fallback: User verified, navigating to main app");
          navigateToMainApp();
          return true; // Success
        } else {
          console.warn("Fallback: No session found");
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
        console.warn("Navigation state changed:", e.data.state);
      });
      return unsubscribe;
    }
    // Return empty cleanup function if addListener is not available
    return () => {};
  }, [navigation]);

  const handleGoogleSignIn = async () => {
    // Prevent multiple simultaneous sign-in attempts
    if (isSigningIn) {
      console.warn(
        "⚠️ Sign-in already in progress, ignoring duplicate request"
      );
      return;
    }

    setIsSigningIn(true);
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
        // Let the auth state change listener handle navigation
        console.warn("⏳ Waiting for auth state listener to navigate...");
        return;
      }

      // Use the correct redirect URL for Expo
      const getRedirectUrl = () => {
        if (Platform.OS !== "web") {
          // For standalone apps (TestFlight), use Vercel callback page
          // The page will redirect back to app using custom URI scheme
          return "https://to-do-mvp.vercel.app/auth/callback";
        }

        // For web, always return the current origin
        // Supabase will redirect back to the same page with auth tokens/code
        const currentOrigin = window.location.origin;
        console.warn("VERBOSE: Current origin:", currentOrigin);

        // For web (both localhost and production), return current origin
        // This allows Supabase to redirect back to the same page with auth data
        return currentOrigin;
      };

      const redirectUrl = getRedirectUrl();
      console.warn("VERBOSE: Using redirect URL:", redirectUrl);

      // Debug: Log current window location for web
      if (Platform.OS === "web") {
        console.warn("VERBOSE: Current window location:", {
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
        console.warn("VERBOSE: Opening auth URL in browser");
        console.warn("VERBOSE: Auth URL:", data.url);
        if (Platform.OS === "web") {
          // For web, we need to redirect to the auth URL
          console.warn("VERBOSE: Redirecting to:", data.url);
          // Use window.location.replace to avoid back button issues (web only)
          if (
            Platform.OS === "web" &&
            typeof window !== "undefined" &&
            window.location
          ) {
            window.location.replace(data.url);
          }
        } else {
          // For mobile, open the auth URL in a web browser
          console.warn("VERBOSE: Opening OAuth browser session...");
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );
          console.warn("VERBOSE: Auth session result:", result);

          // ✅ KEY FIX: The result.url contains the OAuth callback URL
          // We need to manually process it since iOS doesn't automatically trigger the deep link
          if (result.type === "success" && result.url) {
            console.warn(
              "🎯 [CRITICAL] WebBrowser returned with URL, processing manually..."
            );
            console.warn("🎯 [CRITICAL] Returned URL:", result.url);

            // Parse and handle the OAuth callback URL directly
            try {
              let params;
              if (result.url.includes("#")) {
                const hashPart = result.url.split("#")[1];
                params = new URLSearchParams(hashPart);
                console.warn("🎯 [CRITICAL] Parsing from hash");
              } else if (result.url.includes("?")) {
                const queryPart = result.url.split("?")[1];
                params = new URLSearchParams(queryPart);
                console.warn("🎯 [CRITICAL] Parsing from query");
              }

              if (params) {
                const code = params.get("code");
                const accessToken = params.get("access_token");
                const refreshToken = params.get("refresh_token");
                const error = params.get("error");

                console.warn("🎯 [CRITICAL] OAuth params:", {
                  hasCode: !!code,
                  hasAccessToken: !!accessToken,
                  hasRefreshToken: !!refreshToken,
                  hasError: !!error,
                });

                if (error) {
                  console.error("🎯 [CRITICAL] OAuth error:", error);
                  Alert.alert(
                    "Authentication Error",
                    params.get("error_description") || error
                  );
                  return;
                }

                if (code) {
                  // Exchange code for session
                  console.warn("🎯 [CRITICAL] Exchanging code for session...");

                  const { data: sessionData, error: exchangeError } =
                    await supabase.auth.exchangeCodeForSession(code);

                  if (exchangeError) {
                    console.error(
                      "🎯 [CRITICAL] ❌ Code exchange failed:",
                      exchangeError
                    );
                    Alert.alert(
                      "Authentication Error",
                      "Failed to complete sign in. Please try again."
                    );
                    return;
                  }

                  console.warn("🎯 [CRITICAL] ✅ Code exchanged successfully!");
                  console.warn("🎯 [CRITICAL] Session:", {
                    hasSession: !!sessionData?.session,
                    userEmail: sessionData?.session?.user?.email,
                  });

                  // Don't navigate here - let auth state listener handle it
                  // exchangeCodeForSession triggers SIGNED_IN event which will navigate
                  console.warn(
                    "🎯 [CRITICAL] ⏳ Waiting for auth state listener to navigate..."
                  );
                  console.warn(
                    "🎯 [CRITICAL] (SIGNED_IN event should trigger navigation)"
                  );

                  setIsSigningIn(false);
                  return;
                } else if (accessToken && refreshToken) {
                  // Direct token flow
                  console.warn("🎯 [CRITICAL] Setting session with tokens...");

                  const { data: sessionData, error: sessionError } =
                    await supabase.auth.setSession({
                      access_token: accessToken,
                      refresh_token: refreshToken,
                    });

                  if (sessionError) {
                    console.error(
                      "🎯 [CRITICAL] ❌ Set session failed:",
                      sessionError
                    );
                    Alert.alert(
                      "Authentication Error",
                      "Failed to complete sign in. Please try again."
                    );
                    return;
                  }

                  console.warn("🎯 [CRITICAL] ✅ Session set successfully!");

                  // Don't navigate here - let auth state listener handle it
                  console.warn(
                    "🎯 [CRITICAL] ⏳ Waiting for auth state listener to navigate..."
                  );

                  setIsSigningIn(false);
                  return;
                }
              }
            } catch (error) {
              console.error(
                "🎯 [CRITICAL] ❌ Error processing OAuth callback:",
                error
              );
              Alert.alert(
                "Authentication Error",
                "Failed to process authentication. Please try again."
              );
              return;
            }

            return;
          } else if (result.type === "cancel") {
            console.warn("VERBOSE: User cancelled the auth flow");
            setIsSigningIn(false);
            Alert.alert(
              "Sign In Cancelled",
              "You cancelled the sign in process."
            );
            return;
          } else if (result.type === "dismiss") {
            console.warn("VERBOSE: Auth flow was dismissed");
            setIsSigningIn(false);
            return;
          }

          // If we get here, something unexpected happened
          console.error("VERBOSE: Unexpected result type:", result.type);

          // Give the deep link handler more time to process the callback
          // The auth state listener will handle navigation automatically
          const checkSessionWithRetry = async (
            attempt = 1,
            maxAttempts = 5
          ) => {
            console.warn(
              `[Auth Fallback] Session check attempt ${attempt}/${maxAttempts}...`
            );

            const {
              data: { session: newSession },
              error: sessionCheckError,
            } = await supabase.auth.getSession();

            if (sessionCheckError) {
              console.error(
                "[Auth Fallback] Error checking session:",
                sessionCheckError
              );
              if (attempt >= maxAttempts) {
                setIsSigningIn(false);
                Alert.alert(
                  "Authentication Error",
                  "Failed to complete sign in. Please try again."
                );
              }
              return;
            }

            if (!newSession) {
              console.warn(
                `[Auth Fallback] No session found on attempt ${attempt}`
              );

              // Retry if we haven't reached max attempts
              if (attempt < maxAttempts) {
                const delay = 2000 * attempt; // Increasing delay: 2s, 4s, 6s, 8s
                console.warn(`[Auth Fallback] Retrying in ${delay}ms...`);
                setTimeout(
                  () => checkSessionWithRetry(attempt + 1, maxAttempts),
                  delay
                );
              } else {
                console.error(
                  "[Auth Fallback] All attempts exhausted, no session found"
                );
                setIsSigningIn(false);
                Alert.alert(
                  "Sign In Issue",
                  "Authentication completed but session was not established. Please try signing in again.\n\nIf this persists, try restarting the app."
                );
              }
            } else {
              console.warn(
                `[Auth Fallback] ✅ Session found on attempt ${attempt}!`
              );
              console.warn("[Auth Fallback] User:", newSession.user?.email);

              // Manually trigger navigation if auth listener hasn't done it yet
              console.warn("[Auth Fallback] Manually triggering navigation...");
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
        { cancelable: true }
      );
    } finally {
      console.groupEnd();
      setIsSigningIn(false);
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
          source={require("./assets/logo.png")}
          style={{ width: 140, height: 140, marginBottom: 16 }}
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
          To Do
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
            }}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <Text
                style={{
                  color: theme.mode === "dark" ? theme.text : "#4285F4",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Signing in...
              </Text>
            ) : (
              <>
                <Image
                  source={require("./assets/google-logo.png")}
                  style={{ width: 24, height: 24, marginRight: 8 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: theme.mode === "dark" ? theme.text : "#4285F4",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Sign in with Google
                </Text>
              </>
            )}
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
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <Text
          style={{
            fontSize: 20,
            color: theme.text,
            fontWeight: "bold",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {t.termsTitle}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          {t.termsLastUpdated} {new Date().toLocaleDateString()}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsAcceptance}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsAcceptanceText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsDescription}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsDescriptionText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsAccounts}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsAccountsText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsContent}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsContentText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsAcceptableUse}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsAcceptableUseText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsPrivacy}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsPrivacyText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsAvailability}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsAvailabilityText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsLiability}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsLiabilityText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsChanges}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.termsChangesText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.termsContact}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 20,
            lineHeight: 22,
          }}
        >
          {t.termsContactText}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.textTertiary,
            marginTop: 20,
            textAlign: "center",
            fontStyle: "italic",
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
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <Text
          style={{
            fontSize: 20,
            color: theme.text,
            fontWeight: "bold",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {t.privacyTitle}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          {t.privacyLastUpdated} {new Date().toLocaleDateString()}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyIntroduction}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyIntroductionText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyInformation}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          <Text style={{ fontWeight: "600" }}>{t.privacyAccountInfo}</Text>
          {"\n"}
          {t.privacyAccountInfoText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyUse}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyUseText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyStorage}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyStorageText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacySharing}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacySharingText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyThirdParty}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyThirdPartyText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyRights}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyRightsText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyRetention}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyRetentionText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyChildren}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyChildrenText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyInternational}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyInternationalText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyChanges}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 16,
            lineHeight: 22,
          }}
        >
          {t.privacyChangesText}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.text,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t.privacyContact}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.text,
            marginBottom: 20,
            lineHeight: 22,
          }}
        >
          {t.privacyContactText}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.textTertiary,
            marginTop: 20,
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          {t.privacyAcknowledgment}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingScreen() {
  const { language, setLanguage, t } = useContext(LanguageContext);
  const { theme, themeMode, setThemeMode } = useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userProfile, setUserProfile] = useState(null);
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);
  const [themeDropdownVisible, setThemeDropdownVisible] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    times: [30, 10], // 預設30分鐘和10分鐘前提醒
  });
  const [reminderDropdownVisible, setReminderDropdownVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const profile = await UserService.getUserProfile();
        if (profile) {
          setUserProfile(profile);
          setUserName(profile.name);
        } else {
          setUserName("User");
        }
      } catch (error) {
        console.error("Error retrieving user profile:", error);
        setUserName("User");
      }
    };
    getUserProfile();
  }, []);

  // 載入提醒設定
  useEffect(() => {
    const loadReminderSettings = async () => {
      try {
        const settings = await UserService.getUserSettings();
        if (settings.reminder_settings) {
          setReminderSettings(settings.reminder_settings);
        }
      } catch (error) {
        console.error("Error loading reminder settings:", error);
      }
    };
    loadReminderSettings();
  }, []);

  // 當頁面獲得焦點時，關閉所有下拉選單
  useFocusEffect(
    React.useCallback(() => {
      setLanguageDropdownVisible(false);
      setThemeDropdownVisible(false);
      setReminderDropdownVisible(false);
    }, [])
  );

  // 更新提醒設定
  const updateReminderSettings = async (newSettings) => {
    try {
      setReminderSettings(newSettings);
      await UserService.updateUserSettings({
        reminder_settings: newSettings,
      });
    } catch (error) {
      console.error("Error updating reminder settings:", error);
    }
  };

  const openModal = (text) => {
    setModalText(text);
    setModalVisible(true);
  };

  const handleLogout = async () => {
    try {
      setLogoutModalVisible(false);

      // Check if we have a valid session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Splash" }],
        });
        return;
      }

      // Try to log out (using Supabase's signOut API)
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Log out error:", error);
        throw error;
      }

      // Navigate back to splash screen immediately after logout
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

      // Show detailed error message
      const errorMessage =
        error?.message || "Failed to log out. Please try again.";
      setModalText(t.logoutError || errorMessage);
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
        <Text
          style={{
            color: theme.textSecondary,
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
            backgroundColor: theme.card,
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            padding: 20,
            shadowColor: theme.shadow,
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            {userProfile?.avatar_url && (
              <Image
                source={{ uri: userProfile.avatar_url }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 15,
                }}
              />
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
                {userProfile?.name || userName}
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
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.divider,
              paddingTop: 15,
            }}
          >
            <Text
              style={{
                color: theme.textTertiary,
                fontSize: 12,
                marginBottom: 5,
              }}
            >
              {t.accountType}
            </Text>
            <Text
              style={{ color: theme.primary, fontSize: 14, fontWeight: "500" }}
            >
              {t.googleAccount}
            </Text>
          </View>
        </View>
        {/* General Section Title */}
        <Text
          style={{
            color: theme.textSecondary,
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
            backgroundColor: theme.card,
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            overflow: "hidden",
            shadowColor: theme.shadow,
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setLanguageDropdownVisible(!languageDropdownVisible);
              setThemeDropdownVisible(false); // 關閉主題下拉選單
              setReminderDropdownVisible(false); // 關閉提醒下拉選單
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
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontSize: 16, marginBottom: 4 }}
              >
                {t.language}
              </Text>
              <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                {t.languageDescription}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 14,
                  marginRight: 8,
                }}
              >
                {language === "en" ? t.english : t.chinese}
              </Text>
              <MaterialIcons
                name={
                  languageDropdownVisible
                    ? "keyboard-arrow-up"
                    : "keyboard-arrow-down"
                }
                size={20}
                color={theme.textTertiary}
                style={{ marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>

          {languageDropdownVisible && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.divider,
                backgroundColor:
                  themeMode === "light" ? "#ffffff" : theme.backgroundTertiary,
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
                  paddingHorizontal: 20,
                  backgroundColor:
                    language === "en" ? theme.calendarSelected : "transparent",
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
                  paddingHorizontal: 20,
                  backgroundColor:
                    language === "zh" ? theme.calendarSelected : "transparent",
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
            </View>
          )}
        </View>

        {/* Theme selection block */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            overflow: "hidden",
            shadowColor: theme.shadow,
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setThemeDropdownVisible(!themeDropdownVisible);
              setLanguageDropdownVisible(false); // 關閉語言下拉選單
              setReminderDropdownVisible(false); // 關閉提醒下拉選單
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
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontSize: 16, marginBottom: 4 }}
              >
                {t.theme}
              </Text>
              <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                {t.themeDescription}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 14,
                  marginRight: 8,
                }}
              >
                {themeMode === "light" ? t.lightMode : t.darkMode}
              </Text>
              <MaterialIcons
                name={
                  themeDropdownVisible
                    ? "keyboard-arrow-up"
                    : "keyboard-arrow-down"
                }
                size={20}
                color={theme.textTertiary}
                style={{ marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>

          {themeDropdownVisible && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.divider,
                backgroundColor:
                  themeMode === "light" ? "#ffffff" : theme.backgroundTertiary,
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
                  paddingHorizontal: 20,
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
                  paddingHorizontal: 20,
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
        </View>

        {/* Reminder Settings Section */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            overflow: "hidden",
            shadowColor: theme.shadow,
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
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
              paddingVertical: 12,
              paddingHorizontal: 20,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: theme.text, fontSize: 16, marginBottom: 4 }}
              >
                {t.reminderSettings}
              </Text>
              <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                {t.reminderSettingsDescription}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 14,
                  marginRight: 8,
                }}
              >
                {reminderSettings.enabled
                  ? t.reminderEnabled
                  : t.reminderDisabled}
              </Text>
              <MaterialIcons
                name={
                  reminderDropdownVisible
                    ? "keyboard-arrow-up"
                    : "keyboard-arrow-down"
                }
                size={20}
                color={theme.textTertiary}
                style={{ marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>

          {reminderDropdownVisible && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.divider,
                backgroundColor:
                  themeMode === "light" ? "#ffffff" : theme.backgroundTertiary,
                paddingVertical: 8,
              }}
            >
              {/* 啟用/停用提醒 */}
              <TouchableOpacity
                onPress={() => {
                  updateReminderSettings({
                    ...reminderSettings,
                    enabled: !reminderSettings.enabled,
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
                  {t.reminderEnabled}
                </Text>
                <MaterialIcons
                  name={
                    reminderSettings.enabled
                      ? "check-box"
                      : "check-box-outline-blank"
                  }
                  size={24}
                  color={
                    reminderSettings.enabled
                      ? theme.primary
                      : theme.textTertiary
                  }
                />
              </TouchableOpacity>

              {reminderSettings.enabled && (
                <>
                  <View
                    style={{ borderTopWidth: 1, borderTopColor: theme.divider }}
                  />

                  {/* 提醒時間選項 */}
                  {[
                    { value: 30, label: t.reminder30min },
                    { value: 10, label: t.reminder10min },
                    { value: 5, label: t.reminder5min },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        const newTimes = reminderSettings.times.includes(
                          option.value
                        )
                          ? reminderSettings.times.filter(
                              (time) => time !== option.value
                            )
                          : [...reminderSettings.times, option.value].sort(
                              (a, b) => b - a
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
                          reminderSettings.times.includes(option.value)
                            ? "check-box"
                            : "check-box-outline-blank"
                        }
                        size={24}
                        color={
                          reminderSettings.times.includes(option.value)
                            ? theme.primary
                            : theme.textTertiary
                        }
                      />
                    </TouchableOpacity>
                  ))}

                  <View
                    style={{ borderTopWidth: 1, borderTopColor: theme.divider }}
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

        {/* Legal Section Title */}
        <Text
          style={{
            color: theme.textSecondary,
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

        {/* Terms of Use */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            overflow: "hidden",
            shadowColor: theme.shadow,
            shadowOpacity: theme.shadowOpacity,
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
            <Text style={{ color: theme.text, fontSize: 16 }}>{t.terms}</Text>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={20}
              color={theme.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Privacy Policy */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 14,
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 0,
            overflow: "hidden",
            shadowColor: theme.shadow,
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
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
            <Text style={{ color: theme.text, fontSize: 16 }}>{t.privacy}</Text>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={20}
              color={theme.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Log Out and Version Section */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            marginBottom: 20,
            padding: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setLogoutModalVisible(true);
            }}
            style={{
              backgroundColor: theme.card,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              alignItems: "center",
              marginBottom: 16,
              shadowColor: theme.shadow,
              shadowOpacity: theme.shadowOpacity,
              shadowRadius: 4,
              elevation: 1,
              width: "100%",
            }}
          >
            <Text
              style={{ color: theme.error, fontSize: 16, fontWeight: "600" }}
            >
              {t.logout || "Log out"}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              color: theme.textTertiary,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {t.version} {require("./package.json").version}
          </Text>
        </View>
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
    </SafeAreaView>
  );
}

function CalendarScreen({ navigation, route }) {
  const { language, t } = useContext(LanguageContext);
  const { theme, themeMode } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
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
  const [taskLink, setTaskLink] = useState("");
  const [taskDate, setTaskDate] = useState(selectedDate);
  const [taskNote, setTaskNote] = useState("");
  const [linkInputFocused, setLinkInputFocused] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const [tempTime, setTempTime] = useState(null);
  const scrollViewRef = useRef(null); // 日曆 ScrollView
  const modalScrollViewRef = useRef(null); // Modal ScrollView

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
        6
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

  // 同步 taskDate 和 selectedDate
  useEffect(() => {
    if (!modalVisible) {
      setTaskDate(selectedDate);
    }
  }, [selectedDate, modalVisible]);

  // Load tasks from Supabase
  useEffect(() => {
    const loadTasks = async () => {
      try {
        // 首先檢查用戶認證狀態
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!user) {
          console.warn("No authenticated user found");
          setTasks({});
          return;
        }

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
    setTaskLink("");
    setTaskDate(date);
    setTaskNote("");
    setLinkInputFocused(false);
    setSelectedDate(date);
    setModalVisible(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskText(task.title);
    setTaskTime(task.time || "");
    setTaskLink(task.link || "");
    setTaskDate(task.date);
    setTaskNote(task.note || "");
    setSelectedDate(task.date);
    setModalVisible(true);
  };

  const saveTask = async () => {
    if (taskText.trim() === "") return;
    if (taskDate.trim() === "") return;

    try {
      const targetDate = taskDate || selectedDate;

      if (editingTask) {
        console.log("Updating existing task:", editingTask.id);
        console.log("Update data:", {
          title: taskText,
          time: taskTime,
          link: taskLink,
          date: targetDate,
          note: taskNote,
        });

        // Cancel old notification if exists (支援新舊格式)
        if (editingTask.notificationIds) {
          await cancelTaskNotification(editingTask.notificationIds);
        } else if (editingTask.notificationId) {
          await cancelTaskNotification(editingTask.notificationId);
        }

        // Update existing task
        const updatedTask = await TaskService.updateTask(editingTask.id, {
          title: taskText,
          time: taskTime,
          link: taskLink,
          date: targetDate,
          note: taskNote,
        });

        // Schedule notification for updated task (native only)
        if (Platform.OS !== "web") {
          const notificationIds = await scheduleTaskNotification(
            {
              id: updatedTask.id,
              text: taskText,
              date: targetDate,
              time: taskTime,
              notificationIds: editingTask.notificationIds, // 傳遞舊的 IDs 以便取消
            },
            t.taskReminder,
            getActiveReminderMinutes() // 從配置文件讀取提醒時間
          );

          if (notificationIds.length > 0) {
            // Store notification IDs in local state only (不存到資料庫)
            updatedTask.notificationIds = notificationIds;
          }
        }

        if (editingTask.date !== targetDate) {
          // Date changed - remove from old date and add to new date
          const oldDayTasks = tasks[editingTask.date] || [];
          const newOldDayTasks = oldDayTasks.filter(
            (t) => t.id !== editingTask.id
          );

          const newDayTasks = tasks[targetDate] || [];
          const updatedNewDayTasks = [...newDayTasks, updatedTask];

          setTasks({
            ...tasks,
            [editingTask.date]: newOldDayTasks,
            [targetDate]: updatedNewDayTasks,
          });
        } else {
          // Same date - update in place
          const dayTasks = tasks[targetDate] || [];
          const updatedDayTasks = dayTasks.map((t) =>
            t.id === editingTask.id ? updatedTask : t
          );
          setTasks({ ...tasks, [targetDate]: updatedDayTasks });
        }
      } else {
        // Create new task
        const newTask = await TaskService.addTask({
          title: taskText,
          time: taskTime,
          link: taskLink,
          date: targetDate,
          note: taskNote,
          is_completed: false,
        });

        // Schedule notification for new task (native only)
        if (Platform.OS !== "web") {
          const notificationIds = await scheduleTaskNotification(
            {
              id: newTask.id,
              text: taskText,
              date: targetDate,
              time: taskTime,
            },
            t.taskReminder,
            getActiveReminderMinutes() // 從配置文件讀取提醒時間
          );

          if (notificationIds.length > 0) {
            // Store notification IDs in local state only (不存到資料庫)
            newTask.notificationIds = notificationIds;
          }
        }

        const dayTasks = tasks[targetDate] || [];
        setTasks({ ...tasks, [targetDate]: [...dayTasks, newTask] });
      }

      setModalVisible(false);
      setEditingTask(null);
      setTaskText("");
      setTaskTime("");
      setTaskLink("");
      setTaskDate(selectedDate);
      setTaskNote("");
      setLinkInputFocused(false);
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to save task. Please try again.");
    }
  };

  const showDeleteConfirm = () => {
    console.log("showDeleteConfirm called, using Alert.alert");
    Alert.alert(
      t.deleteConfirm,
      "",
      [
        {
          text: t.cancel,
          onPress: () => console.log("Delete cancelled"),
          style: "cancel",
        },
        {
          text: t.delete,
          onPress: deleteTask,
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const deleteTask = async () => {
    if (!editingTask) return;

    try {
      // Cancel notification if exists (支援新舊格式)
      if (editingTask.notificationIds) {
        await cancelTaskNotification(editingTask.notificationIds);
      } else if (editingTask.notificationId) {
        await cancelTaskNotification(editingTask.notificationId);
      }

      await TaskService.deleteTask(editingTask.id);

      // Update local state
      const day = editingTask.date;
      const dayTasks = tasks[day] ? [...tasks[day]] : [];
      const filteredTasks = dayTasks.filter((t) => t.id !== editingTask.id);
      const newTasks = { ...tasks, [day]: filteredTasks };
      setTasks(newTasks);

      setModalVisible(false);
      setEditingTask(null);
      setTaskText("");
      setTaskTime("");
      setTaskLink("");
      setTaskDate(selectedDate);
      setTaskNote("");
      setLinkInputFocused(false);
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

  const moveTaskToDate = async (task, toDate) => {
    if (task.date === toDate) return;
    if (task.date !== selectedDate) return;

    try {
      // 更新任務的日期到數據庫
      await TaskService.updateTask(task.id, { date: toDate });

      // 更新本地狀態
      const fromTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];
      const toTasks = tasks[toDate] ? [...tasks[toDate]] : [];
      const filteredTasks = fromTasks.filter((t) => t.id !== task.id);
      const updatedTask = { ...task, date: toDate };
      toTasks.push(updatedTask);
      setTasks({ ...tasks, [selectedDate]: filteredTasks, [toDate]: toTasks });

      setMoveMode(false);
      setTaskToMove(null);
    } catch (error) {
      console.error("Error moving task:", error);
      Alert.alert("Error", "Failed to move task. Please try again.");
    }
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
                { color: theme.text },
                !isCurrentMonth && [
                  styles.otherMonthText,
                  { color: theme.textTertiary },
                ],
                isSelected && [
                  styles.selectedDayText,
                  { color: theme.primary },
                ],
                isToday && styles.todayText,
                !isInRange && styles.hiddenDate,
              ]}
            >
              {isInRange ? String(dateObj.getDate()) : ""}
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
          { backgroundColor: "transparent" },
          isSelected && [
            styles.selectedDay,
            { backgroundColor: theme.calendarSelected },
          ],
          moveMode && styles.calendarDayMoveTarget,
        ]}
      >
        {renderDateContent()}
        {tasks[date] && tasks[date].length > 0 && (
          <View style={[styles.taskDot, { backgroundColor: theme.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  const toggleTaskChecked = async (task) => {
    try {
      const newCompletedState = !(task.is_completed || task.checked);

      // If task is being marked as completed, cancel notification (支援新舊格式)
      if (newCompletedState) {
        if (task.notificationIds) {
          await cancelTaskNotification(task.notificationIds);
        } else if (task.notificationId) {
          await cancelTaskNotification(task.notificationId);
        }
      }

      await TaskService.toggleTaskChecked(task.id, newCompletedState);

      // Update local state
      const dayTasks = tasks[task.date] ? [...tasks[task.date]] : [];
      const updatedTasks = dayTasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              checked: newCompletedState,
              is_completed: newCompletedState,
            }
          : t
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
              { backgroundColor: theme.primary, shadowColor: theme.primary },
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

          {dayTasks.length === 0 ? (
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
        style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
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
                            console.error("Failed to open URL:", err)
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
                                parseInt(taskTime.split(":")[1]) || 0
                              )
                            : now
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
                      },
                    ]}
                    value={taskNote}
                    onChangeText={setTaskNote}
                    placeholder={t.notePlaceholder}
                    placeholderTextColor={theme.textPlaceholder}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                    accessibilityLabel="Task note input"
                    accessibilityHint="Enter additional notes for this task"
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
      deleteConfirmVisible
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
                      "0"
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
                      "0"
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
      <View style={styles.headerContainer}>
        <Text style={[styles.currentMonthTitle, { color: theme.text }]}>
          {visibleYear} {monthNames[visibleMonth]}
        </Text>
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
  );

  const calendarContent = (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[styles.calendarSection, { backgroundColor: theme.background }]}
      >
        {header}
        <View
          style={[styles.weekDaysHeader, { borderBottomColor: theme.divider }]}
        >
          {t.weekDays.map((d, i) => (
            <Text
              key={i}
              style={[styles.weekDayText, { color: theme.textSecondary }]}
            >
              {d}
            </Text>
          ))}
        </View>
        <View>
          {Platform.OS === "web" ? (
            <ScrollView
              ref={scrollViewRef}
              style={[
                styles.calendarScrollView,
                { backgroundColor: theme.background },
              ]}
              contentContainerStyle={styles.scrollContent}
            >
              {renderCalendar()}
            </ScrollView>
          ) : (
            <PanGestureHandler onHandlerStateChange={handleVerticalGesture}>
              <View>
                <ScrollView
                  ref={scrollViewRef}
                  style={[
                    styles.calendarScrollView,
                    { backgroundColor: theme.background },
                  ]}
                  contentContainerStyle={styles.scrollContent}
                >
                  {renderCalendar()}
                </ScrollView>
              </View>
            </PanGestureHandler>
          )}
        </View>
      </View>
      <View
        style={[
          styles.taskAreaContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        {renderTaskArea()}
      </View>
      {renderModal()}
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      {Platform.OS === "web" ? (
        calendarContent
      ) : (
        <GestureHandlerRootView
          style={[styles.container, { backgroundColor: theme.background }]}
        >
          {calendarContent}
        </GestureHandlerRootView>
      )}
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
      // Add Google Fonts links
      const fontsLink = document.createElement("link");
      fontsLink.href =
        "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap";
      fontsLink.rel = "stylesheet";
      document.head.appendChild(fontsLink);

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
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      const setTitle = () => {
        document.title = "To Do";
      };
      setTitle();
      const observer = new MutationObserver(() => {
        if (document.title !== "To Do") {
          document.title = "To Do";
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
  const [themeMode, setThemeModeState] = useState("light");
  const [loadingTheme, setLoadingTheme] = useState(true);

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
      document.title = "Too Doo List";
    }
    ReactGA.initialize("G-NV40E1BDH3");

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
        console.log("🌐 Loading language settings from Supabase...");
        const userSettings = await UserService.getUserSettings();
        console.log("📦 User settings received:", userSettings);

        if (
          userSettings.language &&
          (userSettings.language === "en" || userSettings.language === "zh")
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
          if (lang && (lang === "en" || lang === "zh")) {
            console.log(`📱 Language loaded from AsyncStorage: ${lang}`);
            setLanguageState(lang);
          }
        });
      } finally {
        setLoadingLang(false);
      }
    };

    const loadTheme = async () => {
      try {
        console.log("🎨 Loading theme settings from Supabase...");
        const userSettings = await UserService.getUserSettings();
        console.log("📦 Theme settings received:", userSettings);

        if (
          userSettings.theme &&
          (userSettings.theme === "light" || userSettings.theme === "dark")
        ) {
          console.log(`✅ Theme loaded: ${userSettings.theme}`);
          setThemeModeState(userSettings.theme);
        } else {
          console.log("⚠️ No theme setting found, using default: light");
        }
      } catch (error) {
        console.error("❌ Error loading theme settings:", error);
      } finally {
        setLoadingTheme(false);
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

    loadLanguage();
    loadTheme();
    updatePlatformOnStart();
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
    } catch (error) {
      console.error("❌ Error saving language to Supabase:", error);
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
    });
  }, [fontsLoaded, fontTimeout, loadingLang]);

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
  if (loadingLang && !fontTimeout) {
    console.log("Waiting for language...");
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
          document.title = "To Do";
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
      value={{ theme, themeMode, setThemeMode, toggleTheme }}
    >
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <NavigationContainer
          linking={{
            prefixes: ["https://to-do-mvp.vercel.app", "http://localhost:8081"],
            config: {
              screens: {
                Splash: "",
                MainTabs: "app",
                Terms: "terms",
                Privacy: "privacy",
                ComingSoon: "coming-soon",
              },
            },
          }}
          onStateChange={() => {
            if (typeof document !== "undefined") {
              document.title = "To Do";
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
            <Stack.Screen
              name="ComingSoon"
              component={require("./ComingSoonScreen").default}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageContext.Provider>
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
    // backgroundColor moved to inline style to use theme
  },
  taskAreaContainer: {
    // backgroundColor moved to inline style to use theme
    width: "100%",
    flex: 1,
    paddingBottom: 60, // Add padding equal to bottom bar height
  },
  taskArea: {
    flex: 1,
    // backgroundColor moved to inline style to use theme
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  currentMonthTitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "left",
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
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6c63ff",
  },
  todayCircle: {
    backgroundColor: "#6c63ff",
    width: 20,
    height: 20,
    borderRadius: 12,
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
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  },
});
