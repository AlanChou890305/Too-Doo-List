// This file ensures the widget directory is tracked and provides setup notes.

# Notion-Style To-Do Calendar Widget Setup

## Expo Widget (Recommended)
- This project uses [expo-widget](https://docs.expo.dev/versions/latest/sdk/widget/) for cross-platform widget support (iOS 17+/Android 12+).
- The widget displays the current week's tasks, similar to TimeTree's weekly view.

## For iOS < 17 or Android < 12
- Native widget support requires additional setup. See Expo docs or React Native community guides.
- You may need to implement a native widget using Swift (iOS) or Kotlin/Java (Android) and connect to your app's local storage.

## Customization
- Edit `WeeklyTasksWidget.js` for widget UI changes.
- The widget data is provided by `widget.js` at the project root.

---

For help, see Expo Widget documentation or open an issue.
