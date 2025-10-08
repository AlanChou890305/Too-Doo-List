#!/bin/bash

# Too-Doo-List TestFlight Build Script
# 這個腳本會幫你建立 iOS TestFlight 測試版

echo "🚀 Too-Doo-List TestFlight Build Script"
echo "========================================"
echo ""

# 檢查是否登入 EAS
echo "📋 Step 1: 檢查 EAS 登入狀態..."
if ! eas whoami &> /dev/null; then
    echo "❌ 尚未登入 EAS，請先執行: eas login"
    exit 1
fi

echo "✅ 已登入 EAS"
echo ""

# 顯示當前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 當前版本: $CURRENT_VERSION"
echo ""

# 詢問是否要更新版本
read -p "是否要更新版本號？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "請選擇版本更新類型："
    echo "1) Patch (bug fixes): $CURRENT_VERSION -> $(npm version patch --no-git-tag-version 2>/dev/null | tr -d 'v')"
    npm version $CURRENT_VERSION --no-git-tag-version --allow-same-version &> /dev/null
    echo "2) Minor (new features): $CURRENT_VERSION -> $(npm version minor --no-git-tag-version 2>/dev/null | tr -d 'v')"
    npm version $CURRENT_VERSION --no-git-tag-version --allow-same-version &> /dev/null
    echo "3) Major (breaking changes): $CURRENT_VERSION -> $(npm version major --no-git-tag-version 2>/dev/null | tr -d 'v')"
    npm version $CURRENT_VERSION --no-git-tag-version --allow-same-version &> /dev/null
    
    read -p "選擇 (1/2/3): " version_choice
    
    case $version_choice in
        1)
            npm version patch --no-git-tag-version
            ;;
        2)
            npm version minor --no-git-tag-version
            ;;
        3)
            npm version major --no-git-tag-version
            ;;
        *)
            echo "❌ 無效選擇，保持當前版本"
            ;;
    esac
    
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "✅ 版本已更新為: $NEW_VERSION"
fi

echo ""
echo "🔨 Step 2: 開始建立 iOS TestFlight Build..."
echo "這可能需要 10-15 分鐘，請耐心等待..."
echo ""

# 執行 build
eas build --platform ios --profile preview

# 檢查 build 結果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build 完成！"
    echo ""
    echo "📱 下一步："
    echo "1. 前往 https://appstoreconnect.apple.com"
    echo "2. 選擇你的 App"
    echo "3. 進入 TestFlight 標籤"
    echo "4. Build 會自動出現（可能需要幾分鐘處理）"
    echo "5. 新增測試人員並分享 TestFlight 連結"
    echo ""
    echo "🎉 完成！"
else
    echo ""
    echo "❌ Build 失敗，請檢查錯誤訊息"
    echo ""
    echo "💡 常見問題："
    echo "1. 確保已設定 Apple Developer credentials"
    echo "2. 執行: eas credentials 檢查設定"
    echo "3. 確保 Bundle Identifier 正確"
    exit 1
fi

