import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

/**
 * 響應式設計 Hook
 * 偵測螢幕尺寸並提供響應式斷點
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // 非 Web 平台直接返回當前尺寸
      return;
    }
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  const width = dimensions.width;
  const height = dimensions.height;
  
  return {
    width,
    height,
    // 斷點定義
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLargeDesktop: width >= 1440,
    
    // 實用工具
    getResponsiveValue: (mobile, tablet, desktop) => {
      if (width >= 1024) return desktop;
      if (width >= 768) return tablet;
      return mobile;
    },
  };
};
