import { Platform } from "react-native";
import { Mixpanel } from "mixpanel-react-native";
import { getCurrentEnvironment } from "../config/environment";

/**
 * Mixpanel Analytics Service
 * 用於追蹤 iOS/Android App 的使用者行為（僅 Production 環境）
 * Web 版本使用 Google Analytics (ReactGA)
 */
class MixpanelService {
  constructor() {
    this.mixpanel = null;
    this.isInitialized = false;
    this.token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  }

  /**
   * 初始化 Mixpanel
   * 僅在原生平台（iOS/Android）且 Production 環境初始化
   */
  initialize() {
    // 如果已經初始化，跳過
    if (this.isInitialized) {
      return;
    }

    // Web 平台不使用 Mixpanel
    if (Platform.OS === "web") {
      return;
    }

    // 僅在 Production 環境使用 Mixpanel
    const env = getCurrentEnvironment();
    if (env !== "production") {
      return;
    }

    // 如果沒有 token，跳過初始化
    if (!this.token) {
      console.log("⚠️ [Mixpanel] No token found - skipping initialization");
      console.log("EXPO_PUBLIC_MIXPANEL_TOKEN:", process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ? "SET" : "NOT SET");
      return;
    }

    try {
      console.log("🔧 [Mixpanel] Starting initialization...");
      console.log("📱 Platform:", Platform.OS);
      console.log("🌍 Environment:", env);
      console.log("🔑 Token:", this.token ? "EXISTS" : "MISSING");
      
      // Check if Mixpanel constructor is available
      if (typeof Mixpanel !== 'function') {
        console.log("❌ [Mixpanel] Mixpanel constructor not available");
        return;
      }

      this.mixpanel = new Mixpanel(this.token, true);
      
      // Check if init method exists
      if (typeof this.mixpanel.init !== 'function') {
        console.log("❌ [Mixpanel] init method not available");
        return;
      }

      this.mixpanel.init();
      this.isInitialized = true;
      console.log("✅ [Mixpanel] 初始化成功");
    } catch (error) {
      // Log errors in production to help debug
      console.error("❌ [Mixpanel] 初始化失敗:", error);
      this.isInitialized = false;
      this.mixpanel = null;
    }
  }

  /**
   * 識別使用者
   * @param {string} userId - 使用者 ID
   * @param {object} userProperties - 使用者屬性（email, name 等）
   */
  identify(userId, userProperties = {}) {
    if (!this.isInitialized || !this.mixpanel) return;

    try {
      this.mixpanel.identify(userId);
      if (Object.keys(userProperties).length > 0) {
        this.mixpanel.getPeople().set(userProperties);
      }
      console.log("✅ [Mixpanel] 使用者已識別:", userId);
    } catch (error) {
      console.error("❌ [Mixpanel] 識別使用者失敗:", error);
    }
  }

  /**
   * 追蹤事件
   * @param {string} eventName - 事件名稱
   * @param {object} properties - 事件屬性
   */
  track(eventName, properties = {}) {
    if (!this.isInitialized || !this.mixpanel) return;

    try {
      this.mixpanel.track(eventName, properties);
      console.log(`📊 [Mixpanel] 事件追蹤: ${eventName}`, properties);
    } catch (error) {
      console.error("❌ [Mixpanel] 追蹤事件失敗:", error);
    }
  }

  /**
   * 設定使用者屬性
   * @param {object} properties - 使用者屬性
   */
  setUserProperties(properties) {
    if (!this.isInitialized || !this.mixpanel) return;

    try {
      this.mixpanel.getPeople().set(properties);
      console.log("✅ [Mixpanel] 使用者屬性已設定:", properties);
    } catch (error) {
      console.error("❌ [Mixpanel] 設定使用者屬性失敗:", error);
    }
  }

  /**
   * 設定使用者屬性（僅在該屬性尚未存在時寫入）
   * 用於 First Seen 這類「只記第一次」的屬性，留存 cohort 會用到
   * @param {object} properties - 使用者屬性
   */
  setUserPropertiesOnce(properties) {
    if (!this.isInitialized || !this.mixpanel) return;

    try {
      this.mixpanel.getPeople().setOnce(properties);
      console.log("✅ [Mixpanel] 使用者屬性已設定 (once):", properties);
    } catch (error) {
      console.error("❌ [Mixpanel] 設定使用者屬性 (once) 失敗:", error);
    }
  }

  /**
   * 重置使用者（登出時使用）
   */
  reset() {
    if (!this.isInitialized || !this.mixpanel) return;

    try {
      this.mixpanel.reset();
      console.log("✅ [Mixpanel] 使用者已重置");
    } catch (error) {
      console.error("❌ [Mixpanel] 重置使用者失敗:", error);
    }
  }

  /**
   * 設定超級屬性（所有後續事件都會包含）
   * @param {object} properties - 超級屬性
   */
  registerSuperProperties(properties) {
    if (!this.isInitialized || !this.mixpanel) return;

    try {
      this.mixpanel.registerSuperProperties(properties);
      console.log("✅ [Mixpanel] 超級屬性已設定:", properties);
    } catch (error) {
      console.error("❌ [Mixpanel] 設定超級屬性失敗:", error);
    }
  }
}

// 匯出單例
export const mixpanelService = new MixpanelService();

