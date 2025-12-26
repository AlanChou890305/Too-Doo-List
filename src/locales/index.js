// Translation files index
// Import all language translations
import en from "./en";
import zhHant from "./zh-Hant";
import es from "./es";

// Export translations object with same structure as before
export const translations = {
  en,
  zh: zhHant, // Map 'zh' to 'zh-Hant' for backward compatibility
  es,
};

// Export default translations
export default translations;
