# v1.5.0 更新日誌

## 🎨 新功能

### 深色模式（Dark Mode）

- ✅ 新增淺色/深色模式切換功能
- ✅ 用戶可在設定頁面切換主題
- ✅ 主題偏好自動儲存到 Supabase
- ✅ 重新登入時自動套用用戶偏好

**已支援頁面：**

- 設定頁面（Settings）- 完整支援

**待完成頁面：**

- Calendar 頁面
- 任務編輯 Modal
- 登入/註冊頁面

---

## 🔧 技術改進

### 主題系統

- 新增 `src/config/theme.js` - 主題配置檔案
- 新增 `ThemeContext` - 全域主題狀態管理
- 支援動態主題切換（無需重啟 App）

### 資料持久化

- Supabase `user_settings` 表格新增 `theme` 欄位
- 自動同步主題設定到雲端
- 跨設備主題同步

### 多語系支援

- 新增主題相關翻譯：
  - `theme` - 主題
  - `lightMode` - 淺色模式
  - `darkMode` - 深色模式
  - `appearance` - 外觀

---

## 📋 檔案變更

### 新增檔案

- `src/config/theme.js` - 主題配置
- `supabase_migration_user_settings.sql` - 資料庫遷移
- `SUPABASE_USER_SETTINGS_SETUP.md` - 設定指南
- `DARK_MODE_IMPLEMENTATION.md` - 深色模式實作指南
- `CHANGELOG_v1.5.0.md` - 本更新日誌

### 修改檔案

- `App.js`
  - 新增 ThemeContext
  - 整合主題系統到 SettingScreen
  - 新增主題載入/儲存邏輯
- `src/services/userService.js`
  - 已包含完整的設定儲存功能（無需修改）
- `app.config.js`
  - 版本更新：1.4.0 → 1.5.0
- `package.json`
  - 版本更新：1.4.0 → 1.5.0

---

## 🎨 主題顏色對照

### 淺色模式

- 背景：白色（#ffffff）
- 主文字：黑色（#000000）
- 主色調：紫色（#6c63ff）

### 深色模式

- 背景：深灰色（#121212）
- 主文字：白色（#ffffff）
- 主色調：淺紫色（#8b84ff）

---

## 📦 部署說明

### 必須步驟

1. **執行 Supabase Migration**

   ```sql
   -- 在 Supabase Dashboard SQL Editor 中執行
   -- supabase_migration_user_settings.sql
   ```

2. **構建方式**
   - ⚠️ 純 JavaScript 變更
   - ✅ 可以 OTA 更新
   - ✅ 不需要重新構建原生 App
3. **OTA 更新**
   ```bash
   eas update --branch production --message "v1.5.0: 新增深色模式支援"
   ```

---

## 🔄 從 v1.4.0 升級

### 對現有用戶的影響

- ✅ 無破壞性變更
- ✅ 預設使用淺色模式（與之前一致）
- ✅ 用戶可自行切換到深色模式

### 資料遷移

- 首次使用時，系統會自動為用戶創建 `user_settings` 記錄
- 使用 `upsert` 策略，不會覆蓋現有設定

---

## 🧪 測試檢查清單

### 功能測試

- [x] 切換語言正常運作
- [x] 切換主題正常運作
- [x] 設定儲存到 Supabase
- [x] 重新登入後自動載入設定
- [ ] Calendar 頁面深色模式（待完成）
- [ ] Modal 深色模式（待完成）

### 兼容性測試

- [x] iOS 淺色模式正常
- [x] iOS 深色模式正常
- [x] Android 淺色模式正常
- [x] Android 深色模式正常
- [x] Web 淺色模式正常
- [x] Web 深色模式正常

---

## 🐛 已知問題

### 待修復

1. **部分頁面尚未支援深色模式**

   - Calendar 頁面仍為淺色
   - Modal 尚未完全適配
   - 將在 v1.5.1 中逐步完善

2. **圖片適配**
   - Logo 在深色模式下可能需要調整
   - 將在後續版本優化

---

## 🎯 下一步計劃（v1.5.1）

### 短期目標

- [ ] Calendar 頁面完整支援深色模式
- [ ] Modal 完整支援深色模式
- [ ] Tab Bar 顏色適配

### 中期目標

- [ ] 所有頁面支援深色模式
- [ ] 圖片/圖標深色模式適配
- [ ] 動畫過渡效果

### 長期目標

- [ ] 跟隨系統主題設定
- [ ] 自訂主題顏色
- [ ] 更多主題選項（如高對比度模式）

---

## 💬 用戶反饋

### 如何反饋問題

1. 在 App 中切換到深色模式
2. 記錄哪些地方顏色不正常
3. 截圖並標註問題區域
4. 提供設備資訊（iOS/Android 版本）

---

## 📚 文檔

- **設定指南**：`SUPABASE_USER_SETTINGS_SETUP.md`
- **深色模式實作**：`DARK_MODE_IMPLEMENTATION.md`
- **主題配置**：`src/config/theme.js`

---

## 👥 貢獻者

- 深色模式設計與實作
- Supabase 整合
- 文檔撰寫

---

## 📊 版本統計

- **新增程式碼**：~300 行
- **修改程式碼**：~100 行
- **新增檔案**：5 個
- **修改檔案**：3 個

---

**發布日期**：2025-10-15
**版本類型**：MINOR（新功能）
**向後兼容**：✅ 是
