# Claude Code Terminal 三窗格實戰配置

這份指南教你如何用「三窗格」配置，讓 Claude Code vibe coding 效率最大化。

## 核心概念：一寫多想

**黃金規則**: 同一時間只有一個 terminal 在改 code，其他的只能「輔助」。

---

## 配置方式（三選一）

### 方案 A：iTerm2 分割窗格（推薦 Mac 使用者）

1. 開啟 iTerm2
2. `Cmd+D` 垂直分割
3. `Cmd+Shift+D` 水平分割
4. 最終配置：

```
┌─────────────┬─────────────┐
│             │             │
│  Pane 1     │  Pane 2     │
│  Claude     │  Git        │
│  (主寫手)   │  (監控)     │
│             │             │
├─────────────┴─────────────┤
│                           │
│  Pane 3                   │
│  Build/Test (驗證)        │
│                           │
└───────────────────────────┘
```

**快捷鍵**：
- `Cmd+[` / `Cmd+]` 在窗格間切換
- `Cmd+Option+方向鍵` 調整窗格大小

---

### 方案 B：tmux 配置（跨平台、可遠端）

建立設定檔 `~/.tmux-claude.conf`：

```bash
# 建立 session
new-session -s claude-dev

# 分割窗格
split-window -h -p 40      # 右側 40% 寬度
split-window -v -p 50      # 右下 50% 高度

# 選擇預設窗格（左側主要）
select-pane -t 0

# 設定窗格標題
select-pane -t 0 -T "Claude Code"
select-pane -t 1 -T "Git Monitor"
select-pane -t 2 -T "Build/Test"
```

**啟動方式**：
```bash
tmux source-file ~/.tmux-claude.conf
```

**快捷鍵**（預設 prefix: `Ctrl+b`）：
- `Ctrl+b` `方向鍵` 切換窗格
- `Ctrl+b` `x` 關閉當前窗格

---

### 方案 C：VS Code Terminal（如果你在 VS Code 用 Claude CLI）

1. 打開 Terminal (`Cmd+J`)
2. 點右上角 `+` 旁邊的「Split Terminal」
3. 重複分割
4. 最終配置：左側 Claude、右上 Git、右下 Build

---

## 三窗格職責分工

### Pane 1: Claude Code（主寫手）
**用途**: 唯一能修改 code 的 AI session

**命令清單**：
```bash
# 啟動
claude

# 常用 slash commands
/rn-ios-feature      # 開發新功能
/ios-widget-debug    # Widget 除錯
/pr-check            # 提交前檢查
/clear               # 任務完成後清除 context
/compact             # 壓縮對話保留重點
```

**工作節奏**：
1. 丟需求給 Claude
2. 等它改完 code
3. 切到 Pane 2/3 驗證
4. commit 後 `/clear`
5. 開始下一個任務

---

### Pane 2: Git Monitor（監控）
**用途**: 隨時看 Claude 改了什麼

**常用命令**：
```bash
# 持續監控 git 狀態（每 2 秒刷新）
watch -n 2 "git status --short && echo '---' && git diff --stat"

# 或者手動執行
git status
git diff               # 查看未 stage 的變更
git diff --cached      # 查看已 stage 的變更
git diff --stat        # 只看變更摘要
git log --oneline -5   # 看最近 5 次 commit
```

**關鍵時機**：
- Claude 說「I've updated...」→ 立刻看 git diff
- 發現改太多檔案 → 立刻叫停
- 準備 commit → 檢查 git status

---

### Pane 3: Build/Test（驗證）
**用途**: 確認 Claude 改完的 code 真的能跑

**React Native 驗證**：
```bash
# 啟動 Metro bundler
npm start

# 如果需要清除 cache
npm start -- --reset-cache
```

**iOS Widget 驗證**：
```bash
# Build Widget target
cd ios
xcodebuild -workspace TaskCal.xcworkspace \
           -scheme TaskCalWidget \
           -configuration Debug \
           build

# 或直接用 Xcode GUI
open ios/TaskCal.xcworkspace
```

**快速檢查**：
```bash
# 檢查是否有語法錯誤（不執行）
node --check src/components/XXX.js

# 檢查 package.json 依賴
npm list --depth=0
```

---

## 實戰流程範例

### 場景：新增「任務標籤」功能

#### Step 1: 在 Pane 1 啟動功能開發
```bash
claude
> /rn-ios-feature
> [描述需求] 新增任務標籤功能，可以給每個任務加 1-3 個標籤，UI 上顯示標籤顏色
```

#### Step 2: 在 Pane 2 監控變更
```bash
watch -n 2 "git status --short"
```
看到 Claude 開始改檔案：
```
M  src/services/taskService.js
M  src/components/TaskItem.js
A  src/components/TagPicker.js
```

#### Step 3: 在 Pane 3 驗證
```bash
npm start
```
手機上測試新功能

#### Step 4: 回到 Pane 1 確認完成
```
> 功能測試正常
> /pr-check
> [檢查通過後] git add . && git commit -m "feat: 新增任務標籤功能"
> /clear
```

---

## 進階技巧：多 Terminal Tabs

如果你需要「同時思考多個主題」，可以開多個 tab：

### Tab 1: cc-main（寫 code）
- Pane 1: Claude Code (唯一寫手)
- Pane 2: Git Monitor
- Pane 3: Build/Test

### Tab 2: cc-think（只問問題）
- 單一 Claude session
- 不能動檔案
- 用途：問架構、問最佳實踐、討論設計

### Tab 3: cc-debug（快速除錯）
- 單一 Claude session
- 用途：丟 error log、問 crash 原因
- 不影響 main session 的 context

**切換方式**：
- iTerm: `Cmd+1/2/3`
- tmux: `Ctrl+b` `w` 選擇 window

---

## 常見問題

### Q: 為什麼要分窗格，不能用一個 terminal？
**A**: 因為你會花很多時間在「等 Claude 回覆」。分窗格讓你可以：
- Claude 在寫 code 時，你去驗證上一個改動
- Claude 在寫 code 時，你去看 git diff 確認範圍
- 不會因為「等待」而浪費時間

### Q: tmux 跟 iTerm 分割有什麼差別？
**A**:
- **iTerm 分割**: 簡單、直覺、只能在本機用
- **tmux**: 可以 detach/attach、可以遠端用、可以保存 session

### Q: 我可以開兩個 Claude 同時改 code 嗎？
**A**: **不行**。兩個 Claude 同時寫會衝突。正確做法：
- 只有 Pane 1 (或 Tab 1) 的 Claude 能改檔案
- 其他 Claude session 只能「問問題」，不能動 code

---

## 推薦的鍵盤快捷鍵設定

如果你用 iTerm2，可以設定這些快捷鍵：

1. `Preferences` → `Keys` → `Key Bindings`
2. 新增：
   - `Cmd+Shift+1`: Send Text `claude\n` (快速啟動 Claude)
   - `Cmd+Shift+2`: Send Text `/clear\n` (快速清除)
   - `Cmd+Shift+3`: Send Text `git status\n` (快速看 git)

---

## 總結：一個節奏公式

```
需求 → /rn-ios-feature (Pane 1)
      ↓
    改 code (自動)
      ↓
    git diff (Pane 2 監控)
      ↓
    npm start (Pane 3 驗證)
      ↓
    /pr-check (Pane 1 檢查)
      ↓
    git commit (Pane 2 提交)
      ↓
    /clear (Pane 1 清除) → 回到起點
```

這個節奏重複執行，你會發現 vibe coding 變得很可控。
