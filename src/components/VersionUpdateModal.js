import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Application from "expo-application";
import {
  getUpdateUrl,
  getUpdateButtonText,
  getUpdateErrorMessage,
} from "../config/updateUrls";
import { mixpanelService } from "../services/mixpanelService";

const VersionUpdateModal = ({
  visible,
  onClose,
  updateInfo,
  forceUpdate = false,
  theme,
}) => {
  // Web 版本會自動更新，不需要顯示版本更新 modal
  if (Platform.OS === "web") {
    return null;
  }

  // 如果沒有 updateInfo 或不可見，不渲染
  if (!visible || !updateInfo) {
    return null;
  }

  const isDarkMode = theme?.mode === "dark";

  // Mixpanel: 追蹤版本更新提示顯示
  React.useEffect(() => {
    if (visible && updateInfo) {
      mixpanelService.track("Version Update Prompted", {
        current_version: Application.nativeApplicationVersion || "unknown",
        latest_version: updateInfo.latestVersion || "unknown",
        force_update: forceUpdate,
        has_release_notes: !!updateInfo.releaseNotes,
      });
    }
  }, [visible, updateInfo, forceUpdate]);

  const handleUpdate = async () => {
    // Mixpanel: 追蹤用戶點擊更新
    mixpanelService.track("Version Update Clicked", {
      current_version: Application.nativeApplicationVersion || "unknown",
      latest_version: updateInfo?.latestVersion || "unknown",
    });

    try {
      let urlToOpen;

      if (updateInfo?.updateUrl) {
        urlToOpen = updateInfo.updateUrl;
      } else {
        // 根據環境決定預設更新連結
        const appEnv = process.env.EXPO_PUBLIC_APP_ENV || "production";
        urlToOpen = getUpdateUrl(appEnv);
      }

      console.log("🔗 [VersionUpdate] 嘗試開啟 URL:", urlToOpen);

      // 檢查是否為 URL scheme
      if (urlToOpen.startsWith("itms-") || urlToOpen.startsWith("itunes://")) {
        // 使用 Linking API 開啟 URL scheme
        const canOpen = await Linking.canOpenURL(urlToOpen);
        if (canOpen) {
          await Linking.openURL(urlToOpen);
        } else {
          throw new Error("無法開啟 URL scheme");
        }
      } else {
        // 使用 WebBrowser 開啟 HTTP/HTTPS 連結
        await WebBrowser.openBrowserAsync(urlToOpen);
      }
    } catch (error) {
      console.error("❌ [VersionUpdate] 開啟更新連結失敗:", error);

      // 根據環境顯示不同的錯誤訊息
      const appEnv = process.env.EXPO_PUBLIC_APP_ENV || "production";
      const errorMessage = getUpdateErrorMessage(appEnv);

      Alert.alert("Error", errorMessage);
    }
  };

  const handleLater = () => {
    if (!forceUpdate) {
      // Mixpanel: 追蹤用戶點擊稍後更新
      mixpanelService.track("Version Update Dismissed", {
        current_version: Application.nativeApplicationVersion || "unknown",
        latest_version: updateInfo?.latestVersion || "unknown",
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDarkMode ? "#1E1E1E" : "#F8F8F8" },
          ]}
        >
          <View style={styles.contentContainer}>
            <Text
              style={[styles.title, { color: isDarkMode ? "#FFF" : "#000" }]}
            >
              版本更新可用
            </Text>
            {forceUpdate && (
              <Text style={styles.forceUpdateText}>此更新為必要更新</Text>
            )}

            <View
              style={[
                styles.versionBadge,
                { backgroundColor: isDarkMode ? "#3A3A3C" : "#E5E5EA" },
              ]}
            >
              <Text
                style={[
                  styles.versionText,
                  { color: isDarkMode ? "#AEAEB2" : "#8E8E93" },
                ]}
              >
                {updateInfo?.latestVersion || "1.0.0"}
              </Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {updateInfo?.releaseNotes ? (
                <Text
                  style={[
                    styles.message,
                    { color: isDarkMode ? "#FFF" : "#000" },
                  ]}
                >
                  {updateInfo.releaseNotes}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.message,
                    { color: isDarkMode ? "#FFF" : "#000" },
                  ]}
                >
                  我們推出了新版本，包含效能優化與錯誤修正，建議您立即更新以獲得最佳體驗。
                </Text>
              )}
            </ScrollView>
          </View>

          <View
            style={[
              styles.buttonContainer,
              !forceUpdate && styles.buttonContainerHorizontal,
              { borderTopColor: isDarkMode ? "#3F3F3F" : "#A9A9A9" },
            ]}
          >
            {!forceUpdate && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.borderRight,
                  { borderRightColor: isDarkMode ? "#3F3F3F" : "#A9A9A9" },
                ]}
                onPress={handleLater}
                activeOpacity={0.7}
              >
                <Text style={styles.laterButtonText}>稍後更新</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleUpdate}
              activeOpacity={0.7}
            >
              <Text style={styles.updateButtonText}>
                {(() => {
                  const appEnv =
                    process.env.EXPO_PUBLIC_APP_ENV || "production";
                  return getUpdateButtonText(appEnv);
                })()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    borderRadius: 14,
    width: 270,
    maxHeight: "80%",
    overflow: "hidden",
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  forceUpdateText: {
    fontSize: 12,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollView: {
    maxHeight: 150,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 4,
  },
  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  buttonContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  buttonContainerHorizontal: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  borderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  laterButtonText: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "400",
  },
  updateButtonText: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "600",
  },
});

export default VersionUpdateModal;
