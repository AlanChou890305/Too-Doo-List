/**
 * 更新連結配置
 * 根據不同環境提供相應的更新連結
 * 注意：本專案僅支援 iOS 平台
 */

export const UPDATE_URLS = {
  staging: "itms-beta://beta.itunes.apple.com/v1/app/6754549585", // TestFlight App ID
  production: "itms-apps://itunes.apple.com/app/id6753785239", // App Store App ID
};

/**
 * 根據環境獲取更新連結
 * @param {string} environment - 環境 ('staging', 'production')
 * @returns {string} 更新連結
 */
export const getUpdateUrl = (environment) => {
  const url = UPDATE_URLS[environment];
  if (!url) {
    console.warn(`不支援的環境: ${environment}`);
    return UPDATE_URLS.production; // 預設回退到 production
  }

  return url;
};

/**
 * 根據環境獲取更新按鈕文字
 * @param {string} environment - 環境 ('staging', 'production')
 * @returns {string} 按鈕文字
 */
export const getUpdateButtonText = (environment) => {
  return "立即更新";
};

/**
 * 根據環境獲取錯誤訊息
 * @param {string} environment - 環境 ('staging', 'production')
 * @returns {string} 錯誤訊息
 */
export const getUpdateErrorMessage = (environment) => {
  if (environment === "staging") {
    return "無法開啟更新連結，請手動前往 TestFlight 檢查更新。";
  } else {
    return "無法開啟更新連結，請手動前往 App Store 檢查更新。";
  }
};
