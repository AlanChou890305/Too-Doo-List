# Release Notes

## 🚀 Unreleased - Version 1.2.7

> **Status**: In Development
> **Planned Features**: 已完成但尚未發布

### Changes Made (2026-02-06)

#### 🎨 Auto Theme Mode
- Added "Auto (Follow System)" theme option
- App now automatically follows iOS system dark/light mode
- Theme selector reordered: Auto → Light → Dark
- Database migration: `20260206_add_auto_theme.sql`
- Default theme changed from "light" to "auto"

#### 📝 Feedback Enhancements
- Added optional "Title" field to feedback form
- Helps users provide more structured feedback
- Fully localized in EN / 繁中 / ES

#### 🎯 UI/UX Improvements
- **Terms & Privacy Pages**:
  - Single card layout (cleaner, less visual noise)
  - Centered page title and last updated date
  - Improved line height (26) for better readability
  - Optimized letter spacing
  - Removed emoji decorations for professional look

#### ⚙️ Version Management
- Optimized version registration workflow
- Development environment no longer auto-activates new versions
- Prevents premature version update prompts
- New versions default to inactive until manually enabled

#### 🗄️ Database
- Migration: `20260206_add_auto_theme.sql` - Add "auto" theme support
- Migration: `20260206_fix_rls_performance.sql` - RLS performance optimization

### Translation Keys Added
- `autoMode`: "Auto (Follow System)" / "自動（跟隨系統）" / "Auto (Seguir sistema)"
- `feedbackTitle`: "Title" / "標題" / "Título"
- `feedbackTitlePlaceholder`: Brief summary prompts
- `optional`: "Optional" / "選填" / "Opcional"

---

### Changes Made (2026-02-08)

#### 🌐 Internationalization (i18n) Improvements
- **Fixed Hardcoded Alert Messages**:
  - Replaced 5 hardcoded alert messages with localized translations
  - Account creation success messages now support all languages
  - Sign-in error messages now properly localized
  - User type update error messages now use translation system

#### 🛠️ Code Quality Improvements
- **Removed Duplicate Code**:
  - Removed duplicate `document.title` setting logic in App.js
  - Consolidated into single MutationObserver-based implementation

- **Production Console Optimization**:
  - Added `babel-plugin-transform-remove-console` for production builds
  - Console.log statements automatically removed in production (389 instances)
  - Kept console.error and console.warn for critical logging
  - Created `src/utils/logger.js` utility for future use

#### 🎨 UI Bug Fixes
- **Settings Page**:
  - Fixed duplicate separator line between Privacy Policy and Version sections
  - All separators now have consistent thickness (height: 1)

#### 📦 Dependencies
- Added: `babel-plugin-transform-remove-console@^6.9.4`

### Translation Keys Added (2026-02-08)
- `accountCreatedSuccess`: "Account created successfully! Welcome to TaskCal!" / "帳號建立成功！歡迎使用 TaskCal！"
- `accountCreatedPartial`: "Account created but some settings could not be saved..." / "帳號已建立，但部分設定無法儲存..."
- `signInError`: "Sign In Error" / "登入錯誤"
- `error`: "Error" / "錯誤"
- `ok`: "OK" / "確定"
- `failedToUpdateUserType`: "Failed to update user type" / "無法更新使用者類型"

---

# Release Notes - Version 1.2.6

## Version Information

- **Version**: 1.2.6
- **Build**: 14
- **Release Date**: 2026-02-03
- **Platform**: iOS

---

## English (U.S.)

### 1. Promotional Text (促銷文字)

Lightning-fast task manager with calendar view! Organize by date, set smart reminders, sync across devices. New: Home Screen Widget & faster loading. Free download now!

### 2. Description (描述)

TaskCal - A calendar-based task list iOS App

I had too many things I wanted to do but was too lazy to do them, so I just built an app myself to track what I need to complete each day.

If you're like me and need a simple way to keep track of your tasks, TaskCal might help. It's a calendar-based task manager that shows everything in a clean calendar view, so you can see what's coming up at a glance.

Key Features:

- Calendar View: See all your tasks organized by date
- Smart Reminders: Never forget important deadlines
- Easy Task Management: Add, edit, and organize tasks quickly
- Sync Everywhere: Your tasks sync across all devices automatically
- Home Screen Widget: Check today's tasks without opening the app
- Multiple Languages: English, Traditional Chinese, and Spanish
- Dark Mode: Easy on the eyes for late-night planning
- Quick Sign-In: Sign in with Google or Apple

Give it a try and see if it helps you stay on top of things!

### 3. What's New in Version 1.2.6 (版本更新說明)

Visual & User Experience Improvements

- Redesigned splash screen with optimized logo for faster app launch
- Improved login screen with better visual hierarchy
- Enhanced widget empty state with friendly "All done for today!" message
- Better multilingual support for version update notifications
- Refined overall app appearance for a more polished experience

### 4. Keywords (關鍵字)

task,calendar,todo,reminder,productivity,organizer,planner,schedule,note,list,manager,google,multilingual,darkmode,widget,sync,free

---

## 繁體中文 (台灣)

### 1. Promotional Text (促銷文字)

超快速任務管理應用程式！日曆檢視、智能提醒、跨裝置同步。全新：主畫面小工具與更快的載入速度。立即免費下載！

### 2. Description (描述)

TaskCal - 日曆型的待辦任務清單 iOS App

我有太多想做但又懶得做的事，所以乾脆自己做一個 App，記錄每天要完成哪些事。

如果你也跟我一樣，需要一個簡單的方式來追蹤任務，TaskCal 可能會幫到你。這是一個日曆型的任務管理 App，用清楚的日曆檢視把所有事情都列出來，一眼就能看到接下來要做什麼。

主要功能：

- 日曆檢視：按日期查看所有任務
- 智能提醒：重要截止日期自動提醒，不會忘記
- 簡單管理：快速新增、編輯和整理任務
- 自動同步：所有裝置自動同步，隨時都能查看
- Widget 小工具：不用打開 App，就能在主畫面看到今天的任務
- 多語言支援：繁體中文、英文、西班牙文
- 深色模式：晚上用起來也不刺眼
- 快速登入：Google 或 Apple 帳號登入

試試看吧，希望對你有幫助！

### 3. What's New in Version 1.2.6 (版本更新說明)

視覺與使用體驗改善

- 重新設計啟動畫面，使用優化的 Logo，啟動更快速
- 改善登入畫面的視覺層級，更清楚易讀
- Widget 空狀態顯示更友善的「All done for today!」訊息
- 版本更新通知支援多語系，更貼近使用者語言
- 整體介面細節優化，使用體驗更流暢

### 4. Keywords (關鍵字)

任務,日曆,待辦,提醒,生產力,規劃,行程,筆記,清單,管理,同步,免費,多語言,深色模式,小工具

---

## Español (España)

### 1. Promotional Text (促銷文字)

¡Gestor de tareas ultrarrápido con vista de calendario! Organiza por fecha, configura recordatorios inteligentes, sincroniza entre dispositivos. Nuevo: Widget de pantalla de inicio y carga más rápida. ¡Descarga gratis ahora!

### 2. Description (描述)

TaskCal - Una aplicación iOS de lista de tareas basada en calendario

Tenía demasiadas cosas que quería hacer pero era demasiado perezoso para hacerlas, así que simplemente creé una aplicación para rastrear lo que necesito completar cada día.

Si eres como yo y necesitas una forma sencilla de hacer un seguimiento de tus tareas, TaskCal podría ayudarte. Es un gestor de tareas basado en calendario que muestra todo en una vista de calendario clara, para que puedas ver lo que viene de un vistazo.

Características Principales:

- Vista de Calendario: Ve todas tus tareas organizadas por fecha
- Recordatorios Inteligentes: Nunca olvides fechas límite importantes
- Gestión Fácil de Tareas: Añade, edita y organiza tareas rápidamente
- Sincronización Universal: Tus tareas se sincronizan automáticamente en todos los dispositivos
- Widget de Pantalla de Inicio: Consulta las tareas de hoy sin abrir la aplicación
- Múltiples Idiomas: Inglés, Chino Tradicional y Español
- Modo Oscuro: Fácil para la vista para planificar de noche
- Inicio de Sesión Rápido: Inicia sesión con Google o Apple

¡Pruébalo y ve si te ayuda a mantener todo bajo control!

### 3. What's New in Version 1.2.6 (版本更新說明)

Mejoras Visuales y de Experiencia de Usuario

- Pantalla de inicio rediseñada con logo optimizado para un lanzamiento más rápido
- Pantalla de inicio de sesión mejorada con mejor jerarquía visual
- Estado vacío del widget mejorado con mensaje amigable "All done for today!"
- Mejor soporte multilingüe para notificaciones de actualización de versión
- Apariencia general refinada para una experiencia más pulida

### 4. Keywords (關鍵字)

tarea,calendario,pendiente,recordatorio,productividad,organizador,planificador,horario,nota,lista,gestor,sincronizar,gratis,multilingüe,modo oscuro,widget

---

## 📝 Release Checklist

### Pre-Release

- [x] Update version number in all files (1.2.6)
- [x] Update build number in all files (14)
- [x] Update RELEASE_NOTES.md
- [ ] Test npm start (React Native)
- [ ] Test iOS Widget build in Xcode
- [ ] Test on physical device
- [ ] Verify splash screen and login screen improvements
- [ ] Verify Widget empty state improvements
  - [ ] Time on right side with purple color
  - [ ] Time format shows hh:mm only
  - [ ] Proper spacing between tasks
  - [ ] Reduced vertical padding
- [ ] Test Widget data sync

### Xcode Build

- [ ] Clean Build Folder
- [ ] Archive for App Store
- [ ] Upload to App Store Connect

### Supabase Setup

- [ ] Register new version in app_versions table
- [ ] Copy release notes from this file (Traditional Chinese section)
- [ ] Verify version is active

### App Store Connect

- [ ] Select build 13
- [ ] Copy "What's New" from this file
- [ ] Submit for review

### Post-Release

- [ ] Monitor crash reports
- [ ] Check Widget performance on iOS 17+
- [ ] Verify version update prompt works for older versions
- [ ] Git commit and push

---

## 🔄 Version History

### v1.2.5 (Build 13) - 2026-02-01
- Fixed iOS 17+ Widget background compatibility
- Redesigned Widget UI layout
- Improved Widget space utilization
- Enhanced Widget visual design

### v1.2.4 (Build 12) - 2026-02-01
- Fixed calendar navigation bug
- Enhanced today indicator visibility
- Improved analytics tracking
- Backend optimizations

### v1.2.3 (Build 11)
- In-app version update checking
- Google Maps preview for task links
- AdMob integration
- Performance improvements

### v1.2.2
- Widget functionality
- Data preloading optimization
- Note field auto-expansion

---

**文檔版本**: 1.2.5
**最後更新**: 2026-02-01
