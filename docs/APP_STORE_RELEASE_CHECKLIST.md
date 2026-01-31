# App Store 發布檢查清單

## 📋 完整發布流程

每次發布新版本到 App Store 時，按照以下步驟操作：

---

## 1️⃣ 更新版本號（在推送前）

### 更新所有版本文件

- [ ] `package.json` → `"version": "1.2.4"`
- [ ] `app.config.js` → `version: "1.2.4"`, `iosBuildNumber: "12"`
- [ ] `src/services/versionService.js` → `currentVersion: "1.2.4"`, `currentBuildNumber: "12"`
- [ ] `ios/TaskCal/Info.plist` → `CFBundleShortVersionString: "1.2.4"`, `CFBundleVersion: "12"`
- [ ] `ios/TaskCalWidget/Info.plist` → （使用變數，會自動同步）
- [ ] `ios/TaskCal.xcodeproj/project.pbxproj` → `MARKETING_VERSION = 1.2.4`, `CURRENT_PROJECT_VERSION = 12`

### 更新 Release Notes

- [ ] 更新 `RELEASE_NOTES.md` - 包含三語言版本（繁中、英文、西文）
- [ ] 更新 `README.md` - 版本資訊改為最新版本
- [ ] 確保 What's New 內容清晰明確

---

## 2️⃣ 在 Xcode 中 Archive

- [ ] 清理專案：Product → Clean Build Folder
- [ ] 確認 Scheme 和 Configuration 正確
- [ ] Archive：Product → Archive
- [ ] Distribute App → App Store Connect → Upload
- [ ] 等待 Archive 上傳完成

---

## 3️⃣ 在 Supabase 中登記新版本（重要！）

**⚠️ 這一步決定了用戶是否能看到 Release Notes！**

### 方法 A：使用輔助腳本（推薦）

1. 打開 `supabase_helper_insert_version.sql`
2. 修改以下內容：
   - `version`: 更新為新版本號（例如 "1.2.4"）
   - `build_number`: 更新為新 Build 號（例如 "12"）
   - `release_notes`: 從 `RELEASE_NOTES.md` 複製繁體中文的 What's New 內容
   - `force_update`: 是否強制更新（通常為 `false`）
3. 在 Supabase SQL Editor 中執行

### 方法 B：手動 SQL 插入

```sql
-- 1. 將舊版本設為非活躍
UPDATE public.app_versions
SET is_active = false
WHERE platform = 'ios' AND is_active = true;

-- 2. 插入新版本記錄
INSERT INTO public.app_versions (
  version,
  build_number,
  platform,
  is_active,
  force_update,
  release_notes,
  update_url
) VALUES (
  '1.2.4',  -- 版本號
  '12',     -- Build 號
  'ios',
  true,
  false,
  '從 RELEASE_NOTES.md 複製繁體中文 What''s New 內容',
  'https://apps.apple.com/app/id6739833088'
);

-- 3. 驗證插入結果
SELECT version, build_number, is_active, LEFT(release_notes, 50)
FROM public.app_versions
WHERE platform = 'ios'
ORDER BY created_at DESC
LIMIT 3;
```

### Release Notes 格式建議

**✅ 推薦格式**（直接從 RELEASE_NOTES.md 複製）：

```
本版新增

- 應用程式內版本更新：App 會檢查是否有新版本，並提示您前往 App Store 更新
- 任務地圖預覽：當任務連結為 Google 地圖網址時，可在 App 內開啟地圖預覽
- 廣告支援：為持續維護與開發，日曆與設定畫面底部加入輕量廣告，不影響主要操作

效能與改進

- 更快的載入：優化資料預載順序（今日任務 → 當月 → 前後月）
- 用戶設定與任務並行載入，啟動更快速
- Note 欄位隨輸入自動擴展（最多 12 行），編輯更順手
- 預載資料在畫面間重複使用，減少重複請求
```

---

## 4️⃣ 在 App Store Connect 提交

- [ ] 登入 [App Store Connect](https://appstoreconnect.apple.com/)
- [ ] 選擇你的 App
- [ ] 創建新版本或選擇剛上傳的 Build
- [ ] 填寫 What's New（從 `RELEASE_NOTES.md` 複製）
- [ ] 填寫 Promotional Text（可選）
- [ ] 提交審核

---

## 5️⃣ 驗證 Supabase 版本資訊

**在 Supabase 中檢查：**

```sql
-- 確認最新版本已正確登記
SELECT
  version,
  build_number,
  platform,
  is_active,
  force_update,
  release_notes,
  update_url,
  created_at
FROM public.app_versions
WHERE platform = 'ios'
ORDER BY created_at DESC
LIMIT 1;
```

**預期結果：**
- ✅ `version`: "1.2.4"
- ✅ `build_number`: "12"
- ✅ `is_active`: true
- ✅ `release_notes`: 有內容（與 RELEASE_NOTES.md 一致）
- ✅ `update_url`: App Store 連結

---

## 6️⃣ 測試版本更新提示

**在舊版本的 App 中測試：**

1. 安裝舊版本 App（例如 v1.2.3）
2. 打開 App 並登入
3. App 應該會檢查版本更新
4. 應該會顯示版本更新 Modal
5. **確認 Modal 中顯示的 Release Notes 內容正確**

如果 Modal 顯示預設文字（"我們推出了新版本，包含效能優化與錯誤修正..."），表示 Supabase 中沒有 release_notes。

---

## 7️⃣ 提交 Git Commit

```bash
git add -A
git commit -m "[release] v1.2.4 - Add version tracking and timezone detection

- Add app_version and app_build_number tracking to user_settings
- Add automatic timezone detection using expo-localization
- Update RELEASE_NOTES.md with v1.2.4 changes
- Update README.md to v1.2.4

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

---

## 📊 版本更新流程圖

```
1. 更新版本號
   ↓
2. 在 Xcode Archive
   ↓
3. 在 Supabase 登記版本 ⚠️ 重要！
   ↓
4. 在 App Store Connect 提交
   ↓
5. 驗證 Supabase 版本資訊
   ↓
6. 測試版本更新提示
   ↓
7. 提交 Git Commit
```

---

## ❗ 常見問題

### Q1: 為什麼用戶看到的是預設文字而不是我的 Release Notes？

**A**: 因為沒有在 Supabase 中登記版本。請執行步驟 3。

### Q2: 我需要為每個版本都登記到 Supabase 嗎？

**A**: 是的，只有在 Supabase 中登記過的版本，用戶才能看到自訂的 Release Notes。

### Q3: 如果忘記登記到 Supabase 會怎樣？

**A**:
- App 仍然可以檢測到新版本
- 但用戶會看到預設文字
- 可以隨時補登記（執行 SQL 插入）

### Q4: force_update 什麼時候應該設為 true？

**A**:
- 嚴重安全漏洞修復
- 必須更新才能使用的 API 變更
- 資料庫結構變更需要新版本配合
- 通常 99% 的更新都是 `false`

### Q5: 如何同時支援多語言的 Release Notes？

**A**: 目前只能在 `release_notes` 欄位中包含單一語言。如果需要多語言，可以：
- 使用 JSON 格式儲存多語言版本
- 或根據用戶的語言設定顯示對應的 RELEASE_NOTES.md 內容（需要改代碼）

---

## 🎯 快速參考

**每次發布必做的 3 件事：**

1. ✅ 更新所有版本文件
2. ✅ 在 Supabase 登記版本和 Release Notes
3. ✅ 在 App Store Connect 提交

**最容易忘記的：**

⚠️ 在 Supabase 中登記版本（步驟 3）

---

**文檔版本**: 1.0
**最後更新**: 2026-01-31
**適用範圍**: iOS App 發布流程
