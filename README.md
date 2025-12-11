# ToDo - 待辦清單

一個跨平台的 React Native 待辦事項應用程式，整合了日曆視圖、Google SSO 登入、Supabase 後端，並支援多語言介面（英文與繁體中文）。

## ✨ 特色功能

### 核心功能

- **📅 日曆視圖：** 點選日期即可查看、新增、編輯或移動任務
- **🎯 任務管理：** 輕鬆新增、編輯、刪除和移動任務
- **🔗 URL 連結：** 為任務附加連結，快速存取相關資源
- **⏰ 時間追蹤：** 可選的時間欄位，用於任務排程
- **✅ 任務完成：** 一鍵標記任務為完成

### 使用者體驗

- **🎨 現代化 UI：** 簡潔設計，搭配 Material Icons 與圓角風格
- **🌍 多語言支援：** 英文與繁體中文（台灣）
- **🔐 Google SSO 驗證：** 使用 Google OAuth 安全登入
- **☁️ 雲端儲存：** 任務與使用者設定皆儲存於 Supabase
- **👤 個人化設定：** 根據使用者資料提供個人化體驗
- **⚙️ 設定選項：** 切換語言、查看版本、使用條款與隱私權政策
- **📊 數據分析：** Google Analytics 4 (Web) + Mixpanel (iOS) 使用者行為分析
- **🚀 網頁部署：** 針對 Vercel 部署進行最佳化
- **📱 iOS 主畫面小工具：** 在主畫面直接查看今日任務（午夜自動更新）
- **⚡ 效能優化：** 更快的任務操作與小工具更新速度

## 📁 專案結構

### 核心檔案

- `App.js` - 主要應用程式元件
- `src/` - 原始碼目錄
  - `components/` - React 元件
  - `services/` - API 與商業邏輯
  - `config/` - 設定檔
- `supabase_migration_*.sql` - 資料庫遷移檔案
- `supabaseClient.js` - Supabase 客戶端設定

### 文件

- `README.md` - 本檔案（繁體中文 / English）
- `docs/` - 設定指南與技術文件
  - `SUPABASE_*.md` - Supabase 設定
  - `XCODE_*.md` - iOS/Xcode 設定
  - `archive/` - 封存的指南

## 應用程式截圖

### 淺色模式

|                               截圖 1                                |                               截圖 2                                |                               截圖 3                                |
| :-----------------------------------------------------------------: | :-----------------------------------------------------------------: | :-----------------------------------------------------------------: |
| <img src="docs/screenshots/ToDo - 待辦清單截圖1.jpg" width="200" /> | <img src="docs/screenshots/ToDo - 待辦清單截圖2.jpg" width="200" /> | <img src="docs/screenshots/ToDo - 待辦清單截圖3.jpg" width="200" /> |

### 深色模式

|                               截圖 5                                |                               截圖 6                                |                               截圖 7                                |
| :-----------------------------------------------------------------: | :-----------------------------------------------------------------: | :-----------------------------------------------------------------: |
| <img src="docs/screenshots/ToDo - 待辦清單截圖5.jpg" width="200" /> | <img src="docs/screenshots/ToDo - 待辦清單截圖6.jpg" width="200" /> | <img src="docs/screenshots/ToDo - 待辦清單截圖7.jpg" width="200" /> |

## 📱 使用說明

### 任務管理

- **新增任務：** 點擊「+」按鈕或日曆上的日期
- **編輯任務：** 點擊任何任務以修改標題、連結或時間
- **完成任務：** 點擊核取方塊標記為完成
- **刪除任務：** 在編輯模式中使用刪除按鈕
- **關閉視窗：** 使用 X 按鈕或點擊視窗外部

### 設定

- **切換語言：** 在英文與繁體中文之間切換
- **查看版本：** 確認目前應用程式版本 (v1.1.7)
- **法律資訊：** 查看使用條款與隱私權政策
- **登出：** 安全登出並立即返回登入畫面

## 🛠️ 技術堆疊

### 前端

- **React Native** (Expo) - 跨平台框架
- **React Navigation** - 頁籤與堆疊導航
- **react-native-calendars** - 日曆 UI 元件
- **react-native-svg** - SVG 圖形渲染
- **Material Icons** - 圖示庫

### 後端與服務

- **Supabase** - 身份驗證與 PostgreSQL 資料庫
- **Supabase Edge Functions** - 無伺服器函式
- **Google OAuth 2.0** - SSO 單一登入
- **Google Analytics 4 (react-ga4)** - 網頁使用分析
- **Mixpanel (mixpanel-react-native)** - iOS 分析
- **Vercel** - 網頁部署平台

### 版本管理

- **語意化版本 (Semantic Versioning)** - Major.Minor.Patch (目前 v1.1.7)
- **npm scripts** - version:patch, version:minor, version:major

## 📝 版本資訊

### v1.1.7 (最新版本)

- ✨ **增強提醒設定：** 啟用提醒通知時，現在預設包含三個時間選項（任務前 30、10 和 5 分鐘）
- 🎨 **改善載入體驗：** 為帳號資訊和設定頁面添加骨架載入動畫，提升載入時的視覺體驗
- 🧭 **更好的導航：** 修復了進入設定頁面時意外跳回行事曆的問題
- 🎨 **介面優化：** 改進使用條款和隱私政策的排版，提升閱讀體驗
- 🔧 **代碼品質：** 修復了多項效能問題，包括重複初始化和循環依賴
- 🐛 **錯誤修復：** 修復提醒設定預設值不包含 5 分鐘選項的問題
- 🐛 **錯誤修復：** 修復數據載入完成後導航重置的問題
- 🐛 **錯誤修復：** 修復提醒設定在語言切換時的競態條件問題
- 🌐 **錯誤修復：** 修復 web 版日曆建立按鈕位置問題

## 🤝 貢獻

歡迎貢獻！請提交 Issue 或 Pull Request 來回報錯誤或建議新功能。

## 📄 授權

本專案為私有專案，版權所有。未經授權不得使用、複製或分發。

---

**ToDo - 待辦清單** - 專注於直覺任務管理與日曆介面的 MVP。  
如有回饋或功能請求，請在 GitHub 上開啟 Issue！

---

# ToDo - Task List

A cross-platform React Native task management application with calendar view, Google SSO authentication, Supabase backend, and multi-language support (English and Traditional Chinese).

## ✨ Features

### Core Features

- **📅 Calendar View:** Click on any date to view, add, edit, or move tasks
- **🎯 Task Management:** Easily add, edit, delete, and move tasks
- **🔗 URL Links:** Attach links to tasks for quick access to related resources
- **⏰ Time Tracking:** Optional time field for task scheduling
- **✅ Task Completion:** Mark tasks as complete with one tap

### User Experience

- **🎨 Modern UI:** Clean design with Material Icons and rounded corners
- **🌍 Multi-language Support:** English and Traditional Chinese (Taiwan)
- **🔐 Google SSO Authentication:** Secure login with Google OAuth
- **☁️ Cloud Storage:** Tasks and user settings stored in Supabase
- **👤 Personalized Settings:** Personalized experience based on user data
- **⚙️ Settings Options:** Switch language, view version, terms of use and privacy policy
- **📊 Data Analytics:** Google Analytics 4 (Web) + Mixpanel (iOS) user behavior analysis
- **🚀 Web Deployment:** Optimized for Vercel deployment
- **📱 iOS Home Screen Widget:** View today's tasks directly on the home screen (auto-updates at midnight)
- **⚡ Performance Optimization:** Faster task operations and widget update speeds

## 📁 Project Structure

### Core Files

- `App.js` - Main application component
- `src/` - Source code directory
  - `components/` - React components
  - `services/` - API and business logic
  - `config/` - Configuration files
- `supabase_migration_*.sql` - Database migration files
- `supabaseClient.js` - Supabase client configuration

### Documentation

- `README.md` - This file (Traditional Chinese / English)
- `docs/` - Setup guides and technical documentation
  - `SUPABASE_*.md` - Supabase configuration
  - `XCODE_*.md` - iOS/Xcode configuration
  - `archive/` - Archived guides

## Application Screenshots

### Light Mode

|                            Screenshot 1                             |                            Screenshot 2                             |                            Screenshot 3                             |
| :-----------------------------------------------------------------: | :-----------------------------------------------------------------: | :-----------------------------------------------------------------: |
| <img src="docs/screenshots/ToDo - 待辦清單截圖1.jpg" width="200" /> | <img src="docs/screenshots/ToDo - 待辦清單截圖2.jpg" width="200" /> | <img src="docs/screenshots/ToDo - 待辦清單截圖3.jpg" width="200" /> |

### Dark Mode

|                            Screenshot 5                             |                            Screenshot 6                             |                            Screenshot 7                             |
| :-----------------------------------------------------------------: | :-----------------------------------------------------------------: | :-----------------------------------------------------------------: |
| <img src="docs/screenshots/ToDo - 待辦清單截圖5.jpg" width="200" /> | <img src="docs/screenshots/ToDo - 待辦清單截圖6.jpg" width="200" /> | <img src="docs/screenshots/ToDo - 待辦清單截圖7.jpg" width="200" /> |

## 📱 Usage Instructions

### Task Management

- **Add Task:** Click the "+" button or click on a date in the calendar
- **Edit Task:** Click any task to modify title, link, or time
- **Complete Task:** Click the checkbox to mark as complete
- **Delete Task:** Use the delete button in edit mode
- **Close Window:** Use the X button or click outside the window

### Settings

- **Switch Language:** Toggle between English and Traditional Chinese
- **View Version:** Check current application version (v1.1.7)
- **Legal Information:** View terms of use and privacy policy
- **Sign Out:** Securely sign out and return to login screen

## 🛠️ Tech Stack

### Frontend

- **React Native** (Expo) - Cross-platform framework
- **React Navigation** - Tab and stack navigation
- **react-native-calendars** - Calendar UI component
- **react-native-svg** - SVG graphics rendering
- **Material Icons** - Icon library

### Backend & Services

- **Supabase** - Authentication and PostgreSQL database
- **Supabase Edge Functions** - Serverless functions
- **Google OAuth 2.0** - SSO single sign-on
- **Google Analytics 4 (react-ga4)** - Web usage analytics
- **Mixpanel (mixpanel-react-native)** - iOS analytics
- **Vercel** - Web deployment platform

### Version Management

- **Semantic Versioning** - Major.Minor.Patch (Current: v1.1.7)
- **npm scripts** - version:patch, version:minor, version:major

## 📝 Version Information

### v1.1.7 (Latest)

- ✨ **Enhanced Reminder Settings:** Reminder notifications now default to all three time options (30, 10, and 5 minutes before tasks) when enabled
- 🎨 **Improved Loading Experience:** Added skeleton loading animations for account information and settings while data is being loaded
- 🧭 **Better Navigation:** Fixed issue where navigating to Settings page would unexpectedly redirect back to Calendar
- 🎨 **UI Refinements:** Improved Terms of Use and Privacy Policy layout for better readability
- 🔧 **Code Quality:** Fixed various performance issues including duplicate initializations and circular dependencies
- 🐛 **Bug Fix:** Fixed reminder settings not including 5-minute option by default
- 🐛 **Bug Fix:** Fixed navigation resetting when data finishes loading
- 🐛 **Bug Fix:** Fixed reminder settings race condition when switching language
- 🌐 **Bug Fix:** Fixed web calendar create button position

## 🤝 Contributing

Contributions are welcome! Please submit Issues or Pull Requests to report bugs or suggest new features.

## 📄 License

This project is private and proprietary. All rights reserved. Unauthorized use, copying, or distribution is prohibited.

---

**ToDo - Task List** - An MVP focused on intuitive task management with calendar interface.  
For feedback or feature requests, please open an Issue on GitHub!
