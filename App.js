import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg';
import ReactGA from "react-ga4";
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabaseClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  ScrollView,
  PanResponder,
  Animated,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import { Swipeable } from "react-native-gesture-handler";
// import { MaterialIcons } from '@expo/vector-icons'; // Already imported above
// Svg and subcomponents are now imported from 'react-native-svg'

import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

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
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    weekDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
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
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    weekDays: ["日", "一", "二", "三", "四", "五", "六"]
  }
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
    const authListener = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.warn('CRITICAL: Auth State Change Event', {
          event,
          session,
          navigationAvailable: !!navigation
        });
        
        if (event === 'SIGNED_IN' && session) {
          try {
            // Verify user session with extensive logging
            console.warn('VERBOSE: Verifying user session');
            const { data: { user }, error } = await supabase.auth.getUser();
            
            console.warn('VERBOSE: User Verification Result', {
              user: user ? { id: user.id, email: user.email } : null,
              error
            });

            if (error || !user) {
              console.error('CRITICAL: User verification error', error);
              return;
            }

            // Navigate to MainTabs with additional logging
            console.warn('CRITICAL: Attempting to navigate to MainTabs/Calendar', {
              navigationObject: !!navigation,
              navigationMethods: navigation ? Object.keys(navigation) : 'N/A'
            });
            
            // Try multiple navigation methods with extensive logging
            if (navigation) {
              try {
                // Attempt reset navigation
                console.warn('VERBOSE: Attempting navigation.reset()');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs', params: { screen: 'Calendar' } }],
                });
                console.warn('VERBOSE: navigation.reset() successful');
              } catch (resetError) {
                console.error('CRITICAL: Reset navigation failed', {
                  errorMessage: resetError.message,
                  errorStack: resetError.stack
                });

                try {
                  // Fallback to navigate method
                  console.warn('VERBOSE: Attempting navigation.navigate()');
                  navigation.navigate('MainTabs', { screen: 'Calendar' });
                  console.warn('VERBOSE: navigation.navigate() successful');
                } catch (navigateError) {
                  console.error('CRITICAL: Navigate method failed', {
                    errorMessage: navigateError.message,
                    errorStack: navigateError.stack
                  });
                }
              }
            } else {
              console.error('CRITICAL: Navigation object is undefined');
            }
          } catch (navigationError) {
            console.error('CRITICAL: Comprehensive navigation error', {
              errorMessage: navigationError.message,
              errorStack: navigationError.stack,
              navigationMethods: navigation ? Object.keys(navigation) : 'N/A'
            });
          }
        }
      }
    );

    // Cleanup subscription
    return () => {
      try {
        authListener.data.subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth listener', error);
      }
    };
  }, [navigation]);

  const handleGoogleSignIn = async () => {
    console.group('Google Authentication');
    try {
      console.warn('VERBOSE: Starting Google authentication process');

      // Extensive client validation
      if (!supabase) {
        console.error('CRITICAL: Supabase client is NOT initialized');
        throw new Error('Supabase client is not initialized');
      }

      // Comprehensive environment logging
      console.log('VERBOSE: Platform and Environment Details', {
        platform: Platform,
        windowLocation: window.location,
        navigatorInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        },
        supabaseConfig: {
          url: supabase.supabaseUrl,
          authMethods: Object.keys(supabase.auth)
        }
      });

      // Redirect URI determination with extensive logging
      const redirectUri = Platform.select({
        web: `${window.location.origin}/`,
        default: AuthSession.makeRedirectUri({ 
          useProxy: true,
          scheme: 'exp://localhost:8081' 
        })
      });

      console.warn(`VERBOSE: Computed Redirect URI: ${redirectUri}`);

      // Session check with verbose logging
      const sessionResult = await supabase.auth.getSession();
      console.log('VERBOSE: Session Check Result', {
        session: sessionResult.data?.session,
        error: sessionResult.error
      });

      if (sessionResult.data?.session) {
        console.warn('VERBOSE: Existing session found, navigating to MainTabs');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
        return;
      }

      // Detailed OAuth configuration
      const oauthConfig = {
        provider: 'google',
        options: { 
          redirectTo: redirectUri,
          scopes: 'email profile',
          ...(Platform.OS === 'web' ? {
            skipBrowserRedirect: false,
            persistSession: true
          } : {})
        }
      };

      console.warn('VERBOSE: OAuth Configuration', JSON.stringify(oauthConfig, null, 2));

      // Validate redirect URI
      if (!oauthConfig.options.redirectTo) {
        console.error('CRITICAL: Invalid redirect URI');
        throw new Error('Invalid redirect URI');
      }

      // Attempt OAuth sign-in with maximum logging
      console.warn('VERBOSE: Initiating OAuth Sign-in');
      const oauthResult = await supabase.auth.signInWithOAuth(oauthConfig);

      console.warn('VERBOSE: OAuth Sign-in Complete', {
        data: oauthResult.data,
        error: oauthResult.error
      });

      if (oauthResult.error) {
        console.error('CRITICAL: OAuth Sign-in Failed', {
          errorDetails: oauthResult.error,
          fullErrorObject: JSON.stringify(oauthResult.error, null, 2)
        });
        Alert.alert('Login Error', oauthResult.error.message || 'Unknown OAuth error');
      }
    } catch (error) {
      console.error('CRITICAL: Comprehensive Authentication Error', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        fullErrorObject: JSON.stringify(error, null, 2)
      });
      Alert.alert('Error', error.message || 'An unexpected error occurred during sign-in.');
    } finally {
      console.groupEnd();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Image source={require('./assets/logo.png')} style={{ width: 140, height: 140, marginBottom: 16 }} resizeMode="contain" />
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#3d3d4e', marginBottom: 48, letterSpacing: 1 }}>Too Doo List</Text>
        <View style={{ width: 260 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#6c63ff',
              borderRadius: 12,
              paddingVertical: 16,
              width: '100%',
              alignItems: 'center',
              marginBottom: 18,
              shadowColor: '#6c63ff',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 5,
              elevation: 3,
            }}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 19, letterSpacing: 0.5 }}>Quick Start</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderColor: '#dadada',
              borderWidth: 1,
              borderRadius: 4,
              paddingVertical: 12,
              justifyContent: 'center',
              marginBottom: 10,
              width: '100%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            }}
            onPress={handleGoogleSignIn}
          >
            <Image
              source={require('./assets/google-logo.png')}
              style={{ width: 24, height: 24, marginRight: 8 }}
              resizeMode="contain"
            />
            <Text style={{ color: '#4285F4', fontWeight: 'bold', fontSize: 16 }}>
              Sign in with Google
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>
          By continuing, you agree to our
          <Text
            style={{ color: '#6c63ff', fontWeight: 'bold' }}
            onPress={() => navigation.navigate('Terms')}
          > Terms of Use</Text>
          {' '}and
          <Text
            style={{ color: '#6c63ff', fontWeight: 'bold' }}
            onPress={() => navigation.navigate('Privacy')}
          > Privacy Policy</Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
}

function LoginScreen({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 36, left: 16, flexDirection: 'row', alignItems: 'center', padding: 8, zIndex: 10 }}
        onPress={() => { if (navigation.canGoBack()) navigation.goBack(); }}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <MaterialIcons name="arrow-back" size={28} color="#6c63ff" />
        <Text style={{ color: '#6c63ff', fontSize: 18, marginLeft: 4 }}>Back</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#6c63ff', marginBottom: 32 }}>Login</Text>
        <View style={{ width: 260 }}>
          <Text style={{ marginBottom: 4, color: '#3d3d4e', fontWeight: '600', fontSize: 15 }}>Email</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#fafafa' }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={{ marginBottom: 4, color: '#3d3d4e', fontWeight: '600', fontSize: 15 }}>Password</Text>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16, backgroundColor: '#fafafa' }}
            secureTextEntry
          />
          <TouchableOpacity
            style={{ backgroundColor: '#6c63ff', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}
            onPress={() => {/* TODO: Implement login logic */}}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>Login</Text>
          </TouchableOpacity>
          
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>
          By continuing, you agree to our
          <Text
            style={{ color: '#6c63ff', fontWeight: 'bold' }}
            onPress={() => navigation.navigate('Terms')}
          > Terms of Use</Text>
          {' '}and
          <Text
            style={{ color: '#6c63ff', fontWeight: 'bold' }}
            onPress={() => navigation.navigate('Privacy')}
          > Privacy Policy</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 36, left: 16, flexDirection: 'row', alignItems: 'center', padding: 8, zIndex: 10 }}
        onPress={() => { if (navigation.canGoBack()) navigation.goBack(); }}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <MaterialIcons name="arrow-back" size={28} color="#6c63ff" />
        <Text style={{ color: '#6c63ff', fontSize: 18, marginLeft: 4 }}>Back</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#6c63ff', marginBottom: 32 }}>Sign Up</Text>
        <View style={{ width: 260 }}>
          <Text style={{ marginBottom: 4, color: '#3d3d4e', fontWeight: '600', fontSize: 15 }}>Username</Text>
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#fafafa' }}
            autoCapitalize="none"
          />
          <Text style={{ marginBottom: 4, color: '#3d3d4e', fontWeight: '600', fontSize: 15 }}>Email</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#fafafa' }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={{ marginBottom: 4, color: '#3d3d4e', fontWeight: '600', fontSize: 15 }}>Password</Text>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#fafafa' }}
            secureTextEntry
          />
          <Text style={{ marginBottom: 4, color: '#3d3d4e', fontWeight: '600', fontSize: 15 }}>Confirm Password</Text>
          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16, backgroundColor: '#fafafa' }}
            secureTextEntry
          />
          <TouchableOpacity
            style={{ backgroundColor: '#6c63ff', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}
            onPress={() => {/* TODO: Implement signup logic */}}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>Sign Up</Text>
          </TouchableOpacity>
          
        </View>
      </View>
      <View style={{ position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>
          By continuing, you agree to our
          <Text
            style={{ color: '#6c63ff', fontWeight: 'bold' }}
            onPress={() => navigation.navigate('Terms')}
          > Terms of Use</Text>
          {' '}and
          <Text
            style={{ color: '#6c63ff', fontWeight: 'bold' }}
            onPress={() => navigation.navigate('Privacy')}
          > Privacy Policy</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgb(247, 247, 250)' }}>
      {/* Custom Header with Back Chevron */}
      <View style={{ backgroundColor: 'rgb(247, 247, 250)', height: 64, flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginRight: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width={18} height={28}>
            <Line x1={12} y1={6} x2={4} y2={14} stroke="#222" strokeWidth={2.2} strokeLinecap="round" />
            <Line x1={4} y1={14} x2={12} y2={22} stroke="#222" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, color: '#222', fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'left', marginLeft: 4 }}>{t.terms}</Text>
        
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Simple Hourglass Illustration */}
        <Svg width={56} height={56} style={{ marginBottom: 12 }}>
          <Rect x={18} y={10} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Rect x={18} y={42} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Path d="M20 14 Q28 28 20 42" stroke="#B0B0B0" strokeWidth={2} fill="none" />
          <Path d="M36 14 Q28 28 36 42" stroke="#B0B0B0" strokeWidth={2} fill="none" />
          <Ellipse cx={28} cy={28} rx={5} ry={3} fill="#FFD580" />
          <Rect x={26} y={28} width={4} height={10} rx={2} fill="#FFD580" />
        </Svg>
        <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 40 }}>
  <Text style={{ fontSize: 18, color: '#444', fontWeight: 'bold', marginBottom: 12 }}>
    Terms of Use
  </Text>
  <Text style={{ fontSize: 15, color: '#444', marginBottom: 10 }}>
    Welcome to Too-Doo List. By using this application, you agree to the following terms and conditions:
  </Text>
  <Text style={{ fontSize: 15, color: '#444', marginBottom: 10 }}>
    1. You are responsible for maintaining the confidentiality of your device and any information stored within the app.{"\n"}
    2. All content you create or manage within the app remains your responsibility.{"\n"}
    3. The app is provided "as is" without warranties of any kind, either express or implied.{"\n"}
    4. We are not liable for any loss of data, productivity, or other damages arising from the use of this app.{"\n"}
    5. You agree not to use the app for any unlawful or prohibited activities.
  </Text>
  <Text style={{ fontSize: 14, color: '#888', marginTop: 12 }}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgb(247, 247, 250)' }}>
      {/* Custom Header with Back Chevron */}
      <View style={{ backgroundColor: 'rgb(247, 247, 250)', height: 64, flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginRight: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Svg width={18} height={28}>
            <Line x1={12} y1={6} x2={4} y2={14} stroke="#222" strokeWidth={2.2} strokeLinecap="round" />
            <Line x1={4} y1={14} x2={12} y2={22} stroke="#222" strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, color: '#222', fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'left', marginLeft: 4 }}>{t.privacy}</Text>
        
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Simple Hourglass Illustration */}
        <Svg width={56} height={56} style={{ marginBottom: 12 }}>
          <Rect x={18} y={10} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Rect x={18} y={42} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Path d="M20 14 Q28 28 20 42" stroke="#B0B0B0" strokeWidth={2} fill="none" />
          <Path d="M36 14 Q28 28 36 42" stroke="#B0B0B0" strokeWidth={2} fill="none" />
          <Ellipse cx={28} cy={28} rx={5} ry={3} fill="#FFD580" />
          <Rect x={26} y={28} width={4} height={10} rx={2} fill="#FFD580" />
        </Svg>
        <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 40 }}>
  <Text style={{ fontSize: 18, color: '#444', fontWeight: 'bold', marginBottom: 12 }}>
    Privacy Policy
  </Text>
  <Text style={{ fontSize: 15, color: '#444', marginBottom: 10 }}>
    Your privacy is important to us. This policy explains how information is handled in Too-Doo List:
  </Text>
  <Text style={{ fontSize: 15, color: '#444', marginBottom: 10 }}>
    1. All data you enter is stored locally on your device and is not transmitted to any external server.{"\n"}
    2. We do not collect, access, or share your personal information.{"\n"}
    3. You are responsible for managing and securing your own data on your device.{"\n"}
    4. The app does not use third-party analytics or advertising services.
  </Text>
  <Text style={{ fontSize: 14, color: '#888', marginTop: 12 }}>
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
  const [userName, setUserName] = useState('Anonymous');
  const navigation = useNavigation();

  useEffect(() => {
    const getName = async () => {
      try {
        const loginType = await AsyncStorage.getItem('loginType');
        const { data: { session } } = await supabase.auth.getSession();

        if (loginType === 'google' && session) {
          // Try to get name from different possible sources
          const userName = 
            session.user?.user_metadata?.name || 
            session.user?.email?.split('@')[0] || 
            session.user?.email || 
            'Google User';
          
          setUserName(userName);
        } else {
          setUserName('Anonymous');
        }
      } catch (error) {
        console.error('Error retrieving user name:', error);
        setUserName('Anonymous');
      }
    };
    getName();
  }, []);


  const openModal = (text) => {
    setModalText(text);
    setModalVisible(true);
  };





  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgb(247, 247, 250)' }}>
      <View style={{ backgroundColor: 'rgb(247, 247, 250)', height: 64, justifyContent: 'center' }}>
        <Text style={{ fontSize: 22, color: '#222', fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'left', paddingLeft: 24 }}>{t.settings}</Text>
        
      </View>
      <View style={{ flex: 1, paddingHorizontal: 0, backgroundColor: 'rgb(247, 247, 250)' }}>
        {/* Account Section Title */}
        <Text style={{ color: '#666', fontSize: 15, fontWeight: 'bold', marginLeft: 28, marginTop: 18, marginBottom: 2, letterSpacing: 0.5 }}>{t.account}</Text>
        {/* Account Info Card */}
        <View style={{ backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, marginTop: 8, marginBottom: 0, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ color: '#222', fontSize: 16, marginBottom: 10 }}>{t.userName}</Text>
<Text style={{ color: '#666', fontSize: 15, marginBottom: 0 }}>
  {userName}
</Text>
        </View>
        {/* General Section Title */}
        <Text style={{ color: '#666', fontSize: 15, fontWeight: 'bold', marginLeft: 28, marginTop: 18, marginBottom: 2, letterSpacing: 0.5 }}>{t.general}</Text>
        {/* Language selection block */}
        <View style={{ backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, marginTop: 8, marginBottom: 0, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ color: '#222', fontSize: 16, marginBottom: 10 }}>{t.language}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={{
                backgroundColor: language === 'en' ? '#222' : '#eee',
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 8,
                marginRight: 10,
                borderWidth: language === 'en' ? 0 : 1,
                borderColor: '#ddd',
              }}
              onPress={() => setLanguage('en')}
            >
              <Text style={{ color: language === 'en' ? '#fff' : '#222', fontWeight: 'bold' }}>{t.english}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: language === 'zh' ? '#222' : '#eee',
                paddingVertical: 8,
                paddingHorizontal: 18,
                borderRadius: 8,
                borderWidth: language === 'zh' ? 0 : 1,
                borderColor: '#ddd',
              }}
              onPress={() => setLanguage('zh')}
            >
              <Text style={{ color: language === 'zh' ? '#fff' : '#222', fontWeight: 'bold' }}>{t.chinese}</Text>
            </TouchableOpacity>
  
      </View>

      </View>
        {/* Legal Section Title */}
        <Text style={{ color: '#666', fontSize: 15, fontWeight: 'bold', marginLeft: 28, marginTop: 18, marginBottom: 2, letterSpacing: 0.5 }}>{t.legal}</Text>
        {/* Links */}
        <View style={{ backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, marginTop: 8, marginBottom: 0, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Terms')}
            activeOpacity={0.6}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 20 }}
          >
            <Text style={{ color: '#222', fontSize: 16 }}>{t.terms}</Text>
            <Svg width={12} height={18} style={{ marginLeft: 6 }}>
  <Line x1={3} y1={4} x2={9} y2={9} stroke="#bbb" strokeWidth={2} strokeLinecap="round" />
  <Line x1={9} y1={9} x2={3} y2={14} stroke="#bbb" strokeWidth={2} strokeLinecap="round" />
</Svg>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: '#ececec', marginLeft: 20 }} />
          <TouchableOpacity
            onPress={() => navigation.navigate('Privacy')}
            activeOpacity={0.6}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 20 }}
          >
            <Text style={{ color: '#222', fontSize: 16 }}>{t.privacy}</Text>
            <Svg width={12} height={18} style={{ marginLeft: 6 }}>
  <Line x1={3} y1={4} x2={9} y2={9} stroke="#bbb" strokeWidth={2} strokeLinecap="round" />
  <Line x1={9} y1={9} x2={3} y2={14} stroke="#bbb" strokeWidth={2} strokeLinecap="round" />
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
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={{ backgroundColor: '#fff', padding: 32, borderRadius: 12, minWidth: 220, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: '#333', marginBottom: 16 }}>{modalText}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8, paddingVertical: 6, paddingHorizontal: 18, backgroundColor: '#111', borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>{t.cancel}</Text>
            </TouchableOpacity>
  
      </View>
        </TouchableOpacity>
      </Modal>
      <View style={{ alignItems: 'center', marginBottom: 18, backgroundColor: 'rgb(247, 247, 250)', paddingVertical: 8 }}>
        <Text style={{ color: '#aaa', fontSize: 14 }}>{t.version} 1.0.0</Text>
        
      </View>
    </SafeAreaView>
  );
}

function CalendarScreen({ navigation, route }) {
  const { language, t } = useContext(LanguageContext);
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [tasks, setTasks] = useState({});
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [modalVisible, setModalVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(new Date(getCurrentDate()).getMonth());
  const [visibleYear, setVisibleYear] = useState(new Date(getCurrentDate()).getFullYear());
  const [taskText, setTaskText] = useState("");
const [taskTime, setTaskTime] = useState("");
const [showTimePicker, setShowTimePicker] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(TASKS_STORAGE_KEY).then((data) => {
      if (data) {
        const loadedTasks = JSON.parse(data);
        setTasks(loadedTasks);
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

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
    const diffInDays = Math.floor((todayDate - firstSunday) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffInDays / 7);
    const weekHeight = 50;
    const visibleWeeks = 4;
    const scrollPosition = (weekNumber * weekHeight) - ((visibleWeeks / 2) * weekHeight);
    scrollViewRef.current.scrollTo({
      y: scrollPosition,
      animated: true
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
    console.log('Open edit task:', task);
    setEditingTask(task);
    setTaskText(task.text);
    setTaskTime(task.time || "");
    setSelectedDate(task.date);
    setModalVisible(true);
  };

  const saveTask = () => {
    if (taskText.trim() === "") return;
    let dayTasks = tasks[selectedDate] ? [...tasks[selectedDate]] : [];
    if (editingTask) {
      dayTasks = dayTasks.map((t) =>
        t.id === editingTask.id
          ? { time: taskTime, id: t.id, text: taskText, date: selectedDate }
          : t
      );
    } else {
      dayTasks.push({
        time: taskTime,
        id: Date.now().toString(),
        text: taskText,
        date: selectedDate,
      });
    }
    setTasks({ ...tasks, [selectedDate]: dayTasks });
    setModalVisible(false);
    setEditingTask(null);
    setTaskText("");
    setTaskTime("");
  };

  const deleteTask = (task) => {
    if (!task) return;
    const day = task.date;
    const dayTasks = tasks[day] ? [...tasks[day]] : [];
    const filteredTasks = dayTasks.filter((t) => t.id !== task.id);
    const newTasks = { ...tasks, [day]: filteredTasks };
    setTasks(newTasks);
    AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
    setModalVisible(false);
    setEditingTask(null);
    setTaskText("");
    setTaskTime("");
    console.log('Deleted task', task.id);
    console.log('Tasks after delete:', newTasks);
  };

  const startMoveTask = (task) => {
    setMoveMode(true);
    setTaskToMove(task);
    Alert.alert(
      t.moveTask,
      t.moveTaskAlert
    );
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
        dayDate.setDate(firstSunday.getDate() + (week * 7) + day);
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
        <View>
          {weeks}

      </View>
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
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = date === todayFormatted;
    const isInRange = true; // Always show the date number

    const renderDateContent = () => {
      return (
        <View style={styles.dateContainer}>
          <View style={[
            styles.dateTextContainer,
            isToday && styles.todayCircle,
            isSelected && styles.selectedDate
          ]}>
            <Text style={[
              styles.calendarDayText,
              !isCurrentMonth && styles.otherMonthText,
              isSelected && styles.selectedDayText,
              isToday && styles.todayText,
              !isInRange && styles.hiddenDate,
            ]}>
              {isInRange ? dateObj.getDate() : ''}
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
        {(tasks[date]?.length > 0) && (
          <View style={styles.taskDot} />
        )}
      </TouchableOpacity>
    );
  };

  const toggleTaskChecked = (task) => {
  const dayTasks = tasks[task.date] ? [...tasks[task.date]] : [];
  const updatedTasks = dayTasks.map(t => t.id === task.id ? { ...t, checked: !t.checked } : t);
  setTasks({ ...tasks, [task.date]: updatedTasks });
  AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify({ ...tasks, [task.date]: updatedTasks }));
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
        <MaterialIcons name="check-box-outline-blank" size={24} color="#bbb" />
      )}
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.taskItem, { flex: 1 }]}
      onPress={() => openEditTask(item)}
      onLongPress={() => startMoveTask(item)}
      activeOpacity={0.7}
    >
      <View style={{ width: 60, alignItems: 'flex-start', justifyContent: 'center', marginRight: 8 }}>
        <Text style={{ color: '#6c63ff', fontWeight: 'bold', fontSize: 15 }}>
          {item.time ? item.time : '--:--'}
        </Text>
        
      </View>
      <Text style={[styles.taskText, item.checked && styles.taskTextChecked]}>{item.text}</Text>
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
    return date.toISOString().split('T')[0];
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
    console.log('RenderTaskArea dayTasks:', dayTasks);
    return (
      <PanGestureHandler onHandlerStateChange={handleTaskAreaGesture} activeOffsetY={[-20, 20]} activeOffsetX={[-50, 50]}>
        <View style={[styles.taskArea, { flex: 1 }]}>
          <View style={[styles.taskAreaContent, { flex: 1, overflow: 'hidden' }]}>
            <View style={[styles.tasksHeaderRow, { paddingLeft: 0, paddingHorizontal: 0, marginLeft: 4 }]}> 
  <Text style={[styles.tasksHeader, { textAlign: 'left', paddingLeft: 0, marginLeft: 4 }]}>{selectedDate}</Text>
</View>

            {/* Floating Add Button */}
            <TouchableOpacity
              style={styles.fabAddButton}
              onPress={() => openAddTask(selectedDate)}
              activeOpacity={0.7}
            >
              <View style={styles.addButtonIcon}>
                <Svg width={32} height={32} viewBox="0 0 32 32" style={{ display: 'flex', alignSelf: 'center', justifyContent: 'center' }}>
  <Line x1="16" y1="6" x2="16" y2="26" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
  <Line x1="6" y1="16" x2="26" y2="16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
</Svg>
      
      </View>
            </TouchableOpacity>

            {dayTasks.length === 0 ? (
              <View style={styles.noTaskContainer}>
                <Svg width={64} height={64} viewBox="0 0 64 64" style={{ marginBottom: 12 }}>
                  <Rect x="10" y="20" width="44" height="32" rx="8" fill="#eee" />
                  <Line x1="18" y1="32" x2="46" y2="32" stroke="#bbb" strokeWidth="2" strokeLinecap="round" />
                  <Line x1="18" y1="40" x2="38" y2="40" stroke="#ccc" strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="32" cy="16" r="6" fill="#e0e0e0" />
                </Svg>
                <Text style={styles.noTaskText}>{t.noTasks}</Text>
      
      </View>
            ) : (
              <View style={{ flex: 1 }}>
                <FlatList
                  data={dayTasks.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''))}
                  keyExtractor={item => item.id}
                  renderItem={renderTask}
                  contentContainerStyle={[styles.tasksScrollContent, { paddingBottom: 32 }]}
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
            onClick={e => e.stopPropagation && e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="close" size={28} color="#888" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingTask ? t.editTask : t.createTask}
            </Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{'Time'}</Text>
            {Platform.OS === 'web' ? (
  <View
    style={[styles.input, { padding: 0, marginBottom: 24, height: 48, flexDirection: 'row', alignItems: 'center' }]}
    onClick={e => e.stopPropagation && e.stopPropagation()}
  >
    <input
      type="time"
      value={taskTime}
      onChange={e => setTaskTime(e.target.value)}
      onBlur={() => setShowTimePicker(false)}
      style={{ border: 'none', fontSize: 16, width: '100%', background: 'transparent', color: taskTime ? '#222' : '#888' }}
      onClick={e => e.stopPropagation()}
    />
  </View>
) : (
  <TouchableOpacity
    style={[styles.input, { justifyContent: 'center', height: 48, marginBottom: 24 }]}
    onPress={() => setShowTimePicker(true)}
    activeOpacity={0.7}
  >
    <Text style={{ fontSize: 16, color: taskTime ? '#222' : '#888' }}>
      {taskTime ? taskTime : 'Select time'}
    </Text>
    {showTimePicker && (
      <DateTimePicker
        value={taskTime ? new Date(`2020-01-01T${taskTime}:00`) : new Date()}
        mode="time"
        is24Hour={true}
        display="spinner"
        onChange={(event, selectedDate) => {
          setShowTimePicker(false);
          if (event.type === 'set' && selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            setTaskTime(`${hours}:${minutes}`);
          }
        }}
        style={{ backgroundColor: '#fff' }}
      />
    )}
  </TouchableOpacity>
)}
            <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 4 }}>Task</Text>
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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start" }}>
        <Text style={styles.currentMonthTitle}>
          {visibleYear} {monthNames[visibleMonth]}
        </Text>
        
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.calendarSection}>
          {header}
          <View style={styles.weekDaysHeader}>
            {t.weekDays.map((d, i) => (
              <Text key={i} style={styles.weekDayText}>{d}</Text>
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
        <View style={styles.taskAreaContainer}>
          {renderTaskArea()}

      </View>
        {renderModal()}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const setTitle = () => { document.title = 'Too Doo List'; };
      setTitle();
      const observer = new MutationObserver(() => {
        if (document.title !== 'Too Doo List') {
          document.title = 'Too Doo List';
        }
      });
      const titleTag = document.querySelector('title');
      if (titleTag) {
        observer.observe(titleTag, { childList: true });
      }
      return () => observer.disconnect();
    }
  }, []);
  // Always set browser tab title on web
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Too Doo List';
    }
  }, []);
  const [language, setLanguageState] = useState("en");
  const [loadingLang, setLoadingLang] = useState(true);

  useEffect(() => {
    // Set browser tab title
    if (typeof document !== 'undefined') {
      document.title = "Too Doo List";
    }
    ReactGA.initialize("G-FDKFB5F7VX");
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
    // Load language from AsyncStorage
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((lang) => {
      if (lang && (lang === 'en' || lang === 'zh')) {
        setLanguageState(lang);
      }
      setLoadingLang(false);
    });
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const t = translations[language] || translations.en;

  if (loadingLang) return null;

  function MainTabs() {
    React.useEffect(() => {
      if (typeof document !== 'undefined') {
        setTimeout(() => {
          document.title = 'Too Doo List';
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
            if (route.name === 'Calendar') {
              iconName = 'calendar-today';
            } else if (route.name === 'Setting') {
              iconName = 'settings';
            }
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name={iconName} size={size} color={color} />
      
      </View>
            );
          },
          tabBarActiveTintColor: '#111',
          tabBarInactiveTintColor: '#888',
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 60,
            paddingBottom: 4,
            paddingTop: 4,
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderTopWidth: 1,
            borderTopColor: '#eee',
          },
          tabBarIconStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
        })}
      >
        <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: t.calendar }} />
        <Tab.Screen name="Setting" component={SettingScreen} options={{ title: t.settings }} />
      </Tab.Navigator>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <NavigationContainer
        onStateChange={() => {
          if (typeof document !== 'undefined') {
            document.title = 'Too Doo List';
          }
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="ComingSoon" component={require('./ComingSoonScreen').default} />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageContext.Provider>
  );
}

// ...

const styles = StyleSheet.create({
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  checkbox: {
    marginRight: 2,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTextChecked: {
    textDecorationLine: 'line-through',
    color: '#bbb',
  },
  fabAddButton: {
    position: 'absolute',
    right: 20,
    bottom: 8,
    zIndex: 10,
    borderRadius: 32,
    backgroundColor: '#6c63ff',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 7,
  },
  // ...
  // Removed bottomMenuBar style, handled by Tab.Navigator now

  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  calendarSection: {
    flexShrink: 0,
    backgroundColor: '#fff',
  },
  taskAreaContainer: {
    backgroundColor: '#f4f4f6',
    width: '100%',
    flex: 1,
    paddingBottom: 60, // Add padding equal to bottom bar height
  },
  taskArea: {
    flex: 1,
    backgroundColor: '#f7f7fa',
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
    borderBottomColor: '#bbbbbb',
  },
  // Scroll container
  calendarDivider: {
    height: 1,
    backgroundColor: '#bbbbbb',
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
    color: '#333',
    fontWeight: '500',
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
    position: 'absolute',
    bottom: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6c63ff',
  },
  todayCircle: {
    backgroundColor: '#6c63ff',
    width: 22,
    height: 22,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    color: 'white', // White for better contrast
    fontWeight: '600',
    fontSize: 14,
  },
  dateTextContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  noTaskContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 48,
  },
  selectedDate: {
    // No background color, just text color change
  },
  selectedDayText: {
    color: '#6c63ff', // Same as add button color
    fontWeight: '600',
  },
  tasksContainer: {
    flex: 1,
    backgroundColor: '#f7f7fa',
  },
  taskAreaContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  taskArea: {
    flex: 1,
    backgroundColor: '#f7f7fa',
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
    backgroundColor: '#f7f7fa', // Match tasks container background
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
    backgroundColor: '#6c63ff',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  addButtonText: {
    fontSize: 20,
    lineHeight: 24,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
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
    fontSize: 14,
    color: "#3d3d4e",
    flex: 1,
    lineHeight: 20,
  },
  moveHint: {
    color: "#ffb300",
    fontWeight: "700",
    marginLeft: 10,
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
    position: 'absolute',
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
