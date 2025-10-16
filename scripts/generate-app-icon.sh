#!/bin/bash

# 生成 App Store 所需的 App Icon
# 需要安裝 ImageMagick: brew install imagemagick

echo "🎨 生成 App Icon..."

# 檢查是否安裝了 ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ 錯誤: 需要安裝 ImageMagick"
    echo "請執行: brew install imagemagick"
    exit 1
fi

# 檢查原始圖片是否存在
if [ ! -f "assets/logo.png" ]; then
    echo "❌ 錯誤: 找不到 assets/logo.png"
    exit 1
fi

# 創建輸出目錄
mkdir -p assets/app-icons

echo "📐 調整圖片為正方形 1024x1024..."

# 方法 1: 使用白色背景填充（如果原圖有透明背景）
convert assets/logo.png \
    -background white \
    -alpha remove \
    -alpha off \
    -resize 1024x1024 \
    -gravity center \
    -extent 1024x1024 \
    assets/app-icons/icon-1024-white-bg.png

echo "✅ 已生成: assets/app-icons/icon-1024-white-bg.png (白色背景)"

# 方法 2: 裁剪並縮放（保持圖片內容，可能會裁切）
convert assets/logo.png \
    -background white \
    -alpha remove \
    -alpha off \
    -resize 1024x1024^ \
    -gravity center \
    -extent 1024x1024 \
    assets/app-icons/icon-1024-cropped.png

echo "✅ 已生成: assets/app-icons/icon-1024-cropped.png (裁剪版)"

# 方法 3: 添加邊距（保持完整圖片，添加白色邊距）
convert assets/logo.png \
    -background white \
    -alpha remove \
    -alpha off \
    -resize 960x960 \
    -gravity center \
    -extent 1024x1024 \
    assets/app-icons/icon-1024-padded.png

echo "✅ 已生成: assets/app-icons/icon-1024-padded.png (帶邊距)"

echo ""
echo "📱 生成完成！請從以下選項中選擇最合適的圖標："
echo ""
echo "1. icon-1024-white-bg.png   - 白色背景版本"
echo "2. icon-1024-cropped.png    - 裁剪版本"
echo "3. icon-1024-padded.png     - 帶邊距版本"
echo ""
echo "選擇後，請將該文件重命名為 icon.png 並放到專案根目錄"
echo ""
echo "預覽圖片："
echo "open assets/app-icons/"

# 自動打開目錄
open assets/app-icons/ 2>/dev/null || echo "請手動開啟 assets/app-icons/ 目錄查看生成的圖標"

