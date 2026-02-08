# Release Notes - Version 1.2.7 (Build 15)

**Release Date**: 2026-02-08

---

## What's New

### English
- Fixed critical bug preventing users from creating new tasks
- Improved Rate Us functionality for better user feedback experience
- Enhanced app stability and reliability

### 繁體中文
- 修正無法新增任務的嚴重錯誤
- 改善評分功能，提供更好的使用者回饋體驗
- 增強應用程式穩定性與可靠性

### Español
- Corregido error crítico que impedía crear nuevas tareas
- Mejorada funcionalidad de valoración para mejor experiencia de usuario
- Mayor estabilidad y fiabilidad de la aplicación

---

## Promotional Text (App Store)

### English
Critical bug fix update! We've resolved an issue that prevented task creation. Your productivity companion is now more reliable than ever. Update now for the best experience!

### 繁體中文
重要錯誤修正更新！我們解決了無法新增任務的問題。您的生產力夥伴現在比以往更加可靠。立即更新以獲得最佳體驗！

### Español
¡Actualización crítica de errores! Hemos resuelto un problema que impedía crear tareas. Tu compañero de productividad es ahora más fiable que nunca. ¡Actualiza ahora para la mejor experiencia!

---

## Keywords

task management, todo list, productivity, calendar widget, iOS widget, task organizer, daily planner, time management, reminder app, task tracker

---

## Technical Details

### Fixed Issues
- **CalendarScreen Import Error**: Fixed incorrect function names in notification service imports (`scheduleTaskNotifications` → `scheduleTaskNotification`)
- **Missing Import**: Added `getActiveReminderMinutes` import from `notificationConfig`
- **Rate Us Modal**: Removed early return to ensure custom modal always displays as fallback

### Impact
- **Before**: Users encountered "Failed to save task" error when creating new tasks
- **After**: Task creation works correctly and reliably

---

## Release Checklist

- [ ] Version numbers updated in all 9 locations
- [ ] RELEASE_NOTES.md updated
- [ ] README.md version information updated
- [ ] App tested on simulator
- [ ] Widget tested and working
- [ ] Xcode Archive successful
- [ ] App Store Connect submission ready

---

## Migration Notes

No migration required. This is a bug fix release with no breaking changes or data structure modifications.
