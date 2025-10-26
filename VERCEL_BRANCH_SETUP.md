# Vercel Branch 設定指南

## 🎯 你的問題

### 1. 如何將 Vercel 專案的 branch 指向 `develop`？
### 2. `EXPO_PUBLIC_APP_ENV` 應該設定成什麼？

---

## 📝 答案總結

### Staging 專案設定
```
Vercel Project: To Do Staging
Production Branch: develop
EXPO_PUBLIC_APP_ENV=development
```

### Production 專案設定
```
Vercel Project: To Do Production
Production Branch: main
EXPO_PUBLIC_APP_ENV=production
```

---

## 🔧 詳細設定步驟

### 步驟 1: 設定 Vercel Production Branch

#### 對於 To Do Staging 專案

1. **前往 Vercel Dashboard**
   - 登入 https://vercel.com/dashboard
   - 找到並點擊 `To Do Staging` 專案

2. **進入 Settings**
   - 點擊頂部導航的 **Settings** 標籤

3. **找到 Git 設定**
   - 在左側選單找到 **Git**

4. **設定 Production Branch**
   - 找到 "Production Branch" 欄位
   - 將值改為 `develop`
   - 點擊 **Save**

5. **確認設定**
   - Production Branch 應顯示為 `develop`
   - 這表示推送到 `develop` 分支會觸發 Production 部署

#### 對於 To Do Production 專案

1. 重複上述步驟
2. Production Branch 設為 `main`

### 📸 視覺指南

```
Vercel Dashboard
  └─ Select Project (To Do Staging)
      └─ Settings
          └─ Git
              └─ Production Branch: [develop] ← 改成 develop
                  └─ Save
```

---

## 🔑 步驟 2: 設定環境變數

### To Do Staging 專案

1. **進入 Environment Variables**
   - Settings → Environment Variables

2. **新增/編輯變數**

   **必要變數:**
   ```bash
   Key: EXPO_PUBLIC_APP_ENV
   Value: development
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

   ```bash
   Key: EXPO_PUBLIC_SUPABASE_URL_DEV
   Value: https://qerosiozltqrbehctxdn.supabase.co
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

   ```bash
   Key: EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV
   Value: your_staging_anon_key
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

   **可選變數:**
   ```bash
   Key: EXPO_PUBLIC_ENABLE_DEBUG
   Value: true
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

### To Do Production 專案

1. **進入 Environment Variables**
   - Settings → Environment Variables

2. **新增/編輯變數**

   **必要變數:**
   ```bash
   Key: EXPO_PUBLIC_APP_ENV
   Value: production
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

   ```bash
   Key: EXPO_PUBLIC_SUPABASE_URL
   Value: https://ajbusqpjsjcuzzxuueij.supabase.co
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

   ```bash
   Key: EXPO_PUBLIC_SUPABASE_ANON_KEY
   Value: your_production_anon_key
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

   **可選變數:**
   ```bash
   Key: EXPO_PUBLIC_ENABLE_DEBUG
   Value: false
   Environments: ✅ Production  ✅ Preview  ✅ Development
   ```

---

## 💡 為什麼這樣設定？

### EXPO_PUBLIC_APP_ENV 的作用

在 `src/config/environment.js` 中：

```javascript
export const getCurrentEnvironment = () => {
  return process.env.EXPO_PUBLIC_APP_ENV || "development";
};

export const environmentConfig = {
  development: {
    // 使用 Staging Supabase
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL_DEV,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV,
    },
    features: {
      debug: true,
      analytics: false,
    },
  },
  
  production: {
    // 使用 Production Supabase
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    features: {
      debug: false,
      analytics: true,
    },
  },
};
```

### 環境對應關係

| Vercel Project | Branch | APP_ENV | Supabase | Debug |
|---------------|--------|---------|----------|-------|
| To Do Staging | develop | `development` | to-do-staging | ✅ ON |
| To Do Production | main | `production` | to-do-production | ❌ OFF |

---

## ✅ 設定檢查清單

### To Do Staging

- [ ] **Git 設定**
  - [ ] Production Branch = `develop`
  
- [ ] **環境變數**
  - [ ] `EXPO_PUBLIC_APP_ENV` = `development`
  - [ ] `EXPO_PUBLIC_SUPABASE_URL_DEV` = Staging Supabase URL
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV` = Staging Anon Key
  - [ ] 所有變數都勾選三個環境

- [ ] **Domain**
  - [ ] Production Domain = `to-do-staging.vercel.app`

### To Do Production

- [ ] **Git 設定**
  - [ ] Production Branch = `main`
  
- [ ] **環境變數**
  - [ ] `EXPO_PUBLIC_APP_ENV` = `production`
  - [ ] `EXPO_PUBLIC_SUPABASE_URL` = Production Supabase URL
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` = Production Anon Key
  - [ ] 所有變數都勾選三個環境

- [ ] **Domain**
  - [ ] Production Domain = `to-do-mvp.vercel.app`

---

## 🧪 測試設定

### 測試 Staging

```bash
# 1. 切換到 develop 分支
git checkout develop

# 2. 做一個測試變更
echo "Test" >> test.txt
git add test.txt
git commit -m "[test] Staging deployment test"

# 3. 推送
git push origin develop

# 4. 檢查 Vercel Dashboard
# To Do Staging 應該自動開始部署

# 5. 部署完成後訪問
# https://to-do-staging.vercel.app

# 6. 打開 Console (F12)
# 應該看到：
# Environment: development
# Supabase URL: qerosiozltqrbehctxdn.supabase.co
# Debug 資訊應該顯示
```

### 測試 Production

```bash
# 1. 切換到 main 分支
git checkout main

# 2. 合併 develop
git merge develop

# 3. 推送
git push origin main

# 4. 檢查 Vercel Dashboard
# To Do Production 應該自動開始部署

# 5. 部署完成後訪問
# https://to-do-mvp.vercel.app

# 6. 打開 Console (F12)
# 應該看到：
# Environment: production
# Supabase URL: ajbusqpjsjcuzzxuueij.supabase.co
# Debug 資訊應該最小化
```

---

## 🔍 驗證環境設定

### 在 Console 中檢查

部署完成後，訪問網站並打開 Console（F12），執行：

```javascript
// 檢查環境
console.log('APP_ENV:', process.env.EXPO_PUBLIC_APP_ENV);

// 或查看應用內的環境資訊
// 應該會自動輸出類似：
// 🔍 DEBUG - Current environment: development
// 🔍 DEBUG - Supabase config: {...}
```

### 預期輸出

**Staging (to-do-staging.vercel.app):**
```
Current environment: development
Supabase URL: qerosiozltqrbehctxdn.supabase.co
Debug Mode: enabled
```

**Production (to-do-mvp.vercel.app):**
```
Current environment: production
Supabase URL: ajbusqpjsjcuzzxuueij.supabase.co
Debug Mode: disabled
```

---

## ⚠️ 常見問題

### Q1: 推送到 develop 但沒有觸發部署？

**檢查:**
1. Vercel 專案的 Production Branch 是否設為 `develop`
2. Vercel 專案是否連接到正確的 Git Repository
3. 檢查 Vercel Dashboard → Deployments 是否有錯誤

### Q2: 部署成功但連接到錯誤的 Supabase？

**檢查:**
1. 環境變數 `EXPO_PUBLIC_APP_ENV` 是否正確
2. 對應的 Supabase URL 變數是否正確
3. 重新部署（Deployments → Redeploy）

### Q3: 環境變數更新後沒有生效？

**解決方法:**
1. 環境變數修改後，需要重新部署
2. Vercel Dashboard → Deployments → 點擊最新部署的三點選單 → Redeploy
3. 或推送新的 commit 觸發自動部署

### Q4: 如何切換回 main branch？

如果不小心設定錯了：
1. Settings → Git → Production Branch
2. 改回 `main`
3. Save

---

## 📚 參考資源

- [Vercel Git Integration](https://vercel.com/docs/deployments/git)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

---

## 🎉 完成！

設定完成後，你的工作流程應該是：

1. **開發:** 在 `develop` 分支開發
2. **推送:** `git push origin develop`
3. **自動部署:** Vercel 自動部署到 `to-do-staging.vercel.app`
4. **測試:** 在 Staging 環境測試
5. **發布:** 合併到 `main` → 自動部署到 `to-do-mvp.vercel.app`

簡單、清晰、自動化！🚀

