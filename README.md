# Too-Doo-List

A cross-platform React Native to-do list app with calendar integration, gesture support, persistent storage, and multi-language UI (English & Traditional Chinese).

## Features
- **Calendar View:** Select a day to view, add, edit, or move tasks
- **Drag & Drop:** Move tasks between days with drag-and-drop or swipe gestures
- **Task Management:** Add, edit, delete, and move tasks easily
- **Multi-language Support:** English and 繁體中文(台灣) (Traditional Chinese)
- **Persistent Storage:** Tasks and preferences saved locally with AsyncStorage
- **Settings:** Change language, view terms and privacy policy
- **Google Analytics:** Integrated with ReactGA4 for usage analytics
- **Modern UI:** Material Icons and SVG graphics

## Screenshots
_Add screenshots or GIFs of the main UI, calendar, and settings screens here_

## Getting Started
1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd Too-Doo-List
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the app:**
   ```bash
   npm start
   ```
   - Use the Expo CLI to run on Android, iOS, or Web:
     - `npm run android` — Run on Android device/emulator
     - `npm run ios` — Run on iOS simulator
     - `npm run web` — Run in browser

## Usage
- Tap a date on the calendar to view or add tasks
- Tap a task to edit or delete
- Drag and drop tasks between days
- Change language from the Settings tab
- Access legal info (Terms/Privacy) from Settings

## Tech Stack
- **React Native** (Expo)
- **React Navigation** (tab & stack)
- **AsyncStorage** (persistent storage)
- **react-native-calendars** (calendar UI)
- **react-native-draggable-flatlist** (gestures)
- **react-native-svg** (graphics)
- **Google Analytics (react-ga4)**

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for bug fixes or new features.

## License
_Specify your license here (e.g., MIT, GPL, etc.)_

---

This project is an MVP focused on intuitive task management and calendar UI. For feedback or feature requests, open an issue!
