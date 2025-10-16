/**
 * 主題配置
 * 支援淺色模式（Light）和深色模式（Dark）
 */

export const lightTheme = {
  mode: "light",

  // 主要顏色
  primary: "#6c63ff",
  primaryLight: "#8b84ff",
  primaryDark: "#5649d6",

  // 背景色
  background: "#ffffff",
  backgroundSecondary: "#f5f5f5",
  backgroundTertiary: "#e8e8e8",

  // 卡片/容器
  card: "#ffffff",
  cardBorder: "#e0e0e0",

  // 文字顏色
  text: "#000000",
  textSecondary: "#666666",
  textTertiary: "#888888",
  textPlaceholder: "#888888",

  // 輸入框
  input: "#ffffff",
  inputBorder: "#ddd",
  inputBorderFocused: "#6c63ff",

  // 按鈕
  button: "#6c63ff",
  buttonText: "#ffffff",
  buttonSecondary: "#f0f0f0",
  buttonSecondaryText: "#333333",

  // 狀態顏色
  success: "#4caf50",
  error: "#ff4444",
  warning: "#ff9800",
  info: "#2196f3",

  // 分隔線
  divider: "#e0e0e0",

  // 陰影
  shadow: "#000000",
  shadowOpacity: 0.1,

  // 複選框
  checkbox: "#6c63ff",
  checkboxUnchecked: "#aaa",

  // Modal
  modalOverlay: "rgba(0, 0, 0, 0.5)",
  modalBackground: "#ffffff",

  // Tab Bar
  tabBarBackground: "#ffffff",
  tabBarActive: "#6c63ff",
  tabBarInactive: "#999999",

  // Calendar
  calendarHeader: "#6c63ff",
  calendarHeaderText: "#ffffff",
  calendarToday: "#6c63ff",
  calendarTodayText: "#ffffff",
  calendarWeekend: "#ff5252",
  calendarSelected: "#f3e5f5", // 淡紫色（品牌色系）

  // Task
  taskChecked: "#999999",
  taskUnchecked: "#000000",
  taskTime: "#666666",
};

export const darkTheme = {
  mode: "dark",

  // 主要顏色
  primary: "#8b84ff",
  primaryLight: "#a39dff",
  primaryDark: "#6c63ff",

  // 背景色 - 調整為更淺的灰色，避免純黑
  background: "#1c1c1e",
  backgroundSecondary: "#2c2c2e",
  backgroundTertiary: "rgb(58, 58, 60)",

  // 卡片/容器 - 與背景有明顯對比
  card: "rgb(58, 58, 60)",
  cardBorder: "#48484a",

  // 文字顏色 - 更接近白色，提高可讀性
  text: "#f5f5f5",
  textSecondary: "#d0d0d0",
  textTertiary: "#a0a0a0",
  textPlaceholder: "#808080",

  // 輸入框 - 調整為更淺的背景
  input: "#303030",
  inputBorder: "#505050",
  inputBorderFocused: "#8b84ff",

  // 按鈕
  button: "#8b84ff",
  buttonText: "#ffffff",
  buttonSecondary: "#303030",
  buttonSecondaryText: "#f5f5f5",

  // 狀態顏色
  success: "#66bb6a",
  error: "#ef5350",
  warning: "#ffa726",
  info: "#42a5f5",

  // 分隔線
  divider: "#353535",

  // 陰影
  shadow: "#000000",
  shadowOpacity: 0.3,

  // 複選框
  checkbox: "#8b84ff",
  checkboxUnchecked: "#f5f5f5", // 深色模式用白色

  // Modal
  modalOverlay: "rgba(0, 0, 0, 0.7)",
  modalBackground: "#1c1c1e",

  // Tab Bar
  tabBarBackground: "#252525",
  tabBarActive: "#8b84ff",
  tabBarInactive: "#808080",

  // Calendar
  calendarHeader: "#8b84ff",
  calendarHeaderText: "#ffffff",
  calendarToday: "#8b84ff",
  calendarTodayText: "#ffffff",
  calendarWeekend: "#ef5350",
  calendarSelected: "#353550",

  // Task
  taskChecked: "#808080",
  taskUnchecked: "#f5f5f5",
  taskTime: "#d0d0d0",
};

/**
 * 根據主題模式返回對應的主題
 */
export const getTheme = (mode) => {
  return mode === "dark" ? darkTheme : lightTheme;
};
