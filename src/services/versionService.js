import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { supabase } from '../../supabaseClient';
import { getUpdateUrl } from '../config/updateUrls';

/**
 * 版本檢查服務
 * 檢查當前版本是否為最新版本，並提供更新提示
 */
class VersionService {
  constructor() {
    this.currentVersion = Application.nativeApplicationVersion || '1.9.0';
    this.currentBuildNumber = Application.nativeBuildVersion || '1';
    this.latestVersion = null;
    this.updateUrl = null;
  }

  /**
   * 檢查版本更新
   * @returns {Promise<{hasUpdate: boolean, latestVersion: string, updateUrl: string}>}
   */
  async checkForUpdates() {
    try {
      console.log('🔍 [VersionCheck] 開始檢查版本更新...');
      console.log('🔍 [VersionCheck] 當前版本:', this.currentVersion);
      console.log('🔍 [VersionCheck] 當前 Build:', this.currentBuildNumber);
      console.log('🔍 [VersionCheck] 當前平台:', Platform.OS);

      // Web 版本會自動更新，不需要檢查版本
      if (Platform.OS === 'web') {
        console.log('🌐 [VersionCheck] Web 平台 - 跳過版本檢查（自動更新）');
        return {
          hasUpdate: false,
          latestVersion: this.currentVersion,
          updateUrl: null,
          releaseNotes: null,
          forceUpdate: false
        };
      }


      // 從 Supabase 獲取最新版本資訊
      const { data, error } = await supabase
        .from('app_versions')
        .select('version, build_number, update_url, force_update, release_notes')
        .eq('platform', Platform.OS)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log('⚠️ [VersionCheck] 無法獲取版本資訊:', error.message);
        // 如果無法獲取版本資訊，根據環境使用預設值
        const defaultUpdateUrl = this.getDefaultUpdateUrl();
        return {
          hasUpdate: false,
          latestVersion: this.currentVersion,
          updateUrl: defaultUpdateUrl,
          releaseNotes: null,
          forceUpdate: false
        };
      }

      this.latestVersion = data.version;
      // 如果資料庫中有 update_url，使用資料庫的值；否則根據環境決定
      this.updateUrl = data.update_url || this.getDefaultUpdateUrl();

      console.log('🔍 [VersionCheck] 最新版本:', this.latestVersion);
      console.log('🔍 [VersionCheck] 最新 Build:', data.build_number);

      // 比較版本號
      const hasUpdate = this.compareVersions(this.currentVersion, this.latestVersion) < 0;

      console.log('🔍 [VersionCheck] 需要更新:', hasUpdate);

      return {
        hasUpdate,
        latestVersion: this.latestVersion,
        updateUrl: this.updateUrl,
        releaseNotes: data.release_notes,
        forceUpdate: data.force_update,
        buildNumber: data.build_number
      };

    } catch (error) {
      console.error('❌ [VersionCheck] 版本檢查失敗:', error);
      return {
        hasUpdate: false,
        latestVersion: this.currentVersion,
        updateUrl: null,
        releaseNotes: null,
        forceUpdate: false
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
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

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
      console.log('🔗 [VersionCheck] 開啟更新連結:', url);
      
      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(url);
    } catch (error) {
      console.error('❌ [VersionCheck] 無法開啟更新連結:', error);
    }
  }

  /**
   * 獲取當前版本資訊
   */
  getCurrentVersionInfo() {
    return {
      version: this.currentVersion,
      buildNumber: this.currentBuildNumber,
      platform: Platform.OS
    };
  }
}

export const versionService = new VersionService();
