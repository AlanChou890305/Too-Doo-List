# 多語系 Release Notes 使用指南

## 概述

`app_versions` 表格的 `release_notes` 欄位現在支援多語系格式（JSON），可以根據使用者的語言設定自動顯示對應的更新說明。

## Supabase 儲存格式

在 `app_versions` 表格的 `release_notes` 欄位中，使用 JSON 格式儲存多語系內容：

```json
{
  "en": "Widget Improvements\n\n- Fixed iOS 17+ compatibility issue with widget background\n- Redesigned widget layout for better space utilization\n- Improved task display with square checkboxes\n- Time now displays on the right in app's signature purple color\n- Cleaner time format (hours and minutes only)\n- Better spacing between tasks for easier reading\n- Optimized vertical padding to show more tasks at a glance",
  "zh-TW": "Widget 小工具改進\n\n- 修正 iOS 17+ 相容性問題（Widget 背景顯示）\n- 重新設計 Widget 版面，更有效利用空間\n- 改用方形 Checkbox，顯示更清楚\n- 時間移到右側，並使用 App 標誌性的紫色顯示\n- 時間格式更簡潔（只顯示小時:分鐘）\n- 任務之間間距優化，閱讀更輕鬆\n- 減少上下留白，一眼看到更多任務",
  "es": "Mejoras del Widget\n\n- Problema de compatibilidad con iOS 17+ corregido (fondo del widget)\n- Diseño del widget rediseñado para mejor utilización del espacio\n- Casillas de verificación cuadradas para mejor visualización\n- Hora ahora se muestra a la derecha en el morado característico de la app\n- Formato de hora más limpio (solo horas y minutos)\n- Mejor espaciado entre tareas para lectura más fácil\n- Relleno vertical optimizado para mostrar más tareas de un vistazo"
}
```

## 語言代碼對應

App 使用的語言代碼會自動映射到 JSON key：

| App 語言代碼 | JSON Key | 語言 |
|-------------|----------|------|
| `en` | `en` | 英文 |
| `zh` | `zh-TW` | 繁體中文 |
| `es` | `es` | 西班牙文 |

## 從 RELEASE_NOTES.md 複製內容

### 1.2.5 版本範例

**英文** (RELEASE_NOTES.md 第 41-49 行)：
```
Widget Improvements

- Fixed iOS 17+ compatibility issue with widget background
- Redesigned widget layout for better space utilization
- Improved task display with square checkboxes
- Time now displays on the right in app's signature purple color
- Cleaner time format (hours and minutes only)
- Better spacing between tasks for easier reading
- Optimized vertical padding to show more tasks at a glance
```

**繁體中文** (RELEASE_NOTES.md 第 86-94 行)：
```
Widget 小工具改進

- 修正 iOS 17+ 相容性問題（Widget 背景顯示）
- 重新設計 Widget 版面，更有效利用空間
- 改用方形 Checkbox，顯示更清楚
- 時間移到右側，並使用 App 標誌性的紫色顯示
- 時間格式更簡潔（只顯示小時:分鐘）
- 任務之間間距優化，閱讀更輕鬆
- 減少上下留白，一眼看到更多任務
```

**西班牙文** (RELEASE_NOTES.md 第 131-139 行)：
```
Mejoras del Widget

- Problema de compatibilidad con iOS 17+ corregido (fondo del widget)
- Diseño del widget rediseñado para mejor utilización del espacio
- Casillas de verificación cuadradas para mejor visualización
- Hora ahora se muestra a la derecha en el morado característico de la app
- Formato de hora más limpio (solo horas y minutos)
- Mejor espaciado entre tareas para lectura más fácil
- Relleno vertical optimizado para mostrar más tareas de un vistazo
```

## 操作步驟

### 方法 1: Supabase 網頁介面（推薦）

1. 登入 Supabase Dashboard
2. 進入 `app_versions` 表格
3. 找到對應的版本記錄（例如 1.2.5）
4. 點擊 `release_notes` 欄位
5. 選擇 **JSON Editor** 模式
6. 貼上完整的 JSON 物件（包含 en, zh-TW, es）
7. 儲存

### 方法 2: SQL 指令

```sql
UPDATE app_versions
SET release_notes = '{
  "en": "Widget Improvements\n\n- Fixed iOS 17+ compatibility issue...",
  "zh-TW": "Widget 小工具改進\n\n- 修正 iOS 17+ 相容性問題...",
  "es": "Mejoras del Widget\n\n- Problema de compatibilidad..."
}'::jsonb
WHERE version = '1.2.5' AND platform = 'ios';
```

## JSON 格式注意事項

1. **換行符號**：使用 `\n` 表示換行
2. **引號**：所有字串值都要用雙引號 `"` 包起來
3. **跳脫字元**：如果內容中有雙引號，需要用 `\"` 跳脫
4. **必須是有效的 JSON**：可以用 [jsonlint.com](https://jsonlint.com/) 驗證

## 自動回退機制

如果找不到使用者語言的 release notes，系統會自動：
1. 嘗試使用英文版本 (`en`)
2. 如果也沒有英文版本，顯示原始字串
3. 如果整個欄位為空，顯示 null

## 測試

更新後，在 App 中：
1. 切換不同語言（設定 → Language）
2. 進入設定頁面，檢查版本資訊
3. 確認顯示的 release notes 是對應的語言

## 相容性

- **向後相容**：舊的純文字格式仍然有效
- **新功能**：新版本使用 JSON 格式，支援多語系
- **無需遷移**：舊版本記錄不需要更新

---

**文檔版本**: 1.0
**最後更新**: 2026-01-31
