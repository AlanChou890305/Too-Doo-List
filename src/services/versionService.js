import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { supabase } from '../../supabaseClient';

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

      // 開發環境測試模式 - 強制顯示更新提示
      const isDevelopment = process.env.EXPO_PUBLIC_APP_ENV === 'development';
      if (isDevelopment) {
        console.log('🧪 [VersionCheck] 開發環境測試模式 - 模擬版本更新');
        return {
          hasUpdate: true,
          latestVersion: '1.9.1',
          updateUrl: 'https://apps.apple.com/app/id1234567890', // 暫時使用 App Store 連結
          releaseNotes: '🧪 開發測試版本更新\n\n• 測試版本檢查功能\n• 模擬更新提示\n• 改善用戶體驗\n\n這是開發環境的測試更新！',
          forceUpdate: false,
          buildNumber: '2'
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
        // 如果無法獲取版本資訊，使用預設值
        return {
          hasUpdate: false,
          latestVersion: this.currentVersion,
          updateUrl: null,
          releaseNotes: null,
          forceUpdate: false
        };
      }

      this.latestVersion = data.version;
      this.updateUrl = data.update_url;

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
   * @param {string} updateUrl - 更新 URL
   */
  async openUpdateUrl(updateUrl) {
    try {
      if (Platform.OS === 'ios') {
        // iOS: 開啟 App Store 或 TestFlight
        const { openBrowserAsync } = await import('expo-web-browser');
        await openBrowserAsync(updateUrl);
      } else if (Platform.OS === 'android') {
        // Android: 開啟 Google Play Store
        const { openBrowserAsync } = await import('expo-web-browser');
        await openBrowserAsync(updateUrl);
      }
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
