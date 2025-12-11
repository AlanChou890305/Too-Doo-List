import React from 'react';
import { View, Platform } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

/**
 * 響應式容器組件
 * 在桌面版加入最大寬度限制，讓內容不會過寬
 */
export const ResponsiveContainer = ({ children, style }) => {
  const { isDesktop } = useResponsive();
  // 這裡我們需要 ThemeContext，但如果它是在 App.js 內部定義的，我們可能需要傳入 theme
  // 或者我們可以簡單地檢查 style 中的 backgroundColor
  
  // Web 平台且桌面尺寸時的樣式
  if (Platform.OS === 'web' && isDesktop) {
    // 簡單的深色模式偵測 (如果 style 中有深色背景)
    const isDark = style?.backgroundColor && style.backgroundColor !== '#ffffff' && style.backgroundColor !== '#fff';
    const pageBg = isDark ? '#121212' : '#f0f2f5';
    const cardBg = isDark ? '#1e1e1e' : '#ffffff';
    
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: pageBg,
        alignItems: 'center',
        minHeight: '100vh',
      }}>
        <View style={[{
          maxWidth: 1024,
          width: '100%',
          flex: 1,
          backgroundColor: cardBg,
          // Web platform uses boxShadow instead of shadow* props
          ...(Platform.OS === 'web' ? {
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
          } : {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 5,
          }),
          marginVertical: 20,
          borderRadius: 12,
          overflow: 'hidden',
        }, style]}>
          {children}
        </View>
      </View>
    );
  }
  
  // 手機/平板維持原樣
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};
