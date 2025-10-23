# CI/CD 自動化部署配置

## 🚀 GitHub Actions 工作流程

### 1. 開發環境部署 (deploy-development.yml)
- **觸發條件**: `develop` 分支推送
- **部署目標**: Vercel 開發環境
- **包含步驟**:
  - 代碼檢查
  - 依賴安裝
  - 測試執行
  - 構建
  - 部署

### 2. 測試環境部署 (deploy-staging.yml)
- **觸發條件**: `staging` 分支推送
- **部署目標**: Vercel 測試環境
- **包含步驟**:
  - 代碼檢查
  - 依賴安裝
  - 測試執行
  - 代碼檢查 (linting)
  - 構建
  - 部署
  - 整合測試

### 3. 正式環境部署 (deploy-production.yml)
- **觸發條件**: `main` 分支推送 或 手動觸發
- **部署目標**: Vercel 正式環境
- **包含步驟**:
  - 代碼檢查
  - 依賴安裝
  - 測試執行
  - 代碼檢查 (linting)
  - 安全審計
  - 構建
  - 部署
  - 煙霧測試
  - 創建 Release

## 🔧 設定步驟

### 1. GitHub Secrets 設定

在 GitHub Repository Settings → Secrets and variables → Actions 中設定：

```bash
# Vercel 配置
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id

# 各環境的專案 ID
VERCEL_PROJECT_ID_DEV=your-dev-project-id
VERCEL_PROJECT_ID_STAGING=your-staging-project-id
VERCEL_PROJECT_ID_PROD=your-prod-project-id
```

### 2. 獲取 Vercel 配置

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入 Vercel
vercel login

# 獲取專案資訊
vercel link
vercel env ls
```

### 3. 分支保護規則

在 GitHub Repository Settings → Branches 中設定：

#### main 分支保護
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Restrict pushes that create files

#### staging 分支保護
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging

## 📋 部署流程

### 開發流程
```bash
# 1. 創建功能分支
git checkout -b feature/new-feature
# 開發功能...

# 2. 合併到 develop
git checkout develop
git merge feature/new-feature
git push origin develop
# 自動觸發開發環境部署
```

### 測試流程
```bash
# 1. 合併 develop 到 staging
git checkout staging
git merge develop
git push origin staging
# 自動觸發測試環境部署
```

### 正式發布流程
```bash
# 1. 創建 Pull Request: staging → main
# 2. 代碼審核通過後合併
git checkout main
git merge staging
git push origin main
# 自動觸發正式環境部署
```

## 🔍 監控和通知

### 部署狀態監控
- GitHub Actions 頁面查看部署狀態
- Vercel Dashboard 查看部署詳情
- 設定 Slack/Email 通知

### 錯誤處理
- 部署失敗自動回滾
- 發送告警通知
- 記錄詳細錯誤日誌

## ⚠️ 注意事項

1. **安全**: 不要在代碼中硬編碼敏感資訊
2. **測試**: 確保所有測試通過後才部署
3. **回滾**: 準備快速回滾機制
4. **監控**: 部署後監控應用狀態
5. **通知**: 設定部署狀態通知

## 🎯 最佳實踐

1. **小步快跑**: 頻繁的小型部署
2. **自動化**: 盡可能自動化部署流程
3. **測試**: 完整的測試覆蓋
4. **監控**: 實時監控部署狀態
5. **回滾**: 快速回滾機制
