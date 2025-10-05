import { Platform } from 'react-native';
import { supabase } from '../supabaseClient';
import ReactGA from 'react-ga4';

export const reportError = async (error, context = {}) => {
  try {
    // Log to console
    console.error('Error reported:', {
      message: error.message,
      stack: error.stack,
      ...context
    });

    // Send to Google Analytics
    ReactGA.exception({
      description: error.message,
      fatal: true
    });

    // Send to Supabase
    await supabase.functions.invoke('report-error', {
      body: {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        user: supabase.auth.getUser(),
      }
    });

  } catch (reportingError) {
    console.error('Failed to report error:', reportingError);
  }
};

// Add global error handler
export const setupGlobalErrorHandler = () => {
  const originalErrorHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, { isFatal });
    originalErrorHandler(error, isFatal);
  });

  // Handle promise rejections
  const originalHandler = Promise.rejectionTracker;
  Promise.rejectionTracker = (reason, promise) => {
    reportError(reason, { promise });
    if (originalHandler) {
      originalHandler(reason, promise);
    }
  };
};
