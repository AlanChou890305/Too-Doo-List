#!/bin/bash

# 啟動 Metro Bundler 開發伺服器
echo "🚀 啟動 Metro Bundler 開發伺服器..."
echo "📱 確保你的 iPhone 和電腦在同一個 Wi-Fi 網絡上"
echo ""

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤: 未找到 Node.js，請先安裝 Node.js"
    exit 1
fi

# 啟動 Expo 開發伺服器
npm start

