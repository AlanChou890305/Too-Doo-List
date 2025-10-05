# Too-Doo-List

A cross-platform React Native to-do list app with calendar integration, Google SSO authentication, Supabase backend, and multi-language UI (English & Traditional Chinese).

## Features
- **Calendar View:** Select a day to view, add, edit, or move tasks
- **Drag & Drop:** Move tasks between days with drag-and-drop or swipe gestures
- **Task Management:** Add, edit, delete, and move tasks easily
- **Google SSO Authentication:** Secure login with Google OAuth
- **Cloud Storage:** Tasks and user settings stored in Supabase
- **Multi-language Support:** English and 繁體中文(台灣) (Traditional Chinese)
- **User Profiles:** Personalized experience with user-specific data
- **Settings:** Change language, view terms and privacy policy
- **Google Analytics:** Integrated with ReactGA4 for usage analytics
- **Modern UI:** Material Icons and SVG graphics
- **Web Deployment:** Ready for deployment on Netlify

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
   git clone https://github.com/Cty0305/Too-Doo-List.git
   cd Too-Doo-List
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase:**
   - Create a new Supabase project
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

#### Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npx expo export --platform web --output-dir dist`
   - Publish directory: `dist`
3. Set environment variables in Netlify dashboard
4. Deploy!

## Usage
- Tap a date on the calendar to view or add tasks
- Tap a task to edit or delete
- Drag and drop tasks between days
- Change language from the Settings tab
- Access legal info (Terms/Privacy) from Settings

## Tech Stack
- **React Native** (Expo)
- **React Navigation** (tab & stack)
- **Supabase** (authentication & database)
- **Google OAuth** (SSO authentication)
- **react-native-calendars** (calendar UI)
- **react-native-draggable-flatlist** (gestures)
- **react-native-svg** (graphics)
- **Google Analytics (react-ga4)**
- **Netlify** (web deployment)

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for bug fixes or new features.

## License
_Specify your license here (e.g., MIT, GPL, etc.)_

---

This project is an MVP focused on intuitive task management and calendar UI. For feedback or feature requests, open an issue!
