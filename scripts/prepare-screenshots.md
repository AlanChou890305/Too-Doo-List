# App Store 截圖準備指南

## 📱 必要截圖尺寸

### iPhone (必要)

1. **6.7" Display** (iPhone 14 Pro Max, 15 Pro Max, 15 Plus)

   - 尺寸: 1290 x 2796 pixels
   - Device: iPhone 15 Pro Max

2. **6.5" Display** (iPhone 11 Pro Max, XS Max)
   - 尺寸: 1242 x 2688 pixels
   - Device: iPhone 11 Pro Max

### iPad (如果支援)

1. **12.9" Display** (iPad Pro)
   - 尺寸: 2048 x 2732 pixels

## 📸 建議截圖內容（至少 3 張，最多 10 張）

1. **登入畫面**

   - 展示 Google SSO 登入
   - 強調「快速登入」功能

2. **主畫面 - 任務列表**

   - 顯示今日任務
   - 展示乾淨的 UI
   - 包含幾個範例任務

3. **行事曆檢視**

   - 展示月曆界面
   - 顯示任務標記

4. **新增/編輯任務**

   - 展示任務編輯界面
   - 顯示時間選擇、連結等功能

5. **設定頁面**
   - 展示語言切換
   - 用戶資訊
   - App 版本

## 🎨 截圖設計建議

### 使用 Figma 模板

1. 下載 Apple Design Resources
2. 使用 Device Frame
3. 添加標題文字說明功能

### 在線工具

- **Previewed.app** - https://previewed.app
- **Screenshot.rocks** - https://screenshot.rocks
- **Mockuphone** - https://mockuphone.com

### 手動截圖步驟

```bash
# 1. 啟動 iOS Simulator
open -a Simulator

# 2. 選擇裝置
# Hardware > Device > iPhone 15 Pro Max

# 3. 執行 app
npx expo start --ios

# 4. 截圖
# CMD + S 或
xcrun simctl io booted screenshot screenshot1.png

# 5. 調整尺寸（如果需要）
sips -z 2796 1290 screenshot1.png --out screenshot1_resized.png
```

## 📝 截圖文字建議（英文）

### Screenshot 1: Login

**Title**: "Sign in with Google"
**Subtitle**: "Quick and secure authentication"

### Screenshot 2: Task List

**Title**: "Stay Organized"
**Subtitle**: "Manage your daily tasks effortlessly"

### Screenshot 3: Calendar

**Title**: "Plan Ahead"
**Subtitle**: "Visualize your tasks on calendar"

### Screenshot 4: Add Task

**Title**: "Simple & Fast"
**Subtitle**: "Add tasks with time and links"

### Screenshot 5: Settings

**Title**: "Personalize"
**Subtitle**: "Customize your experience"

## 🖼️ 截圖檢查清單

- [ ] 尺寸正確（1290x2796, 1242x2688）
- [ ] 格式為 PNG 或 JPEG
- [ ] 檔案大小 < 500KB
- [ ] 不包含個人真實資料
- [ ] 狀態列顯示滿格訊號、滿電
- [ ] 時間設定為 9:41（Apple 標準）
- [ ] 截圖清晰，無模糊
- [ ] 顏色和品牌一致
- [ ] 文字易讀

## 💡 專業截圖技巧

1. **統一時間**: 所有截圖都用 9:41
2. **清理資料**: 使用範例數據，不要真實個人資料
3. **添加設備框架**: 讓截圖更專業
4. **使用文字說明**: 突出關鍵功能
5. **保持一致性**: 相同的字體、顏色、風格

## 🎯 快速開始

最簡單的方法：

1. 在 iOS Simulator 開啟 app
2. 準備好示範數據
3. 截取 3-5 張關鍵畫面
4. 上傳到 App Store Connect

進階方法：

1. 使用 Figma 設計精美截圖
2. 添加設備框架和說明文字
3. 保持品牌一致性
4. 優化視覺效果
