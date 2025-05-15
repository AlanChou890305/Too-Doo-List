import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Use Expo public environment variables
const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  'https://wswsuxoaxbrjxuvvsojo.supabase.co';

const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'fallback-key-do-not-use-in-production';

// Web-specific configuration
const webConfig = {
  auth: {
    persistSession: true,
    storage: window.localStorage,
  },
};

// Mobile-specific configuration
const mobileConfig = {};

// Validate Supabase configuration
if (supabaseUrl.includes('fallback') || supabaseAnonKey.includes('fallback')) {
  console.warn(
    'WARNING: Using fallback Supabase credentials. ' + 
    'Please set REACT_NATIVE_SUPABASE_URL and REACT_NATIVE_SUPABASE_ANON_KEY environment variables.'
  );
}

// Platform-specific Supabase client initialization
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey, 
  Platform.OS === 'web' ? webConfig : mobileConfig
);