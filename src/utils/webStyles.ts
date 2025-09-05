import { Platform } from 'react-native';

// Web-specific style utilities
export const getWebSafeStyle = (style: any) => {
  if (Platform.OS === 'web') {
    // Convert React Native styles to web-compatible styles
    const webStyle = { ...style };
    
    // Handle shadow properties for web
    if (webStyle.shadowColor) {
      webStyle.boxShadow = `${webStyle.shadowOffset?.width || 0}px ${webStyle.shadowOffset?.height || 0}px ${webStyle.shadowRadius || 0}px ${webStyle.shadowColor}`;
      delete webStyle.shadowColor;
      delete webStyle.shadowOffset;
      delete webStyle.shadowRadius;
      delete webStyle.shadowOpacity;
    }
    
    // Handle elevation for web
    if (webStyle.elevation) {
      webStyle.boxShadow = `0px ${webStyle.elevation}px ${webStyle.elevation * 2}px rgba(0,0,0,0.3)`;
      delete webStyle.elevation;
    }
    
    return webStyle;
  }
  
  return style;
};

// Web-specific responsive utilities
export const getResponsiveValue = (mobile: any, web: any) => {
  return Platform.OS === 'web' ? web : mobile;
};

// Web-specific font scaling
export const getWebFontSize = (size: number) => {
  if (Platform.OS === 'web') {
    // Scale fonts slightly for web
    return size * 1.1;
  }
  return size;
};
