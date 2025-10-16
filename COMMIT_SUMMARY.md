# Commit Summary - v1.6.0

## 📋 本次提交內容

### 🔧 配置更新
- ✅ 更新 Vercel URL: `too-doo-list.vercel.app` → `to-do-mvp.vercel.app`
- ✅ 設定 Associated Domains: `applinks:to-do-mvp.vercel.app`
- ✅ 設定 iOS Deployment Target: 13.0+
- ✅ 更新 Navigation linking prefixes

### 🐛 Bug 修復
- ✅ 修復 TestFlight App 重複導航問題（添加 `hasNavigated` 標記）
- ✅ 修復 URL routing（Terms 和 Privacy 頁面 URL 正確更新）

### 📱 App Store 準備
- ✅ 新增 `APP_STORE_SUBMISSION_CHECKLIST.md` - 完整上架檢查清單
- ✅ 新增 `QUICK_FIX_FOR_APP_STORE.md` - 快速上架指南
- ✅ 新增 `PROJECT_STATUS.md` - 專案狀態總覽
- ✅ 新增 `scripts/generate-app-icon.sh` - App Icon 生成腳本

### 🧹 文件清理
刪除不必要的文檔：
- ❌ `APP_STORE_GUIDE.md` - 已整合到新文檔
- ❌ `APP_STORE_METADATA.md` - 已整合到新文檔
- ❌ `CHANGELOG_v1.5.0.md` - 舊版本 changelog
- ❌ `DARK_MODE_IMPLEMENTATION.md` - 功能已實現
- ❌ `DEBUG_PLATFORM_THEME_ISSUES.md` - 問題已修復
- ❌ `DEPLOYMENT_STEPS.md` - 已整合到其他文檔
- ❌ `HOW_TO_ADD_MULTIPLE_REMINDERS.md` - 功能未實現
- ❌ `NOTIFICATION_FEATURE.md` - 非必需
- ❌ `SHARE_GUIDE.md` - 功能未實現
- ❌ `SUPABASE_USER_SETTINGS_SETUP.md` - 已整合
- ❌ `TABLE_STRUCTURE_CONFIRMATION.md` - 已整合

### 🎨 資產更新
- ✅ 更新 App Icon (assets/logo.png)

---

## 測試狀態

### ✅ 已測試通過
- Web 版 Google OAuth 登入
- iOS App Google OAuth 登入
- URL Routing (Terms, Privacy 頁面)
- Deep Linking
- 導航流程

---

## 版本資訊

- **版本**: 1.6.0
- **類型**: MINOR (新增功能)
- **主要變更**:
  - URL routing 支援
  - Platform 偵測和追蹤
  - 用戶設定增強
  - Navigation 優化

---

**準備狀態**: 🚀 準備上架 App Store

