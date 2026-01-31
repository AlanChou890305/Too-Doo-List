# Claude Code Hooks 實戰範例

Hooks 讓 Claude 在改完檔案後，自動執行你指定的驗證指令（例如格式化、lint、測試）。

> **注意**: Hooks 是進階功能，建議先熟悉基本 workflow 後再啟用。

---

## 什麼是 Hooks？

Hooks 是在特定事件發生時，自動執行的 shell 指令：

| 事件類型 | 觸發時機 | 常見用途 |
|---------|---------|---------|
| `post-write` | 檔案被 Write/Edit tool 修改後 | 格式化、Lint |
| `post-task` | 任務完成後 | 跑測試、Build 驗證 |
| `pre-prompt` | 使用者輸入前 | 更新 context、讀取狀態 |

---

## 配置方式

Hooks 設定在 `~/.claude/settings.json` 或專案根目錄的 `.claude/settings.json`。

### 全域設定（所有專案適用）
```bash
~/.claude/settings.json
```

### 專案設定（只適用於 Too-Doo-List）
```bash
/Users/hububble/Desktop/Too-Doo-List/.claude/settings.json
```

---

## 推薦 Hooks 配置（適用於 React Native + iOS）

以下是我建議的 Too-Doo-List 專案 hooks 配置：

### 設定檔：`.claude/settings.json`

```json
{
  "hooks": {
    "post-write": {
      "command": "bash .claude/hooks/post-write.sh",
      "description": "格式化並檢查修改的檔案",
      "timeout": 10000,
      "blocking": true
    },
    "post-task": {
      "command": "bash .claude/hooks/post-task.sh",
      "description": "任務完成後驗證",
      "timeout": 30000,
      "blocking": false
    }
  }
}
```

**參數說明**：
- `blocking: true` → Claude 會等指令完成才繼續
- `blocking: false` → 背景執行，不阻擋 Claude
- `timeout` → 逾時時間（毫秒）

---

## Hook Scripts 實作

### 1. Post-Write Hook（檔案修改後）

建立檔案 `.claude/hooks/post-write.sh`：

```bash
#!/bin/bash
# Post-Write Hook: 檢查修改的檔案

# 取得修改的檔案（從環境變數）
MODIFIED_FILE="${CLAUDE_MODIFIED_FILE}"

echo "📝 檢查檔案: $MODIFIED_FILE"

# 根據檔案類型執行不同檢查
if [[ "$MODIFIED_FILE" == *.js ]]; then
    echo "  → 檢查 JavaScript 語法..."
    node --check "$MODIFIED_FILE" 2>&1

    # 如果你有 ESLint
    # npx eslint --fix "$MODIFIED_FILE"

elif [[ "$MODIFIED_FILE" == *.swift ]]; then
    echo "  → 檢查 Swift 語法..."
    # 使用 xcrun swift 驗證語法（如果是獨立檔案）
    # 注意：完整 build 驗證應該在 post-task 做

elif [[ "$MODIFIED_FILE" == *.json ]]; then
    echo "  → 檢查 JSON 格式..."
    jq empty "$MODIFIED_FILE" 2>&1 && echo "    ✓ JSON 格式正確"
fi

echo "  ✓ 檢查完成"
```

**賦予執行權限**：
```bash
chmod +x .claude/hooks/post-write.sh
```

---

### 2. Post-Task Hook（任務完成後）

建立檔案 `.claude/hooks/post-task.sh`：

```bash
#!/bin/bash
# Post-Task Hook: 任務完成後驗證

echo "🔍 任務完成，開始驗證..."

# 檢查是否有 JavaScript 檔案修改
JS_CHANGES=$(git diff --name-only | grep '\.js$' | wc -l)

if [ "$JS_CHANGES" -gt 0 ]; then
    echo "  → 發現 $JS_CHANGES 個 JS 檔案變更"
    echo "  → 執行快速語法檢查..."

    # 只檢查語法，不執行
    git diff --name-only | grep '\.js$' | while read file; do
        node --check "$file" && echo "    ✓ $file" || echo "    ✗ $file (語法錯誤)"
    done
fi

# 檢查是否有 Swift 檔案修改
SWIFT_CHANGES=$(git diff --name-only | grep '\.swift$' | wc -l)

if [ "$SWIFT_CHANGES" -gt 0 ]; then
    echo "  → 發現 $SWIFT_CHANGES 個 Swift 檔案變更"
    echo "  ⚠️  提醒：需要用 Xcode build 驗證 Widget"
fi

# 檢查是否有 Widget 服務修改
if git diff --name-only | grep -q "widgetService.js"; then
    echo "  ⚠️  widgetService.js 有變更"
    echo "     記得測試 Widget 資料同步"
fi

echo "  ✓ 驗證完成"
```

**賦予執行權限**：
```bash
chmod +x .claude/hooks/post-task.sh
```

---

## 進階：Widget Build 驗證 Hook

如果你想在每次 Swift 檔案改動後自動 build Widget（**注意：會比較慢**）：

`.claude/hooks/post-write.sh` 加入：

```bash
if [[ "$MODIFIED_FILE" == ios/TaskCalWidget/*.swift ]]; then
    echo "  → Widget 檔案已修改，開始 build..."

    cd ios
    xcodebuild -workspace TaskCal.xcworkspace \
               -scheme TaskCalWidget \
               -configuration Debug \
               build \
               2>&1 | grep -E "(error:|warning:|Build Succeeded)"

    BUILD_STATUS=$?
    if [ $BUILD_STATUS -eq 0 ]; then
        echo "    ✓ Widget build 成功"
    else
        echo "    ✗ Widget build 失敗，請檢查 error log"
    fi
    cd ..
fi
```

> **警告**: 這會讓每次改 Swift 檔案都跑 build，會**變慢**。建議只在「準備提交前」手動 build。

---

## 輕量版 Hooks（推薦新手）

如果你覺得自動執行太多指令會干擾，可以用「輕量版」只做基本檢查：

`.claude/settings.json`:

```json
{
  "hooks": {
    "post-write": {
      "command": "echo '✓ 檔案已修改:' $CLAUDE_MODIFIED_FILE",
      "description": "顯示修改的檔案",
      "timeout": 1000,
      "blocking": false
    }
  }
}
```

這樣只會「通知」你哪個檔案被改了，不做額外驗證。

---

## Hooks 可用的環境變數

Claude Code 會傳遞這些環境變數給 hook script：

| 變數 | 說明 | 範例 |
|------|------|------|
| `CLAUDE_MODIFIED_FILE` | 被修改的檔案路徑 | `src/components/TaskItem.js` |
| `CLAUDE_TASK_ID` | 任務 ID (post-task) | `task-123` |
| `CLAUDE_WORKING_DIR` | 工作目錄 | `/Users/.../Too-Doo-List` |

---

## 測試你的 Hooks

### 手動測試 post-write.sh
```bash
export CLAUDE_MODIFIED_FILE="src/components/TaskItem.js"
bash .claude/hooks/post-write.sh
```

### 手動測試 post-task.sh
```bash
bash .claude/hooks/post-task.sh
```

---

## 停用 Hooks

### 暫時停用
```bash
# 啟動 Claude Code 時加上 --no-hooks
claude --no-hooks
```

### 永久停用
從 `.claude/settings.json` 移除 `hooks` 區塊。

---

## 常見問題

### Q: Hook 執行失敗會怎樣？
**A**: 如果 `blocking: true`，Claude 會等待並顯示錯誤；如果 `blocking: false`，會在背景失敗，不影響 Claude。

### Q: Hook 會拖慢速度嗎？
**A**: 會。如果 hook 做太多事（例如跑完整測試），會讓每次改檔案都變慢。建議：
- **Post-write**: 只做快速檢查（語法檢查、格式化）
- **Post-task**: 可以做較重的驗證（build、測試）

### Q: 我可以讓 Hook 自動 commit 嗎？
**A**: 技術上可以，但**強烈不建議**。Commit 應該由你或 Claude 明確決定，不要自動化。

### Q: Hook 可以修改檔案嗎？
**A**: 可以（例如自動格式化），但要小心：
- Claude 可能不知道檔案被改了
- 建議只在「不影響邏輯」的情況下修改（例如 prettier）

---

## 建議的使用時機

### 新手階段（不建議用 Hooks）
先熟悉基本流程：
```
Claude 改 code → 你手動驗證 → commit → /clear
```

### 進階階段（可以用輕量 Hooks）
啟用：
- Post-write: 只做語法檢查
- Post-task: 提醒需要驗證的事項

### 高手階段（可以用完整 Hooks）
啟用：
- Post-write: 格式化 + Lint
- Post-task: Build + 簡單測試

---

## 總結

Hooks 的核心價值是「把你原本要手動做的驗證，變成自動化」。

但記得：
1. **不要太貪心** - hook 做太多事會變慢
2. **blocking 要慎用** - 只在「必須等待」時設為 true
3. **先手動熟悉流程** - 再來自動化

最實用的 hook 組合（Too-Doo-List）：
- **Post-write**: 檢查 JS 語法、JSON 格式
- **Post-task**: 提醒 Widget build、Widget 資料同步

這樣既不會太慢，又能抓到常見問題。
