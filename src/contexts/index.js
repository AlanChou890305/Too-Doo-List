import { createContext } from "react";
import { translations } from "../locales";
import { lightTheme } from "../config/theme";

// Language context
export const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

// Theme context
export const ThemeContext = createContext({
  theme: lightTheme,
  themeMode: "light",
  setThemeMode: () => {},
  toggleTheme: () => {},
  loadTheme: () => {},
});

// User context
export const UserContext = createContext({
  userType: "general",
  loadingUserType: true,
  setUserType: () => {},
  loadUserType: () => {},
  setUpdateInfo: () => {},
  setIsUpdateModalVisible: () => {},
  isSimulatingUpdate: false,
  setIsSimulatingUpdate: () => {},
});
