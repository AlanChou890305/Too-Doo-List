# Too-Doo-List

A cross-platform React Native to-do list app with calendar integration, Google SSO authentication, Supabase backend, and multi-language UI (English & Traditional Chinese).

🌐 **Live Demo:** [https://to-do-mvp.netlify.app/](https://to-do-mvp.netlify.app/)

## ✨ Features

### Core Functionality

- **📅 Calendar View:** Select a day to view, add, edit, or move tasks
- **🎯 Task Management:** Add, edit, delete, and move tasks with ease
- **🔗 URL Links:** Attach links to tasks for quick access to resources
- **⏰ Time Tracking:** Optional time fields for task scheduling
- **✅ Task Completion:** Mark tasks as done with a single tap

### User Experience

- **🎨 Modern UI:** Clean design with Material Icons and rounded corners
- **🌍 Multi-language Support:** English and 繁體中文(台灣) (Traditional Chinese)
- **🔐 Google SSO Authentication:** Secure login with Google OAuth
- **☁️ Cloud Storage:** Tasks and user settings stored in Supabase
- **👤 User Profiles:** Personalized experience with user-specific data
- **⚙️ Settings:** Change language, view app version, terms and privacy policy
- **📊 Google Analytics:** Integrated with ReactGA4 for usage analytics (GA4 ID: G-NV40E1BDH3)
- **🚀 Web Deployment:** Optimized for Netlify deployment

## Screenshots

_Add screenshots or GIFs of the main UI, calendar, and settings screens here_

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI
- Supabase account
- Google Cloud Platform account (for OAuth)

### Setup Instructions

1. **Clone the repo:**

   ```bash
   git clone https://github.com/AlanChou890305/Too-Doo-List.git
   cd Too-Doo-List
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   
   Create a `.env.local` file in the root directory:

   ```bash
   # Staging 環境（本地開發預設）
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_SUPABASE_URL_DEV=your_staging_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your_staging_anon_key
   ```
   
   詳細配置請參考 [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

4. **Set up Supabase:**

   - 本專案使用雙環境架構（Staging + Production）
   - Staging: `to-do-staging` (qerosiozltqrbehctxdn)
   - Production: `to-do-production` (ajbusqpjsjcuzzxuueij)
   - 詳細設定請參考 [SUPABASE_ENVIRONMENTS.md](./SUPABASE_ENVIRONMENTS.md)
   - Run the database migrations (see `SUPABASE_SETUP.md`)
   - Configure Google OAuth (see `GOOGLE_OAUTH_SETUP.md`)

5. **Run the app:**
   ```bash
   npm start
   ```
   - Use the Expo CLI to run on Android, iOS, or Web:
     - `npm run android` — Run on Android device/emulator
     - `npm run ios` — Run on iOS simulator
     - `npm run web` — Run in browser

### Deployment

本專案採用雙環境架構：

#### Vercel Deployment（推薦）

**Staging 環境:**
- Git Branch: `develop`
- Domain: `to-do-staging.vercel.app`
- Supabase: `to-do-staging`

**Production 環境:**
- Git Branch: `main`
- Domain: `to-do-mvp.vercel.app`
- Supabase: `to-do-production`

詳細設定請參考 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

#### 快速部署步驟

1. 在 Vercel 創建兩個專案（Staging & Production）
2. 設定環境變數（參考 [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)）
3. 連接 Git Repository
4. 自動部署！

## 📱 Usage

### Task Management

- **Add Tasks:** Tap the "+" button or a date on the calendar
- **Edit Tasks:** Tap any task to modify title, URL, or time
- **Complete Tasks:** Tap the checkbox to mark as done
- **Delete Tasks:** Use the delete button in edit mode
- **Close Modal:** Use the X button or tap outside the modal

### Settings

- **Change Language:** Switch between English and Traditional Chinese
- **View Version:** Check current app version (v1.0.1)
- **Legal Info:** Access Terms of Use and Privacy Policy
- **Logout:** Secure logout with immediate navigation to login screen

## 🛠️ Tech Stack

### Frontend

- **React Native** (Expo) - Cross-platform framework
- **React Navigation** - Tab & stack navigation
- **react-native-calendars** - Calendar UI component
- **react-native-svg** - SVG graphics rendering
- **Material Icons** - Icon library

### Backend & Services

- **Supabase** - Authentication & PostgreSQL database
- **Google OAuth 2.0** - SSO authentication
- **Google Analytics 4 (react-ga4)** - Usage analytics
- **Netlify** - Web deployment platform

### Version Management

- **Semantic Versioning** - Major.Minor.Patch (currently v1.0.1)
- **npm scripts** - version:patch, version:minor, version:major

## 📝 Changelog

### v1.0.1 (2025-10-07)

- ✨ Add rounded white background to logo and favicon
- 🔄 Update GA4 tracking ID to G-NV40E1BDH3
- 🚪 Optimize logout flow (remove confusing success message)
- ✨ Add close button (X) to task creation/edit modal
- 🐛 Fix URL field not persisting on first save
- 📊 Add version display in settings page
- 🔧 Add version management scripts (patch/minor/major)
- ⌨️ Change Enter key behavior to save task directly

### v1.0.0 (2025-05-12)

- 🎉 Initial release
- 📅 Calendar view with task management
- 🔐 Google SSO authentication
- 🌍 Multi-language support (EN/繁中)
- ☁️ Supabase cloud storage

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for bug fixes or new features.

## 📄 License

_Specify your license here (e.g., MIT, GPL, etc.)_

---

**Too-Doo-List** - An MVP focused on intuitive task management and calendar UI.  
For feedback or feature requests, please open an issue on GitHub!
