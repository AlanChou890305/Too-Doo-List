import React from 'react';
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
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getUpdateUrl, getUpdateButtonText, getUpdateErrorMessage } from '../config/updateUrls';

const VersionUpdateModal = ({ 
  visible, 
  onClose, 
  updateInfo,
  forceUpdate = false 
}) => {
  // Web 版本會自動更新，不需要顯示版本更新 modal
  if (Platform.OS === 'web') {
    return null;
  }

  // 如果沒有 updateInfo 或不可見，不渲染
  if (!visible || !updateInfo) {
    return null;
  }

  const handleUpdate = async () => {
    try {
      let urlToOpen;
      
      if (updateInfo?.updateUrl) {
        urlToOpen = updateInfo.updateUrl;
      } else {
        // 根據環境決定預設更新連結
        const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'production';
        urlToOpen = getUpdateUrl(appEnv);
      }

      console.log('🔗 [VersionUpdate] 嘗試開啟 URL:', urlToOpen);

      // 檢查是否為 URL scheme
      if (urlToOpen.startsWith('itms-') || urlToOpen.startsWith('itunes://')) {
        // 使用 Linking API 開啟 URL scheme
        const canOpen = await Linking.canOpenURL(urlToOpen);
        if (canOpen) {
          await Linking.openURL(urlToOpen);
        } else {
          throw new Error('無法開啟 URL scheme');
        }
      } else {
        // 使用 WebBrowser 開啟 HTTP/HTTPS 連結
        await WebBrowser.openBrowserAsync(urlToOpen);
      }
    } catch (error) {
      console.error('❌ [VersionUpdate] 開啟更新連結失敗:', error);
      
      // 根據環境顯示不同的錯誤訊息
      const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'production';
      const errorMessage = getUpdateErrorMessage(appEnv);
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleLater = () => {
    if (!forceUpdate) {
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
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              版本更新可用
            </Text>
            {forceUpdate && (
              <Text style={styles.forceUpdateText}>
                此更新為必要更新
              </Text>
            )}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.versionInfo}>
              <Text style={styles.currentVersion}>
                當前版本: 1.9.0-dev
              </Text>
              <Text style={styles.latestVersion}>
                最新版本: {updateInfo?.latestVersion || '1.9.1'}
              </Text>
            </View>

            {updateInfo?.releaseNotes && (
              <View style={styles.releaseNotesContainer}>
                <Text style={styles.releaseNotesTitle}>
                  更新內容
                </Text>
                <Text style={styles.releaseNotes}>
                  {updateInfo.releaseNotes}
                </Text>
              </View>
            )}

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>
                更新好處
              </Text>
              <Text style={styles.benefitItem}>
                • 錯誤修正和穩定性改善
              </Text>
              <Text style={styles.benefitItem}>
                • 新功能和改進
              </Text>
              <Text style={styles.benefitItem}>
                • 安全性更新
              </Text>
              <Text style={styles.benefitItem}>
                • 性能優化
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            {!forceUpdate && (
              <TouchableOpacity
                style={[styles.button, styles.laterButton]}
                onPress={handleLater}
              >
                <Text style={styles.laterButtonText}>
                  稍後更新
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>
                {(() => {
                  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || 'production';
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    minHeight: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  forceUpdateText: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 0,
  },
  versionInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  currentVersion: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  latestVersion: {
    fontSize: 16,
    color: '#6c63ff',
    fontWeight: '600',
  },
  releaseNotesContainer: {
    marginBottom: 20,
  },
  releaseNotesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  releaseNotes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    paddingBottom: 10,
  },
  benefitsContainer: {
    marginBottom: 10,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  benefitItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  laterButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  laterButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#6c63ff',
  },
  updateButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default VersionUpdateModal;