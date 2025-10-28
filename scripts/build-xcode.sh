#!/bin/bash

# Xcode Build Script
# Usage: ./scripts/build-xcode.sh [production|staging]

ENV=${1:-production}
SCHEME=""
BUNDLE_ID=""

if [ "$ENV" = "production" ]; then
    SCHEME="ToDo"
    BUNDLE_ID="com.cty0305.too.doo.list"
    echo "📱 Building Production: $SCHEME"
elif [ "$ENV" = "staging" ]; then
    SCHEME="To Do Staging"
    BUNDLE_ID="com.cty0305.too.doo.list.staging"
    echo "🧪 Building Staging: $SCHEME"
else
    echo "❌ Invalid environment: $ENV"
    echo "Usage: ./scripts/build-xcode.sh [production|staging]"
    exit 1
fi

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  Warning: .env.local exists"
    echo "   Consider renaming it to avoid conflicts"
fi

# Export environment
export EXPO_PUBLIC_APP_ENV=$ENV

# Prebuild
echo "🔨 Running expo prebuild..."
npx expo prebuild --clean --platform ios

# Install pods
echo "📦 Installing CocoaPods..."
cd ios && pod install && cd ..

# Open Xcode
echo "📱 Opening Xcode..."
open ios/ToDo.xcworkspace

echo "✅ Done! Remember to:"
echo "  1. Select scheme: $SCHEME"
echo "  2. Verify Bundle ID: $BUNDLE_ID"
echo "  3. Archive and upload"
