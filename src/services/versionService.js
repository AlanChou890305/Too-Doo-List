import { Platform } from "react-native";
import * as Application from "expo-application";
import { supabase } from "../../supabaseClient";
import { getUpdateUrl } from "../config/updateUrls";

/**
 * 版本檢查服務
 * 檢查當前版本是否為最新版本，並提供更新提示
 */
class VersionService {
  constructor() {
    this.currentVersion = Application.nativeApplicationVersion || "1.2.2";
    this.currentBuildNumber = Application.nativeBuildVersion || "10";
    this.latestVersion = null;
    this.updateUrl = null;
  }

  /**
   * 檢查版本更新
   * @returns {Promise<{hasUpdate: boolean, latestVersion: string, updateUrl: string}>}
   */
  async checkForUpdates() {
    try {
      console.log("🔍 [VersionCheck] 開始檢查版本更新...");
      console.log("🔍 [VersionCheck] 當前版本:", this.currentVersion);
      console.log("🔍 [VersionCheck] 當前 Build:", this.currentBuildNumber);
      console.log("🔍 [VersionCheck] 當前平台:", Platform.OS);

      // Web 版本會自動更新，不需要檢查版本
      if (Platform.OS === "web") {
        console.log("🌐 [VersionCheck] Web 平台 - 跳過版本檢查（自動更新）");
        return {
          hasUpdate: false,
          latestVersion: this.currentVersion,
          updateUrl: null,
          releaseNotes: null,
          forceUpdate: false,
        };
      }

      // 確保當前版本已登記（非阻塞，在背景執行）
      this.ensureVersionRegistered().catch((err) => {
        console.warn("⚠️ [VersionCheck] 自動登記版本時出錯:", err);
      });

      // 從 Supabase 獲取最新版本資訊
      const { data, error } = await supabase
        .from("app_versions")
        .select(
          "version, build_number, update_url, force_update, release_notes"
        )
        .eq("platform", Platform.OS)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log("⚠️ [VersionCheck] 無法獲取版本資訊:", error.message);
        // 如果無法獲取版本資訊，根據環境使用預設值
        const defaultUpdateUrl = this.getDefaultUpdateUrl();
        return {
          hasUpdate: false,
          latestVersion: this.currentVersion,
          updateUrl: defaultUpdateUrl,
          releaseNotes: null,
          forceUpdate: false,
        };
      }

      this.latestVersion = data.version;
      // 如果資料庫中有 update_url，使用資料庫的值；否則根據環境決定
      this.updateUrl = data.update_url || this.getDefaultUpdateUrl();

      console.log("🔍 [VersionCheck] 最新版本:", this.latestVersion);
      console.log("🔍 [VersionCheck] 最新 Build:", data.build_number);

      // 比較版本號
      const hasUpdate =
        this.compareVersions(this.currentVersion, this.latestVersion) < 0;

      console.log("🔍 [VersionCheck] 需要更新:", hasUpdate);

      return {
        hasUpdate,
        latestVersion: this.latestVersion,
        updateUrl: this.updateUrl,
        releaseNotes: data.release_notes,
        forceUpdate: data.force_update,
        buildNumber: data.build_number,
      };
    } catch (error) {
      console.error("❌ [VersionCheck] 版本檢查失敗:", error);
      return {
        hasUpdate: false,
        latestVersion: this.currentVersion,
        updateUrl: null,
        releaseNotes: null,
        forceUpdate: false,
      };
    }
  }

  /**
   * 根據環境獲取預設更新連結
   * @returns {string} 更新連結
   */
  getDefaultUpdateUrl() {
    return getUpdateUrl("production");
  }

  /**
   * 比較版本號
   * @param {string} current - 當前版本
   * @param {string} latest - 最新版本
   * @returns {number} -1: 需要更新, 0: 相同, 1: 當前版本較新
   */
  compareVersions(current, latest) {
    const currentParts = current.split(".").map(Number);
    const latestParts = latest.split(".").map(Number);

    // 確保兩個版本號都有相同的部分數
    const maxLength = Math.max(currentParts.length, latestParts.length);

    for (let i = 0; i < maxLength; i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }

    return 0;
  }

  /**
   * 開啟更新連結
   * @param {string} updateUrl - 更新 URL（可選，如果不提供則根據環境決定）
   */
  async openUpdateUrl(updateUrl = null) {
    try {
      const url = updateUrl || this.getDefaultUpdateUrl();
      console.log("🔗 [VersionCheck] 開啟更新連結:", url);

      const { openBrowserAsync } = await import("expo-web-browser");
      await openBrowserAsync(url);
    } catch (error) {
      console.error("❌ [VersionCheck] 無法開啟更新連結:", error);
    }
  }

  /**
   * 獲取當前版本資訊
   */
  getCurrentVersionInfo() {
    return {
      version: this.currentVersion,
      buildNumber: this.currentBuildNumber,
      platform: Platform.OS,
    };
  }

  /**
   * 自動登記版本到 Supabase
   * 在發布新版本時調用此函數，自動將版本資訊插入資料庫
   * @param {Object} options - 版本資訊選項
   * @param {string} options.version - 版本號（可選，預設使用當前版本）
   * @param {string} options.buildNumber - Build 號碼（可選，預設使用當前 Build）
   * @param {string} options.platform - 平台（可選，預設使用當前平台）
   * @param {string} options.updateUrl - 更新連結（可選，預設使用生產環境連結）
   * @param {boolean} options.forceUpdate - 是否為強制更新（可選，預設 false）
   * @param {string} options.releaseNotes - 更新說明（可選）
   * @param {boolean} options.setAsActive - 是否設為活躍版本並將舊版本設為非活躍（可選，預設 true）
   * @returns {Promise<{success: boolean, message: string, data?: any}>}
   */
  async registerVersion(options = {}) {
    try {
      // Web 平台不需要登記版本
      if (Platform.OS === "web") {
        return {
          success: false,
          message: "Web 平台不需要登記版本（自動更新）",
        };
      }

      const version = options.version || this.currentVersion;
      const buildNumber = options.buildNumber || this.currentBuildNumber;
      const platform = options.platform || Platform.OS;
      const updateUrl = options.updateUrl || this.getDefaultUpdateUrl();
      const forceUpdate = options.forceUpdate || false;
      const releaseNotes = options.releaseNotes || null;
      const setAsActive = options.setAsActive !== false; // 預設為 true

      console.log("📝 [VersionRegister] 開始登記版本:", {
        version,
        buildNumber,
        platform,
      });

      // 檢查版本是否已存在
      const { data: existingVersion, error: checkError } = await supabase
        .from("app_versions")
        .select("id, version, is_active")
        .eq("version", version)
        .eq("platform", platform)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 是 "not found" 錯誤，這是正常的
        console.error("❌ [VersionRegister] 檢查版本時出錯:", checkError);
        return {
          success: false,
          message: `檢查版本時出錯: ${checkError.message}`,
        };
      }

      if (existingVersion) {
        console.log("ℹ️ [VersionRegister] 版本已存在:", existingVersion);
        return {
          success: true,
          message: "版本已存在於資料庫中",
          data: existingVersion,
        };
      }

      // 如果需要設為活躍版本，先將舊版本設為非活躍
      if (setAsActive) {
        const { error: updateError } = await supabase
          .from("app_versions")
          .update({ is_active: false })
          .eq("platform", platform)
          .eq("is_active", true);

        if (updateError) {
          console.warn(
            "⚠️ [VersionRegister] 更新舊版本狀態時出錯:",
            updateError
          );
          // 繼續執行，不中斷流程
        } else {
          console.log("✅ [VersionRegister] 已將舊版本設為非活躍");
        }
      }

      // 插入新版本記錄
      const { data: newVersion, error: insertError } = await supabase
        .from("app_versions")
        .insert({
          version,
          build_number: buildNumber,
          platform,
          is_active: setAsActive,
          update_url: updateUrl,
          force_update: forceUpdate,
          release_notes: releaseNotes,
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ [VersionRegister] 插入版本記錄失敗:", insertError);
        return {
          success: false,
          message: `插入版本記錄失敗: ${insertError.message}`,
        };
      }

      console.log("✅ [VersionRegister] 版本登記成功:", newVersion);
      return {
        success: true,
        message: "版本登記成功",
        data: newVersion,
      };
    } catch (error) {
      console.error("❌ [VersionRegister] 登記版本時發生錯誤:", error);
      return {
        success: false,
        message: `登記版本時發生錯誤: ${error.message}`,
      };
    }
  }

  /**
   * 檢查並自動登記當前版本（如果版本不存在於資料庫中）
   * 在版本檢查時調用，確保當前版本已登記
   * @returns {Promise<void>}
   */
  async ensureVersionRegistered() {
    try {
      if (Platform.OS === "web") {
        return;
      }

      const { data, error } = await supabase
        .from("app_versions")
        .select("id")
        .eq("version", this.currentVersion)
        .eq("platform", Platform.OS)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.warn("⚠️ [VersionRegister] 檢查版本登記狀態時出錯:", error);
        return;
      }

      // 如果版本不存在，自動登記
      if (!data) {
        console.log(
          "📝 [VersionRegister] 當前版本未登記，自動登記中...",
          this.currentVersion
        );
        const result = await this.registerVersion({
          setAsActive: true, // 自動設為活躍版本
        });
        if (result.success) {
          console.log("✅ [VersionRegister] 自動登記成功");
        } else {
          console.warn("⚠️ [VersionRegister] 自動登記失敗:", result.message);
        }
      }
    } catch (error) {
      console.warn("⚠️ [VersionRegister] 確保版本登記時出錯:", error);
    }
  }
}

export const versionService = new VersionService();
