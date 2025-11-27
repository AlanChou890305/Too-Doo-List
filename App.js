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
import { getCurrentEnvironment } from "./src/config/environment";
import { mixpanelService } from "./src/services/mixpanelService";
import { widgetService } from "./src/services/widgetService";
import { format } from "date-fns";

// 獲取重定向 URL
const getRedirectUrl = () => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || "production";

  const urls = {
    production: "https://to-do-mvp.vercel.app", // Production 使用正式網域
    staging: "https://to-do-staging.vercel.app", // Staging 使用測試網域
  };

  return urls[env] || urls.production;
};

const getAppDisplayName = () => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || "production";
  return env === "staging" ? "ToDo - 測試" : "ToDo - 待辦清單";
};

// 調試資訊 - 強制重新部署
console.log("🚨🚨🚨 環境變數調試開始 🚨🚨🚨");
console.log(
  "🔍 APP DEBUG - EXPO_PUBLIC_APP_ENV:",
  process.env.EXPO_PUBLIC_APP_ENV
);
console.log(
  "🔍 APP DEBUG - EXPO_PUBLIC_SUPABASE_URL_DEV:",
  process.env.EXPO_PUBLIC_SUPABASE_URL_DEV
);
console.log(
  "🔍 APP DEBUG - EXPO_PUBLIC_SUPABASE_URL:",
  process.env.EXPO_PUBLIC_SUPABASE_URL
);
console.log(
  "🔍 APP DEBUG - 所有環境變數:",
  Object.keys(process.env).filter((key) => key.startsWith("EXPO_PUBLIC"))
);
console.log("🔍 APP DEBUG - 強制重新部署觸發器 - DEV 環境調試");
console.log("🚨🚨🚨 環境變數調試結束 🚨🚨🚨");

// 添加更明顯的調試資訊
// Use environment helper to get actual environment (with defaults)
const actualEnv = getCurrentEnvironment();
console.log("🔥🔥🔥 TESTFLIGHT DEBUG START 🔥🔥🔥");
console.log("🔥 CURRENT ENVIRONMENT:", actualEnv || "NOT SET");
console.log(
  "🔥 SUPABASE URL DEV:",
  process.env.EXPO_PUBLIC_SUPABASE_URL_DEV || "NOT SET"
);
console.log(
  "🔥 SUPABASE URL STAGING:",
  process.env.EXPO_PUBLIC_SUPABASE_URL_STAGING || "NOT SET"
);
console.log(
  "🔥 SUPABASE URL:",
  process.env.EXPO_PUBLIC_SUPABASE_URL || "NOT SET"
);
console.log("🔥🔥🔥 TESTFLIGHT DEBUG END 🔥🔥🔥");
import Svg, { Path, Circle, Rect, Line, Ellipse } from "react-native-svg";
import ReactGA from "react-ga4";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
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
    let appScheme =
      envScheme ||
      (window.location.hostname.includes("to-do-staging.vercel.app")
        ? "too-doo-list-staging"
        : "too-doo-list");

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
        "🚨 [IMMEDIATE] OAuth callback might be from native app, preparing redirect..."
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
              '<div style="font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;"><div style="font-size: 20px; margin-bottom: 20px;">Login successful!</div><div style="font-size: 16px; color: #666;">Please return to the To Do app.</div></div>';
          }, 100);
        } catch (e) {
          console.log(
            "🚨 [IMMEDIATE] Redirect failed, treating as web OAuth:",
            e
          );
          // If redirect fails, it's probably pure web OAuth, let normal flow handle it
        }
      }
    } else {
      console.log(
        "🚨 [IMMEDIATE] OAuth callback detected on web (pure web OAuth), letting normal flow handle it..."
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
    logout: "Log out",
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
    logout: "Log out",
    deleteConfirm: "Are you sure you want to delete this task?",
    done: "Done",
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
    logoutSuccess: "Successfully logged out!",
    alreadyLoggedOut: "You are already logged out.",
    logoutError: "Failed to log out. Please try again.",
    accountType: "Account Type",
    deleteAccount: "Delete Account",
    deleteAccountConfirm:
      "Are you sure you want to delete your account? This action cannot be undone. All your tasks and data will be permanently deleted.",
    deleteAccountError: "Failed to delete account. Please try again.",
    deleteAccountSuccess: "Account deleted successfully",
    // Terms of Use translations
    termsTitle: "Terms of Use",
    termsLastUpdated: "Last updated:",
    termsAcceptance: "1. Acceptance of Terms",
    termsAcceptanceText:
      'Welcome to To Do ("we," "our company," or "the Service Provider"). By accessing, downloading, installing, or using our task management application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree to any part of these terms, please discontinue use of the Service immediately.',
    termsDescription: "2. Service Description",
    termsDescriptionText:
      "To Do is a comprehensive personal task management application designed to help users effectively organize and manage their daily tasks and schedules. Our Service provides the following key features:\n• Task creation, editing, and deletion\n• Calendar integration and task scheduling\n• Google Single Sign-On (SSO) authentication\n• Cross-device data synchronization\n• Task reminder notifications\n• Personalized settings and preference management\n• Secure cloud storage and backup",
    termsAccounts: "3. User Accounts and Authentication",
    termsAccountsText:
      "Account Creation:\n• You must create an account using Google Single Sign-On (SSO)\n• You must be at least 13 years old to use this Service\n• You agree to provide accurate, complete, and truthful information\n• You are responsible for maintaining the security of your account\n\nAccount Responsibilities:\n• You are responsible for maintaining the confidentiality of your account credentials\n• You are fully responsible for all activities that occur under your account\n• You must immediately notify us of any unauthorized use of your account\n• You may not transfer your account to any third party\n• You must comply with all applicable laws and regulations",
    termsContent: "4. User Content and Data Ownership",
    termsContentText:
      "Content Ownership:\n• You retain complete ownership of all content you create within the App\n• This includes, but is not limited to, task titles, descriptions, notes, links, and attachments\n• You maintain all intellectual property rights to your content\n\nData Usage:\n• You are solely responsible for your content and data\n• We do not claim ownership of your personal tasks or information\n• You grant us necessary technical permissions to provide the Service\n• We will not use your personal content for commercial purposes\n• We respect your privacy and data protection rights",
    termsAcceptableUse: "5. Acceptable Use Policy",
    termsAcceptableUseText:
      "You agree not to:\n• Use the Service for any unlawful purpose or in violation of any applicable laws\n• Attempt to gain unauthorized access to the App or its related systems\n• Interfere with, disrupt, or damage the normal operation of the Service\n• Create, upload, or share harmful, offensive, discriminatory, or rights-violating content\n• Engage in any activities that may compromise the security of the Service\n• Use automated tools or bots to access the Service\n• Reverse engineer, decompile, or disassemble the App\n• Violate any third-party rights or intellectual property laws",
    termsPrivacy: "6. Privacy and Data Protection",
    termsPrivacyText:
      "We take your privacy seriously. Our data processing practices are governed by our Privacy Policy, which provides detailed information about how we collect, use, store, and protect your personal information.\n\nImportant Points:\n• Please carefully review our Privacy Policy\n• By using the Service, you consent to our data processing practices\n• We implement industry-standard security measures to protect your data\n• You have the right to control your personal information\n• We comply with applicable data protection laws and regulations",
    termsAvailability: "7. Service Availability and Maintenance",
    termsAvailabilityText:
      "Service Commitment:\n• We strive to provide a stable and reliable service experience\n• However, we cannot guarantee absolute uninterrupted service\n• We maintain high availability standards and monitor our systems continuously\n\nMaintenance and Updates:\n• We may perform scheduled maintenance that temporarily affects service\n• We reserve the right to modify, suspend, or discontinue the Service at any time\n• We will provide advance notice of significant changes when possible\n• We schedule maintenance during off-peak hours whenever possible\n• We regularly update the Service to improve functionality and security",
    termsLiability: "8. Limitation of Liability and Disclaimers",
    termsLiabilityText:
      "Disclaimers:\n• The Service is provided 'as is' without warranties of any kind, express or implied\n• We do not guarantee error-free, uninterrupted, or completely secure service\n• We disclaim all warranties regarding merchantability, fitness for a particular purpose, and non-infringement\n\nLimitation of Liability:\n• To the maximum extent permitted by law, we shall not be liable for:\n  - Direct, indirect, incidental, or consequential damages\n  - Any losses resulting from use or inability to use the Service\n  - Data loss, business interruption, or other commercial losses\n  - Damages exceeding the amount paid for the Service in the past 12 months",
    termsChanges: "9. Modifications to Terms",
    termsChangesText:
      "Right to Modify:\n• We reserve the right to modify these Terms of Use at any time\n• Significant changes will be communicated through in-app notifications or email\n• Modified terms will take effect immediately upon posting\n• We will provide at least 30 days' notice for material changes\n\nAcceptance of Changes:\n• Your continued use of the Service constitutes acceptance of modified terms\n• If you disagree with the changes, please discontinue use and delete your account\n• We recommend reviewing these terms periodically to stay informed of updates\n• You can access the current terms at any time through the App",
    termsContact: "10. Contact Information and Dispute Resolution",
    termsContactText:
      "Technical Support:\n• For technical issues, please contact us through the in-app support feature\n• We will respond to your inquiries within a reasonable timeframe\n• Support is available during business hours (Monday-Friday, 9 AM - 6 PM)\n\nDispute Resolution:\n• We encourage resolving disputes through friendly negotiation\n• These terms are governed by the laws of the jurisdiction where our company is incorporated\n• Any legal proceedings should be brought in the appropriate courts\n• We are committed to fair and transparent dispute resolution processes",
    termsAcknowledgment:
      "Thank you for choosing To Do. By using our Service, you acknowledge that you have thoroughly read, understood, and agree to be bound by these Terms of Use. We are committed to providing you with an excellent task management experience.",
    // Privacy Policy translations
    privacyTitle: "Privacy Policy",
    privacyLastUpdated: "Last updated:",
    privacyIntroduction: "1. Policy Overview",
    privacyIntroductionText:
      'To Do ("we," "our company," or "the Service Provider") recognizes the importance of personal privacy and is committed to protecting the security of your personal data. This Privacy Policy provides detailed information about how we collect, use, store, protect, and share your personal information when you use the To Do task management application.\n\nWe are committed to complying with relevant laws and regulations, including data protection laws, to ensure your privacy rights are fully protected.',
    privacyInformation: "2. Types of Personal Data We Collect",
    privacyAccountInfo: "Account-Related Data:",
    privacyAccountInfoText:
      "Basic Account Information:\n• Email address (obtained through Google SSO)\n• Display name (customizable)\n• Profile picture (if provided by Google account)\n• Account creation time and last login time\n\nTask Management Data:\n• Task titles, descriptions, and detailed content\n• Task due dates and reminder times\n• Task categories, priorities, and tags\n• Task links and attachment information\n• Task completion status and history\n\nUsage Behavior Data:\n• Application usage frequency and patterns\n• Feature usage preferences and settings\n• Device information and operating system version\n• Error reports and performance data (anonymized)",
    privacyUse: "3. Purposes and Legal Basis for Data Processing",
    privacyUseText:
      "We use your personal data for the following purposes:\n\nService Provision:\n• Provide core task management functionality\n• Sync your task data across devices\n• Send task reminder notifications\n• Maintain and improve service quality\n\nTechnical Support:\n• Diagnose and resolve technical issues\n• Provide customer service and technical support\n• Conduct system maintenance and updates\n\nSecurity Protection:\n• Prevent unauthorized access\n• Detect and prevent fraudulent activities\n• Protect system and data security\n\nLegal Basis:\n• Based on your explicit consent\n• To fulfill our service contract with you\n• To comply with legal obligations\n• To protect our legitimate interests",
    privacyStorage: "4. Data Storage and Security Protection Measures",
    privacyStorageText:
      "Data Storage:\n• Secure storage using Supabase cloud infrastructure\n• Data distributed across multiple geographic locations\n• Regular data backup and disaster recovery testing\n• Redundant systems to ensure data availability\n\nSecurity Measures:\n• Industry-standard encryption technology (AES-256)\n• Data transmission encrypted using TLS 1.3\n• Multi-layered access control and authentication\n• Regular security vulnerability scans and penetration testing\n• Comprehensive data access logging and monitoring systems\n• Regular security audits and compliance assessments\n\nPersonnel Management:\n• Only authorized personnel can access personal data\n• All employees sign confidentiality agreements\n• Regular privacy protection training\n• Established data processing standard operating procedures",
    privacySharing: "5. Data Sharing and Third-Party Disclosure",
    privacySharingText:
      "We commit not to sell, rent, or trade your personal data. We only share your data in the following circumstances:\n\nWith Your Consent:\n• When you have given explicit consent\n• You may withdraw consent at any time\n• Clear opt-in mechanisms for data sharing\n\nLegal Requirements:\n• To comply with court orders or legal requirements\n• To cooperate with government investigations\n• To protect our legitimate rights and interests\n• To respond to valid legal requests\n\nService Providers:\n• Collaborate with trusted third-party service providers (such as Google, Supabase)\n• Sign strict data protection agreements\n• Ensure third parties follow the same privacy protection standards\n• Regularly review third-party compliance\n• Maintain oversight of data processing activities\n\nEmergency Situations:\n• To protect your life or the lives of others\n• To prevent significant harm from occurring\n• To respond to public health emergencies",
    privacyThirdParty: "6. Third-Party Service Integration",
    privacyThirdPartyText:
      "This application integrates the following third-party services:\n\nGoogle Services:\n• Google Single Sign-On (SSO) authentication\n• Used for identity verification and account management\n• Subject to Google's Privacy Policy\n• Limited data sharing for authentication purposes\n\nSupabase Platform:\n• Cloud database and backend services\n• Provides secure data storage and API services\n• Subject to Supabase's data protection policy\n• Encrypted data transmission and storage\n\nImportant Reminders:\n• These third-party services have their own privacy policies\n• We encourage you to review the relevant policies\n• We regularly review third-party service compliance\n• We take immediate appropriate action if security issues are discovered\n• We maintain contracts that require data protection standards",
    privacyRights: "7. Your Privacy Rights",
    privacyRightsText:
      "Under applicable laws and regulations, you have the following rights:\n\nRight of Access:\n• Request information about the personal data we hold about you\n• Understand the purposes and methods of data processing\n• Obtain information about data processing activities\n• Receive a copy of your personal data\n\nRight of Rectification:\n• Request correction of inaccurate personal data\n• Request completion of incomplete personal data\n• Modify some data through app settings\n• Update your profile information\n\nRight of Erasure:\n• Request deletion of your personal data\n• Delete your account and associated data\n• Request restriction of data processing in specific circumstances\n• Right to be forgotten\n\nRight of Data Portability:\n• Request your data in a structured format\n• Transfer data to other service providers\n• Download backup of your task data\n• Export your data in common formats\n\nRight to Withdraw Consent:\n• Withdraw consent for data processing at any time\n• Stop receiving certain types of notifications\n• Adjust privacy setting preferences\n• Opt out of marketing communications",
    privacyRetention: "8. Data Retention Periods",
    privacyRetentionText:
      "We retain your personal data according to the following principles:\n\nDuring Account Active Period:\n• Retain data continuously while your account is active\n• Used for service provision and technical support\n• Maintain service quality and security\n• Support account recovery if needed\n\nAfter Account Deletion:\n• Immediately delete personally identifiable data\n• Anonymized statistical data may be retained for analysis\n• Legal requirement exceptions apply\n• Complete data removal within 30 days\n\nSpecial Circumstances:\n• May extend retention during legal proceedings\n• May extend retention during security incident investigations\n• Maximum retention not exceeding 7 years (legal requirement limit)\n• Compliance with regulatory requirements\n\nData Destruction:\n• Use secure deletion technology\n• Ensure data cannot be recovered\n• Regular verification of deletion effectiveness\n• Certificate of data destruction when required",
    privacyChildren: "9. Children's Privacy Protection",
    privacyChildrenText:
      "Age Restrictions:\n• This service is not intended for children under 13\n• We do not knowingly collect personal data from children under 13\n• We immediately delete any such data if discovered\n• Age verification mechanisms in place\n\nParental Supervision:\n• We recommend parental supervision of minor children using this service\n• Please contact us immediately if you discover inappropriate use\n• We will cooperate with parents for appropriate handling\n• Parental consent required for users under 16\n\nSpecial Protection:\n• More cautious data processing for minors\n• Additional privacy protection measures\n• Regular policy reviews\n• Enhanced security for minor accounts\n• Educational resources for parents",
    privacyInternational: "10. International Data Transfers",
    privacyInternationalText:
      "Transfer Scope:\n• Your data may be transferred to regions outside your country\n• Primarily for cloud services and technical support\n• Follow international data protection standards\n• Limited to necessary service operations\n\nProtection Measures:\n• Sign data protection agreements with recipients\n• Ensure appropriate technical and organizational measures\n• Regular assessment of transfer security\n• Compliance with relevant international regulations\n• Standard Contractual Clauses where applicable\n\nYour Rights:\n• Request information about data transfer details\n• Request restrictions on international transfers\n• Withdraw consent for transfers at any time\n• Object to transfers based on legitimate interests",
    privacyChanges: "11. Policy Updates and Notifications",
    privacyChangesText:
      "Update Process:\n• We regularly review and update this Privacy Policy\n• Significant changes will be announced 30 days in advance\n• Notify through in-app notifications or email\n• Update date displayed at the top of the policy\n• Version control and change tracking\n\nTypes of Changes:\n• Addition of new data collection types\n• Modification of data use purposes\n• Updates to security protection measures\n• Adjustments to your rights content\n• Changes in legal requirements\n\nAcceptance of Changes:\n• Continued use of the service constitutes acceptance of the new policy\n• If you disagree with changes, you may discontinue use and delete your account\n• We recommend reviewing the latest policy content regularly\n• Clear communication about material changes\n• Easy access to previous versions",
    privacyContact: "12. Contact Us and Complaint Channels",
    privacyContactText:
      "Privacy Inquiries:\n• In-app support feature\n• Email: privacy@todo-app.com\n• We will respond within 7 business days\n• Dedicated privacy officer contact\n\nData Protection Complaints:\n• Submit complaints if you have concerns about data processing\n• We take every complaint seriously\n• Provide clear processing results and explanations\n• Escalation procedures for unresolved issues\n\nRegulatory Authorities:\n• Contact relevant supervisory authorities if dissatisfied with our response\n• Data Protection Authority in your jurisdiction\n• Legal remedies available\n• Independent dispute resolution mechanisms",
    privacyAcknowledgment:
      "Thank you for trusting To Do. We are committed to continuously improving our privacy protection measures to provide you with secure and reliable task management services. If you have any privacy-related questions, please don't hesitate to contact us.",
    googleAccount: "Google Account",
    signInWithGoogle: "Sign in with Google",
    signInWithApple: "Sign in with Apple",
    appleAccount: "Apple Account",
    logout: "Log out",
    selectTime: "Select Time",
    hour: "Hour",
    minute: "Min",
    done: "Done",
    time: "Time",
    today: "Today",
    taskReminder: "Task Reminder",
    // 不同时间点的通知文字
    reminder30minTitle: "Task Starting Soon",
    reminder30minBody: "Your task is starting in 30 minutes",
    reminder10minTitle: "Task Starting Soon",
    reminder10minBody: "Your task is starting in 10 minutes",
    reminder5minTitle: "Task Starting Soon",
    reminder5minBody: "Your task is starting in 5 minutes",
    notificationPermission: "Notification Permission",
    notificationPermissionMessage:
      "To Do needs notification permission to remind you about your tasks 30 minutes before they're due.",
    enableNotifications: "Enable Notifications",
    notLater: "Not Now",
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    appearance: "Appearance",
    byContinuing: "By continuing, you agree to our",
    and: "and",
    // Reminder settings
    reminderSettings: "Reminder",
    reminder30min: "30 minutes before",
    reminder10min: "10 minutes before",
    reminder5min: "5 minutes before",
    reminderEnabled: "Enable",
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
    deleteAccount: "刪除帳號",
    deleteAccountConfirm:
      "您確定要刪除帳號嗎？此操作無法復原。您的所有任務和資料將被永久刪除。",
    deleteAccountError: "刪除帳號失敗。請再試一次。",
    deleteAccountSuccess: "帳號已成功刪除",
    // Terms of Use translations
    termsTitle: "使用條款",
    termsLastUpdated: "最後更新：",
    termsAcceptance: "1. 條款接受",
    termsAcceptanceText:
      "歡迎使用 To Do（「我們」、「本公司」或「服務提供者」）。當您訪問、下載、安裝或使用本應用程式時，即表示您已閱讀、理解並同意受本使用條款的約束。如果您不同意本條款的任何部分，請立即停止使用本服務。",
    termsDescription: "2. 服務描述",
    termsDescriptionText:
      "To Do 是一款個人任務管理應用程式，旨在幫助用戶有效組織和管理日常任務。本服務提供以下主要功能：\n• 任務創建、編輯和刪除\n• 日曆整合與任務排程\n• Google 單一登入（SSO）認證\n• 跨裝置資料同步\n• 任務提醒通知\n• 個人化設定與偏好管理",
    termsAccounts: "3. 用戶帳號與認證",
    termsAccountsText:
      "帳號創建：\n• 您必須透過 Google 單一登入（SSO）創建帳號\n• 您必須年滿 13 歲才能使用本服務\n• 您同意提供真實、準確且完整的個人資訊\n\n帳號責任：\n• 您有責任維護帳號密碼的機密性\n• 您對帳號下發生的所有活動負完全責任\n• 如發現未經授權使用您的帳號，請立即通知我們\n• 您不得將帳號轉讓給第三方",
    termsContent: "4. 用戶內容與資料所有權",
    termsContentText:
      "內容所有權：\n• 您保留對在應用程式中創建的所有內容的完整所有權\n• 包括但不限於任務標題、描述、備註、連結等\n\n資料使用：\n• 您對自己的內容和資料負完全責任\n• 我們不會聲稱擁有您的個人任務或資訊的所有權\n• 您授予我們提供服務所需的必要技術權限\n• 我們不會將您的個人內容用於商業目的",
    termsAcceptableUse: "5. 可接受的使用政策",
    termsAcceptableUseText:
      "您同意不會：\n• 將本服務用於任何非法目的或違反任何適用法律\n• 嘗試未經授權存取本應用程式或其相關系統\n• 干擾、破壞或損害本服務的正常運作\n• 創建、上傳或分享有害、冒犯性、歧視性或侵犯他人權利的內容\n• 進行任何可能損害服務安全性的活動\n• 使用自動化工具或機器人存取本服務",
    termsPrivacy: "6. 隱私與資料保護",
    termsPrivacyText:
      "我們高度重視您的隱私權。本服務的資料處理遵循我們的隱私政策，該政策詳細說明我們如何收集、使用、儲存和保護您的個人資訊。\n\n重要提醒：\n• 請仔細閱讀我們的隱私政策\n• 使用本服務即表示您同意我們的資料處理方式\n• 我們採用業界標準的安全措施保護您的資料\n• 您有權控制自己的個人資料",
    termsAvailability: "7. 服務可用性與維護",
    termsAvailabilityText:
      "服務承諾：\n• 我們致力於提供穩定可靠的服務體驗\n• 但無法保證服務的絕對不間斷性\n\n維護與更新：\n• 我們可能會進行定期維護，期間可能暫時影響服務\n• 我們保留隨時修改、暫停或終止服務的權利\n• 重大變更將提前通知用戶\n• 我們會盡力將維護時間安排在非高峰時段",
    termsLiability: "8. 責任限制與免責聲明",
    termsLiabilityText:
      "免責聲明：\n• 本服務按「現狀」提供，不提供任何明示或暗示的保證\n• 我們不保證服務的無錯誤性、不間斷性或完全安全性\n\n責任限制：\n• 在法律允許的最大範圍內，我們不對以下損害承擔責任：\n  - 直接、間接、偶然或後果性損害\n  - 因使用或無法使用本服務而造成的任何損失\n  - 資料遺失、業務中斷或其他商業損失",
    termsChanges: "9. 條款修改",
    termsChangesText:
      "修改權利：\n• 我們保留隨時修改本使用條款的權利\n• 重大修改將透過應用程式內通知或電子郵件告知\n• 修改後的條款將在發布後立即生效\n\n接受修改：\n• 您繼續使用本服務即表示接受修改後的條款\n• 如不同意修改內容，請停止使用本服務並刪除帳號\n• 建議您定期查看本條款以了解最新變更",
    termsContact: "10. 聯絡資訊與爭議解決",
    termsContactText:
      "技術支援：\n• 如遇技術問題，請透過應用程式內支援功能聯繫我們\n• 我們將在合理時間內回應您的詢問\n\n爭議解決：\n• 如發生爭議，我們鼓勵透過友好協商解決\n• 本條款受中華民國法律管轄\n• 任何法律訴訟應向有管轄權的法院提起",
    termsAcknowledgment:
      "感謝您選擇 To Do。透過使用本服務，您確認已充分閱讀、理解並同意受本使用條款的約束。我們承諾為您提供優質的任務管理服務體驗。",
    // Privacy Policy translations
    privacyTitle: "隱私政策",
    privacyLastUpdated: "最後更新：",
    privacyIntroduction: "1. 政策概述",
    privacyIntroductionText:
      "To Do（「我們」、「本公司」或「服務提供者」）深知個人隱私的重要性，並致力於保護您的個人資料安全。本隱私政策詳細說明我們如何收集、使用、儲存、保護和分享您在使用 To Do 任務管理應用程式時提供的個人資訊。\n\n我們承諾遵循相關法律法規，包括《個人資料保護法》等，確保您的隱私權得到充分保護。",
    privacyInformation: "2. 我們收集的個人資料類型",
    privacyAccountInfo: "帳號相關資料：",
    privacyAccountInfoText:
      "基本帳號資訊：\n• 電子郵件地址（透過 Google SSO 取得）\n• 顯示名稱（可自訂）\n• 個人資料圖片（如 Google 帳號提供）\n• 帳號創建時間和最後登入時間\n\n任務管理資料：\n• 任務標題、描述和詳細內容\n• 任務截止日期和提醒時間\n• 任務分類、優先級和標籤\n• 任務連結和附件資訊\n• 任務完成狀態和歷史記錄\n\n使用行為資料：\n• 應用程式使用頻率和模式\n• 功能使用偏好和設定\n• 裝置資訊和作業系統版本\n• 錯誤報告和效能資料（匿名化）",
    privacyUse: "3. 個人資料使用目的與法律依據",
    privacyUseText:
      "我們使用您的個人資料用於以下目的：\n\n服務提供：\n• 提供任務管理核心功能\n• 跨裝置同步您的任務資料\n• 發送任務提醒通知\n• 維護和改善服務品質\n\n技術支援：\n• 診斷和解決技術問題\n• 提供客戶服務和技術支援\n• 進行系統維護和更新\n\n安全防護：\n• 防止未經授權的存取\n• 偵測和防範詐欺行為\n• 保護系統和資料安全\n\n法律依據：\n• 基於您的明確同意\n• 為履行與您的服務合約\n• 為遵守法律義務\n• 為保護我們的合法權益",
    privacyStorage: "4. 資料儲存與安全保護措施",
    privacyStorageText:
      "資料儲存：\n• 使用 Supabase 雲端基礎設施進行安全儲存\n• 資料分散儲存在多個地理位置\n• 定期進行資料備份和災難恢復測試\n\n安全措施：\n• 採用業界標準的加密技術（AES-256）\n• 資料傳輸使用 TLS 1.3 加密\n• 實施多層次存取控制和身份驗證\n• 定期進行安全漏洞掃描和滲透測試\n• 建立完整的資料存取日誌和監控系統\n\n人員管理：\n• 僅授權必要人員可存取個人資料\n• 所有員工簽署保密協議\n• 定期進行隱私保護培訓\n• 建立資料處理標準作業程序",
    privacySharing: "5. 資料分享與第三方揭露",
    privacySharingText:
      "我們承諾不會出售、出租或交易您的個人資料。我們僅在以下情況下分享您的資料：\n\n經您同意：\n• 在您明確同意的情況下\n• 您可隨時撤回同意\n\n法律要求：\n• 為遵守法院命令或法律規定\n• 為配合政府機關調查\n• 為保護我們的合法權益\n\n服務提供者：\n• 與可信賴的第三方服務商合作（如 Google、Supabase）\n• 簽署嚴格的資料保護協議\n• 確保第三方遵循相同的隱私保護標準\n• 定期審查第三方合規狀況\n\n緊急情況：\n• 為保護您或他人的生命安全\n• 為防止重大損害發生",
    privacyThirdParty: "6. 第三方服務整合",
    privacyThirdPartyText:
      "本應用程式整合以下第三方服務：\n\nGoogle 服務：\n• Google 單一登入（SSO）認證\n• 用於身份驗證和帳號管理\n• 遵循 Google 隱私政策\n\nSupabase 平台：\n• 雲端資料庫和後端服務\n• 提供安全的資料儲存和 API 服務\n• 遵循 Supabase 資料保護政策\n\n重要提醒：\n• 這些第三方服務有其獨立的隱私政策\n• 建議您詳細閱讀相關政策\n• 我們會定期審查第三方服務的合規性\n• 如發現安全問題，我們會立即採取適當措施",
    privacyRights: "7. 您的隱私權利",
    privacyRightsText:
      "根據相關法律法規，您享有以下權利：\n\n資料存取權：\n• 查詢我們持有的您的個人資料\n• 了解資料處理的目的和方式\n• 取得資料處理的相關資訊\n\n資料更正權：\n• 要求更正不正確的個人資料\n• 要求補充不完整的個人資料\n• 透過應用程式設定自行修改部分資料\n\n資料刪除權：\n• 要求刪除您的個人資料\n• 刪除您的帳號和相關資料\n• 在特定情況下要求限制資料處理\n\n資料可攜權：\n• 要求以結構化格式取得您的資料\n• 將資料轉移至其他服務提供者\n• 下載您的任務資料備份\n\n同意撤回權：\n• 隨時撤回對資料處理的同意\n• 停止接收特定類型的通知\n• 調整隱私設定偏好",
    privacyRetention: "8. 資料保留期限",
    privacyRetentionText:
      "我們根據以下原則保留您的個人資料：\n\n帳號存續期間：\n• 在您的帳號有效期間持續保留\n• 用於提供服務和技術支援\n• 維護服務品質和安全性\n\n帳號刪除後：\n• 立即刪除個人識別資料\n• 匿名化統計資料可保留用於分析\n• 法律要求保留的資料除外\n\n特殊情況：\n• 法律訴訟期間可能延長保留\n• 安全事件調查期間可能延長保留\n• 最多不超過 7 年（法律要求上限）\n\n資料銷毀：\n• 使用安全刪除技術\n• 確保資料無法復原\n• 定期檢查刪除效果",
    privacyChildren: "9. 未成年人隱私保護",
    privacyChildrenText:
      "年齡限制：\n• 本服務不適用於 13 歲以下的兒童\n• 我們不會故意收集 13 歲以下兒童的個人資料\n• 如發現此類情況，我們會立即刪除相關資料\n\n家長監護：\n• 建議家長監督未成年子女使用本服務\n• 如發現不當使用，請立即聯繫我們\n• 我們會配合家長進行適當處理\n\n特殊保護：\n• 對未成年人的資料處理更加謹慎\n• 提供額外的隱私保護措施\n• 定期審查相關政策",
    privacyInternational: "10. 國際資料傳輸",
    privacyInternationalText:
      "傳輸範圍：\n• 您的資料可能傳輸至台灣以外的地區\n• 主要用於雲端服務和技術支援\n• 遵循國際資料保護標準\n\n保護措施：\n• 與接收方簽署資料保護協議\n• 確保適當的技術和組織措施\n• 定期評估傳輸安全性\n• 遵守相關國際法規\n\n您的權利：\n• 可要求了解資料傳輸詳情\n• 可要求限制國際傳輸\n• 可隨時撤回傳輸同意",
    privacyChanges: "11. 政策更新與通知",
    privacyChangesText:
      "更新程序：\n• 我們會定期審查和更新本隱私政策\n• 重大變更會提前 30 天通知\n• 透過應用程式內通知或電子郵件告知\n• 更新日期會顯示在政策頂部\n\n變更類型：\n• 新增資料收集類型\n• 修改資料使用目的\n• 更新安全保護措施\n• 調整您的權利內容\n\n接受變更：\n• 繼續使用服務即表示接受新政策\n• 如不同意變更，可停止使用並刪除帳號\n• 建議定期查看最新政策內容",
    privacyContact: "12. 聯絡我們與申訴管道",
    privacyContactText:
      "隱私問題諮詢：\n• 應用程式內支援功能\n• 電子郵件：privacy@todo-app.com\n• 我們會在 7 個工作天內回覆\n\n資料保護申訴：\n• 如對資料處理有疑慮，可提出申訴\n• 我們會認真處理每件申訴\n• 提供明確的處理結果和說明\n\n監管機關：\n• 如對處理結果不滿，可向主管機關申訴\n• 台灣個人資料保護委員會\n• 相關法律救濟管道",
    privacyAcknowledgment:
      "感謝您信任 To Do。我們承諾持續改進隱私保護措施，為您提供安全可靠的任務管理服務。如有任何隱私相關問題，請隨時與我們聯繫。",
    googleAccount: "Google 帳號",
    signInWithGoogle: "使用 Google 登入",
    signInWithApple: "使用 Apple 登入",
    appleAccount: "Apple 帳號",
    logout: "登出",
    selectTime: "選擇時間",
    hour: "時",
    minute: "分",
    done: "完成",
    time: "時間",
    today: "今天",
    taskReminder: "任務提醒",
    // 不同時間點的通知文字
    reminder30minTitle: "任務即將開始",
    reminder30minBody: "您的任務將在 30 分鐘後開始",
    reminder10minTitle: "任務即將開始",
    reminder10minBody: "您的任務將在 10 分鐘後開始",
    reminder5minTitle: "任務即將開始",
    reminder5minBody: "您的任務將在 5 分鐘後開始",
    notificationPermission: "通知權限",
    notificationPermissionMessage:
      "To Do 需要通知權限才能在任務開始前 30 分鐘提醒您。",
    enableNotifications: "啟用通知",
    notLater: "暫不啟用",
    theme: "主題",
    lightMode: "淺色模式",
    darkMode: "深色模式",
    appearance: "外觀",
    byContinuing: "繼續使用即表示您同意我們的",
    and: "和",
    // 提醒設定
    reminderSettings: "提醒",
    reminder30min: "30分鐘前",
    reminder10min: "10分鐘前",
    reminder5min: "5分鐘前",
    reminderEnabled: "啟用",
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
            error
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
            "OAuth callback: Not on web platform, skipping callback handling"
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
            "OAuth callback: Detected native app OAuth flow, preparing redirect..."
          );

          // Determine the correct URL scheme based on environment/domain
          const envScheme = process.env.NEXT_PUBLIC_APP_SCHEME;
          let appScheme =
            envScheme ||
            (window.location.hostname.includes("to-do-staging.vercel.app")
              ? "too-doo-list-staging"
              : "too-doo-list");

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
              redirectUrl
            );
            try {
              window.location.href = redirectUrl;
              // Show user message after attempting redirect
              setTimeout(() => {
                alert(
                  "Please return to the To Do app. The login was successful!"
                );
              }, 1000);
              return;
            } catch (redirectError) {
              console.error(
                "OAuth callback: Failed to redirect to native app:",
                redirectError
              );
            }
          }
        } else if (hasOAuthParams) {
          // This is a pure web OAuth callback - process it directly
          console.log(
            "OAuth callback: Pure web OAuth detected, processing directly..."
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
                  exchangeError
                );
              } else if (sessionData?.session) {
                console.log(
                  "OAuth callback: ✅ Session established successfully!"
                );
                // Clear URL params and navigate
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname
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
                    window.location.pathname
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
              userError
            );
            return;
          }

          console.log("OAuth callback: User verified, navigating to main app");
          navigateToMainApp();
        } else {
          console.log("OAuth callback: No session found in callback");

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
      console.log("📍 [navigateToMainApp] Function called");

      if (hasNavigated) {
        console.log("📍 [navigateToMainApp] ⚠️ Already navigated, skipping");
        return;
      }

      if (!navigation) {
        console.error(
          "📍 [navigateToMainApp] ❌ Navigation object is not available"
        );
        return;
      }

      console.log(
        "📍 [navigateToMainApp] Navigation object exists, attempting reset..."
      );

      try {
        setHasNavigated(true);
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
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
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
              platform: Platform.OS,
            });
            mixpanelService.track("User Signed In", {
              method: event === "SIGNED_IN" ? "new_signin" : "existing_session",
              email: user.email,
              platform: Platform.OS,
            });

            // 重置登入狀態
            setIsSigningIn(false);
            setIsAppleSigningIn(false);

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

            console.log("🚀 Navigating to main app...");
            // Check if already navigated to prevent double navigation
            if (!hasNavigated) {
              navigateToMainApp();
            } else {
              console.log("⚠️ Navigation skipped - already navigated");
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

          console.log("[checkSession] User verified:", {
            id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
          });
          console.log("[checkSession] Navigating to main app...");
          // Check if already navigated to prevent double navigation
          if (!hasNavigated) {
            navigateToMainApp();
          } else {
            console.log(
              "⚠️ [checkSession] Navigation skipped - already navigated"
            );
          }
        } else {
          console.log(
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
                "🔗🔗🔗 [App.js Deep Link] No parameters found in URL"
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
                params.get("error_description") || error
              );
              return;
            }

            if (code) {
              // PKCE flow - exchange code for session
              console.log(
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

              console.log(
                "🔗🔗🔗 [App.js Deep Link] ✅ Code exchanged successfully!"
              );
              console.log(
                "🔗🔗🔗 [App.js Deep Link] Session user:",
                data?.session?.user?.email
              );

              // Wait for session to be fully established and onAuthStateChange to trigger
              // Don't navigate here - let auth state listener handle it
              console.log(
                "🔗🔗🔗 [App.js Deep Link] ⏳ Waiting for auth state listener to navigate..."
              );
              console.log(
                "🔗🔗🔗 [App.js Deep Link] (SIGNED_IN event should trigger navigation)"
              );

              // Wait a moment for onAuthStateChange to fire
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Fallback: If navigation hasn't happened after 2 seconds, navigate manually
              setTimeout(() => {
                if (!hasNavigated) {
                  console.log(
                    "🔗🔗🔗 [App.js Deep Link] Fallback: Navigating to main app..."
                  );
                  navigateToMainApp();
                }
              }, 2000);
            } else if (accessToken && refreshToken) {
              // Direct token flow
              console.log(
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

              console.log(
                "🔗🔗🔗 [App.js Deep Link] ✅ Session set successfully!"
              );

              // Wait for session to be fully established and onAuthStateChange to trigger
              // Don't navigate here - let auth state listener handle it
              console.log(
                "🔗🔗🔗 [App.js Deep Link] ⏳ Waiting for auth state listener to navigate..."
              );
              console.log(
                "🔗🔗🔗 [App.js Deep Link] (SIGNED_IN event should trigger navigation)"
              );

              // Wait a moment for onAuthStateChange to fire
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Fallback: If navigation hasn't happened after 2 seconds, navigate manually
              setTimeout(() => {
                if (!hasNavigated) {
                  console.log(
                    "🔗🔗🔗 [App.js Deep Link] Fallback: Navigating to main app..."
                  );
                  navigateToMainApp();
                }
              }, 2000);
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
          console.log(
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
          console.log("Initial URL is an auth callback:", url.href);
          console.log(
            "OAuth callback already handled at module level, skipping"
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
                error
              );
            } else if (session) {
              console.log(
                `Mobile: Session found on attempt ${attempt}, navigating to main app`
              );
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              });
              return;
            } else {
              console.log(`No session found on attempt ${attempt}`);
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

        console.log(
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
          navigateToMainApp();
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
            currentEnv
          );
          console.log(
            "🔍 DEBUG - All EXPO_PUBLIC env vars:",
            Object.keys(process.env).filter((key) =>
              key.startsWith("EXPO_PUBLIC")
            )
          );
          console.log(
            "🔍 DEBUG - EXPO_PUBLIC_APP_ENV value:",
            process.env.EXPO_PUBLIC_APP_ENV
          );

          // Get app scheme based on environment
          // Use the same scheme as defined in app.config.js
          const appScheme =
            currentEnv === "production"
              ? "too-doo-list"
              : "too-doo-list-staging";

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
          // For mobile, use AuthSession which handles deep links better
          console.log(
            "VERBOSE: Opening OAuth browser session with AuthSession..."
          );
          console.log("VERBOSE: Redirect URL:", redirectUrl);

          // Use AuthSession.startAsync for better deep link handling
          let result;
          try {
            result = await AuthSession.startAsync({
              authUrl: data.url,
              returnUrl: redirectUrl,
            });

            console.log(
              "VERBOSE: Auth session result:",
              JSON.stringify(result, null, 2)
            );
            console.log("VERBOSE: Result type:", result.type);
            console.log("VERBOSE: Result URL:", result.url);
          } catch (authSessionError) {
            console.log(
              "VERBOSE: AuthSession failed, trying WebBrowser fallback..."
            );
            console.log("VERBOSE: AuthSession error:", authSessionError);

            // Fallback to WebBrowser if AuthSession fails
            result = await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectUrl
            );
            console.log(
              "VERBOSE: WebBrowser result:",
              JSON.stringify(result, null, 2)
            );
          }

          // ✅ KEY FIX: The result.url contains the OAuth callback URL
          // We need to manually process it since iOS doesn't automatically trigger the deep link
          if (result.type === "success" && result.url) {
            console.log(
              "🎯 [CRITICAL] WebBrowser returned with URL, processing manually..."
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
                    params.get("error_description") || error
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
                      exchangeError
                    );
                    Alert.alert(
                      "Authentication Error",
                      "Failed to complete sign in. Please try again."
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
                    "🎯 [CRITICAL] ⏳ Waiting for auth state listener to navigate..."
                  );
                  console.log(
                    "🎯 [CRITICAL] (SIGNED_IN event should trigger navigation)"
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
                      sessionError
                    );
                    Alert.alert(
                      "Authentication Error",
                      "Failed to complete sign in. Please try again."
                    );
                    return;
                  }

                  console.log("🎯 [CRITICAL] ✅ Session set successfully!");

                  // Don't navigate here - let auth state listener handle it
                  console.log(
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
            console.log("VERBOSE: User cancelled the auth flow");
            console.log(
              "VERBOSE: This might be due to deep link not working properly"
            );
            console.log(
              "VERBOSE: Check if Supabase redirect URL includes: too-doo-list://auth/callback"
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
            maxAttempts = 5
          ) => {
            console.log(
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
              console.log(
                `[Auth Fallback] No session found on attempt ${attempt}`
              );

              // Retry if we haven't reached max attempts
              if (attempt < maxAttempts) {
                const delay = 2000 * attempt; // Increasing delay: 2s, 4s, 6s, 8s
                console.log(`[Auth Fallback] Retrying in ${delay}ms...`);
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
              console.log(
                `[Auth Fallback] ✅ Session found on attempt ${attempt}!`
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
        { cancelable: true }
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
        "Sign in with Apple is not available on this device."
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
          JSON.stringify(credential.fullName, null, 2)
        );
      } else {
        console.log(
          "🍎 No fullName in credential (this happens on subsequent logins)"
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
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
            );
            const payload = JSON.parse(jsonPayload);
            console.log("🍎 ID Token payload:", {
              aud: payload.aud,
              iss: payload.iss,
              sub: payload.sub,
            });
            console.log("⚠️ Bundle ID in token (aud):", payload.aud);
            console.log(
              "⚠️ Expected for staging:",
              "com.cty0305.too.doo.list.staging"
            );
            console.log(
              "⚠️ Current EXPO_PUBLIC_APP_ENV:",
              process.env.EXPO_PUBLIC_APP_ENV || "not set"
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
            }), retrying... (${retryCount}/${maxRetries})`
          );
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * retryCount)
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
                  fullName
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
                    JSON.stringify(updateError, null, 2)
                  );
                } else {
                  console.log("✅ User name updated successfully:", fullName);
                  console.log(
                    "Updated user_metadata:",
                    JSON.stringify(updateData?.user?.user_metadata, null, 2)
                  );

                  // Verify the update by fetching the user again
                  try {
                    const { data: verifyData, error: verifyError } =
                      await supabase.auth.getUser();
                    if (verifyError) {
                      console.error(
                        "❌ Error verifying user update:",
                        verifyError
                      );
                    } else {
                      console.log(
                        "🔍 Verification - user_metadata after update:",
                        JSON.stringify(verifyData?.user?.user_metadata, null, 2)
                      );
                      console.log(
                        "🔍 Verification - name:",
                        verifyData?.user?.user_metadata?.name
                      );
                      console.log(
                        "🔍 Verification - display_name:",
                        verifyData?.user?.user_metadata?.display_name
                      );
                    }
                  } catch (verifyErr) {
                    console.warn("⚠️ Could not verify user update:", verifyErr);
                  }

                  // Also update display_name in user_settings table
                  try {
                    await UserService.updateUserSettings({
                      display_name: fullName,
                    });
                    console.log(
                      "✅ display_name synced to user_settings table"
                    );
                  } catch (settingsError) {
                    console.warn(
                      "⚠️ Failed to sync display_name to user_settings:",
                      settingsError
                    );
                  }
                }
              } catch (updateError) {
                console.error("❌ Error updating user name:", updateError);
              }
            } else {
              console.log(
                "ℹ️ User name already exists and matches:",
                existingName
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
                  emailPrefix
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
                    updateError
                  );
                } else {
                  console.log(
                    "✅ Email prefix set as display_name:",
                    emailPrefix
                  );

                  // Also update display_name in user_settings table
                  try {
                    await UserService.updateUserSettings({
                      display_name: emailPrefix,
                    });
                    console.log(
                      "✅ display_name synced to user_settings table"
                    );
                  } catch (settingsError) {
                    console.warn(
                      "⚠️ Failed to sync display_name to user_settings:",
                      settingsError
                    );
                  }
                }
              } catch (updateError) {
                console.error(
                  "❌ Error setting email prefix as name:",
                  updateError
                );
              }
            }
          }
        } else {
          console.log(
            "ℹ️ No fullName from Apple (this is normal for returning users)"
          );
          console.log(
            "Current user_metadata.name:",
            data.user.user_metadata?.name
          );
          console.log(
            "Current user_metadata.display_name:",
            data.user.user_metadata?.display_name
          );

          // If user doesn't have a name yet, set a default from email
          const existingName =
            data.user.user_metadata?.name ||
            data.user.user_metadata?.display_name;

          if (!existingName && data.user.email) {
            const emailPrefix = data.user.email.split("@")[0];
            console.log(
              "🍎 Setting default display_name from email:",
              emailPrefix
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
                    settingsError
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
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState(false);
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

      // Mixpanel: 追蹤登出事件
      mixpanelService.track("User Signed Out", {
        platform: Platform.OS,
      });
      mixpanelService.reset();

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
              {userProfile?.provider === "apple"
                ? t.appleAccount
                : userProfile?.provider === "google"
                ? t.googleAccount
                : t.googleAccount}
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
              <Text style={{ color: theme.text, fontSize: 16 }}>
                {t.language}
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
              <Text style={{ color: theme.text, fontSize: 16 }}>{t.theme}</Text>
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
              <Text style={{ color: theme.text, fontSize: 16 }}>
                {t.reminderSettings}
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

        {/* Log Out, Delete Account and Version Section */}
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
              marginBottom: 12,
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
          <TouchableOpacity
            onPress={() => {
              setDeleteAccountModalVisible(true);
            }}
            style={{
              alignItems: "center",
              marginBottom: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{ color: theme.error, fontSize: 14, fontWeight: "400" }}
            >
              {t.deleteAccount || "Delete Account"}
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              color: theme.textTertiary,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {t.version} {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
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
  const taskTitleInputRef = useRef(null);
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

  // Load tasks from Supabase based on visible range
  useEffect(() => {
    const fetchTasksForVisibleRange = async () => {
      try {
        // 首先檢查用戶認證狀態
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No authenticated user found");
          setTasks({});
          return;
        }

        // Calculate start and end date of the visible month
        // We fetch previous, current, and next month to ensure smooth scrolling
        const startDate = new Date(visibleYear, visibleMonth - 1, 1);
        const endDate = new Date(visibleYear, visibleMonth + 2, 0);

        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");

        console.log(`Fetching tasks from ${startDateStr} to ${endDateStr}`);

        const newTasks = await TaskService.getTasksByDateRange(
          startDateStr,
          endDateStr
        );


        setTasks((prevTasks) => {
          const updatedTasks = {
            ...prevTasks,
            ...newTasks,
          };
          
          // Sync to widget
          widgetService.syncTodayTasks(updatedTasks);
          
          return updatedTasks;
        });
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
    };

    fetchTasksForVisibleRange();
  }, [visibleYear, visibleMonth]);

  // Reset to today when app loads/reloads
  useEffect(() => {
    const today = getCurrentDate();
    const todayDate = new Date(today);
    setSelectedDate(today);
    setVisibleMonth(todayDate.getMonth());
    setVisibleYear(todayDate.getFullYear());
  }, []); // Empty dependency array = only run once on mount

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
    setTaskTime(formatTimeDisplay(task.time) || "");
    setTaskLink(task.link || "");
    setTaskDate(task.date);
    setTaskNote(task.note || "");
    setSelectedDate(task.date);
    setModalVisible(true);
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
        const newOldDayTasks = oldDayTasks.filter(t => t.id !== editingTask.id);
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
        const updatedDayTasks = dayTasks.map(t => t.id === editingTask.id ? updatedTask : t);
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
        checked: false 
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
    setLinkInputFocused(false);

    try {
      // 2. Perform Background Operations
      if (currentEditingTask) {
        // --- UPDATE TASK ---
        console.log("Updating existing task:", currentEditingTask.id);
        
        // Check if it's a temporary task
        if (String(currentEditingTask.id).startsWith("temp-")) {
          console.log("Updating temporary task locally:", currentEditingTask.id);
          return; // Skip API call, the create flow will handle the sync
        }

        // Cancel old notifications
        if (currentEditingTask.notificationIds) {
          await cancelTaskNotification(currentEditingTask.notificationIds);
        } else if (currentEditingTask.notificationId) {
          await cancelTaskNotification(currentEditingTask.notificationId);
        }

        // API Call
        const updatedTaskFromServer = await TaskService.updateTask(currentEditingTask.id, taskData);

        // Schedule new notification
        if (Platform.OS !== "web") {
          const notificationIds = await scheduleTaskNotification(
            {
              id: updatedTaskFromServer.id,
              text: taskText,
              date: targetDate,
              time: taskTime,
              notificationIds: currentEditingTask.notificationIds,
            },
            t.taskReminder,
            getActiveReminderMinutes(),
            null,
            t
          );
          
          // Update local state with new notification IDs (silent update)
          if (notificationIds.length > 0) {
             setTasks(currentTasks => {
                const dayTasks = currentTasks[targetDate] || [];
                const updatedDayTasks = dayTasks.map(t => 
                    t.id === updatedTaskFromServer.id ? { ...t, notificationIds } : t
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

      } else {
        // --- CREATE TASK ---
        // API Call
        const createdTask = await TaskService.addTask({
          ...taskData,
          is_completed: false,
        });

        // Replace temp ID with real ID and handle any pending actions/changes
        setTasks(currentTasks => {
            // Check if task was deleted while creating
            if (pendingTempActions.current[tempId] === 'delete') {
                console.log("Task deleted while creating, deleting from server:", createdTask.id);
                TaskService.deleteTask(createdTask.id).catch(e => console.error("Failed to delete ghost task", e));
                
                // Remove from state if it exists
                const dayTasks = currentTasks[targetDate] || [];
                const filteredTasks = dayTasks.filter(t => t.id !== tempId);
                const updatedTasksState = { ...currentTasks, [targetDate]: filteredTasks };
                widgetService.syncTodayTasks(updatedTasksState);
                return updatedTasksState;
            }

            const dayTasks = currentTasks[targetDate] || [];
            // Find the current state of this task (it might have been edited or toggled)
            const currentTempTask = dayTasks.find(t => t.id === tempId);
            
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
                id: createdTask.id
            };

            // Sync changes to server if local state diverged from initial creation
            const needsUpdate = 
                finalTask.title !== createdTask.title ||
                finalTask.date !== createdTask.date ||
                finalTask.time !== createdTask.time ||
                finalTask.link !== createdTask.link ||
                finalTask.note !== createdTask.note;
            
            const needsToggle = finalTask.is_completed !== createdTask.is_completed;

            if (needsUpdate) {
                console.log("Syncing pending updates for new task");
                TaskService.updateTask(createdTask.id, {
                    title: finalTask.title,
                    date: finalTask.date,
                    time: finalTask.time,
                    link: finalTask.link,
                    note: finalTask.note
                }).catch(e => console.error("Failed to sync update", e));
            }

            if (needsToggle) {
                console.log("Syncing pending toggle for new task");
                TaskService.toggleTaskChecked(createdTask.id, finalTask.is_completed)
                    .catch(e => console.error("Failed to sync toggle", e));
            }

            const updatedDayTasks = dayTasks.map(t => t.id === tempId ? finalTask : t);
            const updatedTasksState = { ...currentTasks, [targetDate]: updatedDayTasks };
            
            // Sync widget again with real ID
            widgetService.syncTodayTasks(updatedTasksState);
            
            return updatedTasksState;
        });

        // Schedule notification for new task (native only)
        if (Platform.OS !== "web") {
          const notificationIds = await scheduleTaskNotification(
            {
              id: createdTask.id,
              text: taskText,
              date: targetDate,
              time: taskTime,
            },
            t.taskReminder,
            getActiveReminderMinutes(),
            null,
            t
          );

          if (notificationIds.length > 0) {
            // Update local state with notification IDs
             setTasks(currentTasks => {
                const dayTasks = currentTasks[targetDate] || [];
                const updatedDayTasks = dayTasks.map(t => 
                    t.id === createdTask.id ? { ...t, notificationIds } : t
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
        { cancelable: true }
      );
    }
  };

  // Ref to track pending actions for temporary tasks
  const pendingTempActions = useRef({});

  const deleteTask = async () => {
    if (!editingTask) return;

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

    try {
      // 更新任務的日期到數據庫
      await TaskService.updateTask(task.id, { date: toDate });

      // 更新本地狀態
      const fromTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];
      const toTasks = tasks[toDate] ? [...tasks[toDate]] : [];
      const filteredTasks = fromTasks.filter((t) => t.id !== task.id);
      const updatedTask = { ...task, date: toDate };
      toTasks.push(updatedTask);
      const updatedTasks = { ...tasks, [selectedDate]: filteredTasks, [toDate]: toTasks };
      setTasks(updatedTasks);
      widgetService.syncTodayTasks(updatedTasks);

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
        : t
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
      mixpanelService.track(newCompletedState ? "Task Completed" : "Task Uncompleted", {
        task_id: task.id,
        platform: Platform.OS,
      });
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

  // Initialize Mixpanel (only in production)
  useEffect(() => {
    const env = getCurrentEnvironment();
    if (env === "production") {
      mixpanelService.initialize();
      mixpanelService.track("App Opened");
    }
  }, []);

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
        console.log(`🔧 [GA] Web ${env} 環境 - 跳過初始化（僅 Production 追蹤）`);
      }
    }
    
    // 初始化 Mixpanel (僅 iOS/Android 平台且 Production 環境)
    const env = getCurrentEnvironment();
    if (env === "production") {
      mixpanelService.initialize();
    }

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
      value={{ theme, themeMode, setThemeMode, toggleTheme }}
    >
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <NavigationContainer
          linking={{
            prefixes: [
              getRedirectUrl(),
              "http://localhost:8081",
              "too-doo-list-staging://",
              "too-doo-list-dev://",
              "too-doo-list://",
            ],
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
