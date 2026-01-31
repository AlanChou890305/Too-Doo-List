# 提交前檢查技能 (PR Check)

這個技能在你要 commit 或發 PR 前，自動檢查常見問題，避免提交有問題的 code。

## 觸發方式
使用者會用 `/pr-check` 來呼叫這個技能。

## 檢查項目

### 1. Git 狀態檢查
```bash
git status
git diff --cached  # 已 stage 的變更
git diff           # 未 stage 的變更
```

確認：
- 是否有未追蹤的重要檔案
- 是否有不小心 commit 的敏感檔案（.env、secrets）
- 變更範圍是否合理

### 2. 程式碼品質檢查

#### React Native 檔案
- [ ] 沒有 `console.log`（除非是刻意的 debug log）
- [ ] 沒有 `TODO` 或 `FIXME` 註解（或者已記錄到 issue）
- [ ] 沒有未使用的 import
- [ ] 沒有語法錯誤

#### iOS Widget 檔案
- [ ] Swift 語法正確
- [ ] 沒有 hardcoded 字串（應該用 localization）
- [ ] 沒有 force unwrap (`!`) 在不安全的地方

### 3. 功能完整性檢查
- [ ] 如果改了 UI，是否有更新多語系檔案（`src/locales/`）
- [ ] 如果改了資料結構，是否有更新 Widget
- [ ] 如果改了 service，是否有更新錯誤處理

### 4. 版本與文件檢查
如果是 release：
- [ ] `package.json` 版本號已更新
- [ ] `app.config.js` 版本號已更新
- [ ] `ios/TaskCal/Info.plist` 的 `CFBundleShortVersionString` 和 `CFBundleVersion` 已更新
- [ ] `RELEASE_NOTES.md` 已更新

### 5. 編譯檢查
提醒使用者執行：
```bash
# React Native
npm start

# iOS Widget (如果有改動)
cd ios && xcodebuild -workspace TaskCal.xcworkspace -scheme TaskCal -configuration Debug build
```

## 工作流程

### 步驟 1: 收集變更資訊
```bash
git status
git diff --stat
git diff --cached --stat
```

### 步驟 2: 分析變更檔案
對每個變更檔案：
1. 用 `Read` 讀取（如果是 .js 或 .swift）
2. 檢查上述檢查項目
3. 記錄發現的問題

### 步驟 3: 產出檢查報告

## 輸出格式

```markdown
## 📋 提交前檢查報告

### 變更摘要
- 修改檔案數: X 個
- 新增檔案數: Y 個
- 刪除檔案數: Z 個

### 檔案清單
#### React Native
- src/components/XXX.js - [變更說明]
- src/services/XXX.js - [變更說明]

#### iOS
- ios/TaskCalWidget/XXX.swift - [變更說明]

#### 其他
- docs/XXX.md - [變更說明]

---

### ✅ 通過項目
- [x] 沒有敏感檔案
- [x] 沒有多餘的 console.log
- [x] 多語系檔案已更新
...

### ⚠️  需要注意
- [ ] 發現 3 處 console.log（src/components/XXX.js:45, 67, 89）
- [ ] src/services/taskService.js 有 TODO 註解（行 123）
...

### 🚫 必須修正
- [ ] src/components/NewFeature.js 有語法錯誤（缺少右括號）
- [ ] 多語系檔案缺少新增的文字
...

---

### 建議 Commit 訊息
```
[類型]: [簡短描述]

- [變更項目 1]
- [變更項目 2]
- [變更項目 3]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 驗證指令
```bash
# 啟動 React Native
npm start

# 如果有 iOS 變更，用 Xcode build
open ios/TaskCal.xcworkspace
```

### 下一步
如果所有「必須修正」項目都已處理：
1. 執行上述驗證指令
2. 確認功能正常
3. 執行 `git add .`
4. 執行 `git commit -m "..."`
5. (可選) 執行 `/clear` 清除 context
```

## Commit 訊息類型參考

| 類型 | 使用時機 | 範例 |
|------|----------|------|
| feat | 新功能 | feat: 新增任務拖曳排序功能 |
| fix | 修 bug | fix: 修復 Widget 資料不同步問題 |
| refactor | 重構（不改行為） | refactor: 簡化 taskService 資料處理邏輯 |
| style | 樣式/格式調整 | style: 調整任務卡片間距 |
| docs | 文件 | docs: 更新 README 安裝說明 |
| chore | 雜事（依賴更新等） | chore: 升級 expo 到 54.0.25 |
| perf | 效能優化 | perf: 優化任務列表渲染效能 |

## 特殊情況處理

### 如果發現敏感資訊
立即警告使用者：
```markdown
🚨 **警告：發現敏感資訊**

以下檔案包含敏感資訊，不應該 commit：
- .env (包含 API keys)
- ios/TaskCal/GoogleService-Info.plist (包含 Firebase config)

請執行：
```bash
git reset HEAD [檔案路徑]
```

並確認 .gitignore 已包含這些檔案。
```

### 如果變更範圍過大
建議使用者拆分 commit：
```markdown
💡 **建議拆分 commit**

目前變更涉及多個不相關功能：
- 功能 A: [檔案清單]
- 功能 B: [檔案清單]

建議分別 commit：
1. 先 stage 功能 A 的檔案 → commit
2. 再 stage 功能 B 的檔案 → commit

這樣 git history 會更清晰，方便未來回溯。
```

## 注意事項
- 這個技能**不會自動修改檔案**，只做檢查與建議
- 如果使用者希望自動修正某些問題（例如移除 console.log），需明確要求
- Widget 相關變更一定要提醒 Xcode rebuild
