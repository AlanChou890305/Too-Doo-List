#!/bin/bash

# Xcode Build Script
# Usage: ./scripts/build-xcode.sh [production]

ENV=${1:-production}
SCHEME="ToDo"
BUNDLE_ID="com.cty0305.too.doo.list"

if [ "$ENV" != "production" ]; then
    echo "⚠️  Warning: Only production builds are supported"
    echo "   Building production by default"
fi

echo "📱 Building Production: $SCHEME"

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
