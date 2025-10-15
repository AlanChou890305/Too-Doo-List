# 深色模式實作指南

## 📋 目前狀態 (v1.5.0)

### ✅ 已完成

1. **主題系統架構**

   - `src/config/theme.js` - 主題配置檔案（淺色/深色）
   - ThemeContext - 全域主題狀態管理
   - 自動儲存到 Supabase

2. **設定頁面支援深色模式**

   - 背景色、卡片、文字都已動態化
   - 語言切換器支援深色模式
   - 主題切換器支援深色模式

3. **資料持久化**
   - 用戶主題偏好儲存到 Supabase
   - 重新登入自動套用

### ⚠️ 待完成

其他頁面（Calendar、Login、Signup 等）的樣式仍為硬編碼顏色，需要逐步應用主題。

---

## 🎨 如何使用主題系統

### 在任何 Component 中使用

```javascript
function MyScreen() {
  const { theme, themeMode } = useContext(ThemeContext);

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Hello</Text>
    </View>
  );
}
```

### 可用的主題顏色

**背景色：**

- `theme.background` - 主要背景
- `theme.backgroundSecondary` - 次要背景
- `theme.backgroundTertiary` - 第三層背景

**卡片/容器：**

- `theme.card` - 卡片背景
- `theme.cardBorder` - 卡片邊框

**文字：**

- `theme.text` - 主要文字
- `theme.textSecondary` - 次要文字
- `theme.textTertiary` - 第三層文字
- `theme.textPlaceholder` - Placeholder 文字

**輸入框：**

- `theme.input` - 輸入框背景
- `theme.inputBorder` - 輸入框邊框
- `theme.inputBorderFocused` - 輸入框焦點邊框

**按鈕：**

- `theme.button` - 主要按鈕
- `theme.buttonText` - 按鈕文字
- `theme.buttonSecondary` - 次要按鈕
- `theme.buttonSecondaryText` - 次要按鈕文字

**其他：**

- `theme.divider` - 分隔線
- `theme.checkbox` - 複選框
- `theme.primary` - 主色調

完整列表請查看 `src/config/theme.js`

---

## 🔧 如何應用到其他頁面

### 步驟 1：導入 ThemeContext

```javascript
function CalendarScreen() {
  const { theme } = useContext(ThemeContext);
  // ...
}
```

### 步驟 2：替換硬編碼顏色

**❌ 錯誤做法（硬編碼）：**

```javascript
<View style={{ backgroundColor: "#fff" }}>
  <Text style={{ color: "#222" }}>Title</Text>
</View>
```

**✅ 正確做法（使用主題）：**

```javascript
<View style={{ backgroundColor: theme.background }}>
  <Text style={{ color: theme.text }}>Title</Text>
</View>
```

### 步驟 3：更新 StyleSheet

**❌ 錯誤：**

```javascript
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
});
```

**✅ 方法 A：動態樣式（推薦）**

```javascript
<View style={{ backgroundColor: theme.background }}>
```

**✅ 方法 B：函數式 StyleSheet**

```javascript
const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
    },
  });

// 在 Component 中
const styles = getStyles(theme);
```

---

## 📝 顏色對應表

### 淺色模式 → 深色模式

| 元素     | 淺色模式  | 深色模式  | Theme 變數                  |
| -------- | --------- | --------- | --------------------------- |
| 主背景   | `#ffffff` | `#121212` | `theme.background`          |
| 次要背景 | `#f5f5f5` | `#1e1e1e` | `theme.backgroundSecondary` |
| 卡片     | `#ffffff` | `#1e1e1e` | `theme.card`                |
| 主要文字 | `#000000` | `#ffffff` | `theme.text`                |
| 次要文字 | `#666666` | `#b0b0b0` | `theme.textSecondary`       |
| 主色調   | `#6c63ff` | `#8b84ff` | `theme.primary`             |
| 輸入框   | `#ffffff` | `#2a2a2a` | `theme.input`               |
| 分隔線   | `#e0e0e0` | `#333333` | `theme.divider`             |

---

## 🚀 快速轉換指南

### 常見轉換模式

1. **白色背景**

   ```javascript
   // 從這個
   backgroundColor: "#fff";
   backgroundColor: "#ffffff";

   // 改為
   backgroundColor: theme.background;
   // 或
   backgroundColor: theme.card;
   ```

2. **黑色文字**

   ```javascript
   // 從這個
   color: "#000";
   color: "#222";
   color: "#333";

   // 改為
   color: theme.text;
   ```

3. **灰色文字**

   ```javascript
   // 從這個
   color: "#666";
   color: "#888";

   // 改為
   color: theme.textSecondary;
   // 或
   color: theme.textTertiary;
   ```

4. **淺灰色背景**

   ```javascript
   // 從這個
   backgroundColor: "#f5f5f5";
   backgroundColor: "#f7f7fa";
   backgroundColor: "rgb(247, 247, 250)";

   // 改為
   backgroundColor: theme.backgroundSecondary;
   ```

5. **主色調（紫色）**

   ```javascript
   // 從這個
   color: "#6c63ff";

   // 改為
   color: theme.primary;
   ```

---

## 📋 待轉換頁面清單

### 高優先級（用戶常見）

- [ ] **CalendarScreen** - 行事曆主頁

  - 背景色
  - 日期選擇器
  - 任務列表

- [ ] **Modal（任務編輯）** - 新增/編輯任務彈窗
  - Modal 背景
  - 輸入框
  - 按鈕

### 中優先級

- [ ] **SplashScreen** - 啟動畫面
- [ ] **LoginScreen** - 登入頁面
- [ ] **SignupScreen** - 註冊頁面

### 低優先級

- [ ] **TermsScreen** - 使用條款
- [ ] **PrivacyScreen** - 隱私政策

---

## 🔍 查找需要更新的地方

### 搜尋硬編碼顏色

```bash
# 搜尋白色背景
grep -n 'backgroundColor.*#fff' App.js

# 搜尋黑色文字
grep -n 'color.*#000\|color.*#222\|color.*#333' App.js

# 搜尋灰色文字
grep -n 'color.*#666\|color.*#888' App.js

# 搜尋主色調
grep -n '#6c63ff' App.js
```

---

## 🎯 目標

### Phase 1: 基礎功能 ✅

- [x] 主題系統建立
- [x] Context 整合
- [x] 設定頁面支援
- [x] Supabase 儲存

### Phase 2: 核心頁面（下一步）

- [ ] CalendarScreen 完整支援
- [ ] Modal 完整支援
- [ ] Tab Bar 支援

### Phase 3: 全面支援

- [ ] 所有頁面支援深色模式
- [ ] 所有 Component 支援深色模式
- [ ] 圖片適配（深色模式圖標）

---

## 💡 最佳實踐

### 1. 一致性

所有相同類型的元素使用相同的主題變數：

- 所有主背景都用 `theme.background`
- 所有卡片背景都用 `theme.card`

### 2. 可讀性優先

深色模式下：

- 不要使用純黑（`#000000`）作為背景
- 使用稍淺的黑色（`#121212`）減少眼睛疲勞
- 文字不要用純白，用稍暗的白色（`#ffffff` → `#e0e0e0`）

### 3. 對比度

確保文字和背景有足夠對比度：

- 主要文字：高對比度
- 次要文字：中對比度
- 禁用狀態：低對比度

### 4. 測試

每次修改後在兩種模式下測試：

1. 切換到深色模式
2. 檢查所有頁面
3. 切換回淺色模式
4. 再次檢查

---

## 🐛 常見問題

### Q1: 切換主題後某些元素沒變色？

**A:** 檢查該元素是否使用了硬編碼顏色。搜尋 `backgroundColor: "#` 或 `color: "#` 來查找。

### Q2: 如何處理圖片？

**A:**

```javascript
// 根據主題選擇圖片
const logo =
  themeMode === "dark"
    ? require("./assets/logo-dark.png")
    : require("./assets/logo-light.png");
```

### Q3: StyleSheet.create 中如何使用動態顏色？

**A:** 將 StyleSheet 放在函數中，或使用 inline styles。

### Q4: Modal 的陰影顏色？

**A:** 使用 `theme.shadow` 和 `theme.shadowOpacity`

---

## 📚 相關檔案

- **主題配置**：`src/config/theme.js`
- **Context 定義**：`App.js`（搜尋 `ThemeContext`）
- **設定頁面範例**：`App.js`（`SettingScreen`）
- **SQL Migration**：`supabase_migration_user_settings.sql`

---

## 🎨 自訂主題顏色

如果想調整深色模式的顏色，編輯 `src/config/theme.js`：

```javascript
export const darkTheme = {
  // 調整主色調
  primary: "#8b84ff", // 改成你喜歡的顏色

  // 調整背景色
  background: "#121212", // 改成更淺或更深

  // 調整文字顏色
  text: "#ffffff", // 改成你想要的亮度
};
```

---

## ✅ 檢查清單

在提交深色模式相關變更前：

- [ ] 所有硬編碼顏色已替換為主題變數
- [ ] 在淺色模式下測試所有頁面
- [ ] 在深色模式下測試所有頁面
- [ ] 文字在兩種模式下都清晰可讀
- [ ] Modal 和 Alert 在兩種模式下正常顯示
- [ ] 輸入框在兩種模式下可見
- [ ] 按鈕在兩種模式下顏色正確
- [ ] 切換主題時即時更新（無需重啟）
