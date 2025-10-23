# Vercel 多環境部署配置

## 🚀 部署架構

### 環境對應
- **開發環境**: `develop` 分支 → `too-doo-list-dev.vercel.app`
- **測試環境**: `staging` 分支 → `too-doo-list-staging.vercel.app`  
- **正式環境**: `main` 分支 → `to-do-mvp.vercel.app`

## 📋 設定步驟

### 1. 在 Vercel Dashboard 創建專案

#### 開發環境專案
```bash
專案名稱: too-doo-list-dev
Git 倉庫: your-repo
分支: develop
環境變數:
- EXPO_PUBLIC_APP_ENV=development
- EXPO_PUBLIC_SUPABASE_URL=your-dev-supabase-url
- EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
```

#### 測試環境專案
```bash
專案名稱: too-doo-list-staging
Git 倉庫: your-repo
分支: staging
環境變數:
- EXPO_PUBLIC_APP_ENV=staging
- EXPO_PUBLIC_SUPABASE_URL=your-staging-supabase-url
- EXPO_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
```

#### 正式環境專案
```bash
專案名稱: too-doo-list-prod
Git 倉庫: your-repo
分支: main
環境變數:
- EXPO_PUBLIC_APP_ENV=production
- EXPO_PUBLIC_SUPABASE_URL=your-prod-supabase-url
- EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

### 2. 自動部署設定

每個專案都會自動部署對應分支的變更：

- `develop` 分支推送 → 自動部署開發環境
- `staging` 分支推送 → 自動部署測試環境
- `main` 分支推送 → 自動部署正式環境

### 3. 環境變數管理

在 Vercel Dashboard 中為每個專案設定對應的環境變數：

#### 開發環境變數
```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

#### 測試環境變數
```bash
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

#### 正式環境變數
```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
EXPO_PUBLIC_ENABLE_DEBUG=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

## 🔧 部署流程

### 開發流程
```bash
# 1. 在 develop 分支開發
git checkout develop
# 進行開發...

# 2. 推送到 develop 分支
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
# 1. 合併 staging 到 main
git checkout main
git merge staging
git push origin main
# 自動觸發正式環境部署
```

## 📊 監控和日誌

### 部署狀態監控
- 在 Vercel Dashboard 查看各環境的部署狀態
- 設定部署通知（Slack、Email 等）

### 環境隔離
- 每個環境使用獨立的 Supabase 專案
- 獨立的域名和 SSL 證書
- 獨立的環境變數和配置

## ⚠️ 注意事項

1. **環境變數安全**: 不要在代碼中硬編碼敏感資訊
2. **分支保護**: 設定 main 分支的保護規則
3. **部署審核**: 正式環境部署前進行代碼審核
4. **回滾策略**: 準備快速回滾機制
5. **監控告警**: 設定部署失敗的告警通知

## 🎯 最佳實踐

1. **開發**: 在 develop 分支進行功能開發
2. **測試**: 在 staging 分支進行完整測試
3. **發布**: 在 main 分支進行正式發布
4. **回滾**: 保持前一個穩定版本的快速回滾能力
