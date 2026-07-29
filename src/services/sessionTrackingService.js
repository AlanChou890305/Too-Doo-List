import { AppState, Platform } from "react-native";
import { mixpanelService } from "./mixpanelService";

/**
 * Session Tracking Service
 *
 * 解決兩個 Mixpanel 資料缺口：
 * 1. DAU 低估 — 原本只有冷啟動會送 App Opened，從背景切回來不算活躍
 * 2. 沒有 session 長度 — mixpanel-react-native 不會自動記 session
 *
 * 規則：背景停留超過 SESSION_TIMEOUT_MS 才算新 session，
 * 避免切去看通知、選照片這種幾秒鐘的離開被拆成多個 session。
 */
const SESSION_TIMEOUT_MS = 30 * 1000;

class SessionTrackingService {
  constructor() {
    this.subscription = null;
    this.sessionStartedAt = null;
    this.backgroundedAt = null;
    // 同一個 session 內累計的前景時間（不含背景停留）
    this.activeMsBeforeBackground = 0;
  }

  /**
   * 開始追蹤（App 啟動時呼叫一次，需在 mixpanelService.initialize() 之後）
   */
  start() {
    if (Platform.OS === "web" || this.subscription) return;

    try {
      this.beginSession("cold_start");
      this.subscription = AppState.addEventListener(
        "change",
        this.handleAppStateChange,
      );
    } catch (error) {
      console.error("❌ [Session] 啟動追蹤失敗:", error);
    }
  }

  /**
   * 停止追蹤並結算當前 session
   */
  stop() {
    try {
      this.endSession("shutdown");
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }
    } catch (error) {
      console.error("❌ [Session] 停止追蹤失敗:", error);
    }
  }

  handleAppStateChange = (nextState) => {
    try {
      if (nextState === "active") {
        this.handleForeground();
      } else if (nextState === "background" || nextState === "inactive") {
        this.handleBackground();
      }
    } catch (error) {
      console.error("❌ [Session] 處理 AppState 變化失敗:", error);
    }
  };

  handleForeground() {
    // 沒有 backgroundedAt 表示這不是「從背景回來」（例如 inactive → active 的假警報）
    if (this.backgroundedAt === null) return;

    const awayMs = Date.now() - this.backgroundedAt;
    this.backgroundedAt = null;

    if (awayMs >= SESSION_TIMEOUT_MS) {
      // 舊 session 已在進背景時結算，這裡開一個新的
      this.beginSession("foreground");
    } else {
      // 短暫離開，延續同一個 session
      this.sessionStartedAt = Date.now();
    }
  }

  handleBackground() {
    if (this.backgroundedAt !== null) return; // 已在背景，不重複結算

    this.backgroundedAt = Date.now();
    if (this.sessionStartedAt !== null) {
      this.activeMsBeforeBackground += Date.now() - this.sessionStartedAt;
      this.sessionStartedAt = null;
    }
    this.endSession("background");
  }

  beginSession(source) {
    this.sessionStartedAt = Date.now();
    this.activeMsBeforeBackground = 0;
    // App Opened 是 DAU / MAU 的基準事件
    mixpanelService.track("App Opened", { source, platform: Platform.OS });
  }

  endSession(reason) {
    const activeMs =
      this.activeMsBeforeBackground +
      (this.sessionStartedAt !== null ? Date.now() - this.sessionStartedAt : 0);

    this.sessionStartedAt = null;
    this.activeMsBeforeBackground = 0;

    if (activeMs <= 0) return;

    mixpanelService.track("App Session Ended", {
      reason,
      duration_seconds: Math.round(activeMs / 1000),
      platform: Platform.OS,
    });
  }
}

export const sessionTrackingService = new SessionTrackingService();
