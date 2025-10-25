#!/bin/bash

# 設定 staging 環境變數
export EXPO_PUBLIC_APP_ENV=staging

# 顯示環境變數
echo "🔍 Building with environment: $EXPO_PUBLIC_APP_ENV"
echo "🔍 Supabase URL DEV: $EXPO_PUBLIC_SUPABASE_URL_DEV"
echo "🔍 Supabase URL STAGING: $EXPO_PUBLIC_SUPABASE_URL_STAGING"
echo "🔍 Supabase URL: $EXPO_PUBLIC_SUPABASE_URL"

# 使用 EAS 構建
eas build --platform ios --profile preview --env EXPO_PUBLIC_APP_ENV=staging
