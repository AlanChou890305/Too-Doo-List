# Vercel Production Branch 設定指南

## 🎯 目標

讓 `develop` branch 成為 Staging 專案的 **Production Branch**，這樣：
- ✅ Push to `develop` → 部署到 `to-do-staging.vercel.app`（production URL）
- ❌ Push to `main` → 不部署到這個專案

---

## 🔍 當前問題

- Vercel 專案預設連接到 `main` 作為 production branch
- `develop` branch 的 push 只會創建 preview deployment（臨時 URL）
- 需要改變 production branch 為 `develop`

---

## ✅ 解決方案（3 種方法）

### 方法 1：使用 Vercel Dashboard（如果有選項）

#### 步驟 A：檢查 Settings → General

1. 進入 Vercel 專案
2. **Settings → General**
3. 往下滾動，找尋 **"Production Branch"** 設定
4. 如果有下拉選單，選擇 `develop`
5. Save

#### 步驟 B：或檢查 Settings → Git

1. **Settings → Git**
2. 看是否有 **"Git Configuration"** 區域
3. 找 **"Production Branch Override"** 或類似選項

---

### 方法 2：刪除並重新創建專案（最直接）⭐

#### 步驟：

1. **記下當前設定**
   - 環境變數
   - Domain 設定
   - Deploy Hooks

2. **刪除當前 Staging 專案**
   - Settings → General → 滾到最底部
   - Delete Project

3. **重新創建專案**
   ```
   Dashboard → Add New... → Project
   ↓
   Import Repository: Too-Doo-List
   ↓
   Configure Project 頁面
   ```

4. **在 Configure Project 頁面展開 Advanced Settings**
   - 點擊 "Root Directory" 右邊的箭頭展開
   - 或找 "Git" 相關設定
   - **應該會看到 "Production Branch" 選項**
   - 選擇 `develop`

5. **設定環境變數**
   ```
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=your_key
   ```

6. **Deploy**

7. **設定 Domain**
   - Settings → Domains
   - 加入 `to-do-staging.vercel.app`

---

### 方法 3：使用 vercel.json + Vercel CLI（進階）

#### 當前 `vercel.json` 設定：

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false,
      "develop": true
    }
  }
}
```

**這個設定的問題：** 
- ✅ 可以控制哪些 branch 觸發部署
- ❌ 但不能改變 production branch
- ❌ `develop` 仍然會部署到 preview URL，不是 production URL

#### 需要額外步驟：使用 Vercel CLI

```bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 登入
vercel login

# 3. 連接專案
cd /Users/hububble/Desktop/Too-Doo-List
vercel link

# 4. 設定 production branch
vercel git connect
# 在互動式介面選擇 develop 作為 production branch

# 5. 推送設定
vercel env pull
```

---

## 🎯 我的推薦方案

### 最簡單：方法 2（重新創建專案）

**為什麼推薦：**
- ✅ 最清楚明確
- ✅ 可以在創建時選擇正確的 production branch
- ✅ 避免舊設定的干擾
- ⏱️ 只需 5-10 分鐘

**步驟總結：**

1. **準備工作（記錄設定）：**
   ```
   環境變數：
   - EXPO_PUBLIC_APP_ENV=development
   - EXPO_PUBLIC_SUPABASE_URL_DEV=https://qerosiozltqrbehctxdn.supabase.co
   - EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV=[記下來]
   
   Domain: to-do-staging.vercel.app
   ```

2. **刪除舊專案：**
   - Settings → General → Delete Project

3. **重新創建：**
   - Import Too-Doo-List
   - Configure Project → **展開 Advanced 或 Git 設定**
   - **選擇 Production Branch: develop** ⭐
   - 設定環境變數
   - Deploy

4. **設定 Domain：**
   - Settings → Domains → Add `to-do-staging.vercel.app`

5. **測試：**
   ```bash
   git checkout develop
   echo "test" >> test.txt
   git add test.txt
   git commit -m "[test] Staging deployment"
   git push origin develop
   
   # 檢查是否部署到 to-do-staging.vercel.app
   ```

---

## 🔍 如何確認設定正確？

### 檢查 1：Deployments 頁面

部署後應該看到：
```
✅ Production (to-do-staging.vercel.app)
   Branch: develop
   
而不是：
❌ Preview
   Branch: develop
```

### 檢查 2：Git Push 行為

```bash
# Push to develop
git push origin develop
→ 應該部署到 to-do-staging.vercel.app (production)

# Push to main  
git push origin main
→ 不應該在這個專案創建部署
```

---

## 💡 Deploy Hooks 的真正用途

你之前設定的 Deploy Hook：
```
Name: Staging
Branch: develop
URL: https://api.vercel.com/v1/integrations/deploy/...
```

**用途：**
- 手動觸發 `develop` branch 的部署
- 適合 CI/CD pipeline
- 不是用來改變 production branch 的

**使用方式：**
```bash
# 手動觸發部署
curl -X POST "https://api.vercel.com/v1/integrations/deploy/..."
```

**跟 Git push 的關係：**
- Deploy Hook：手動觸發
- Git push：自動觸發
- 兩者獨立運作

---

## 📋 完整設定檢查清單

### Staging 專案（to-do-staging）

- [ ] **Production Branch 設定**
  - [ ] Production Branch = `develop`
  - [ ] 確認方式：Deployments 顯示 "Production" 而非 "Preview"

- [ ] **環境變數**
  - [ ] `EXPO_PUBLIC_APP_ENV=development`
  - [ ] `EXPO_PUBLIC_SUPABASE_URL_DEV`=Staging URL
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV`=Staging Key

- [ ] **Domain**
  - [ ] Production Domain = `to-do-staging.vercel.app`

- [ ] **Git 行為**
  - [ ] Push to `develop` → 部署到 production URL
  - [ ] Push to `main` → 不觸發部署（可選）

### Production 專案（to-do-mvp）

- [ ] **Production Branch 設定**
  - [ ] Production Branch = `main`

- [ ] **環境變數**
  - [ ] `EXPO_PUBLIC_APP_ENV=production`
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`=Production URL
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`=Production Key

- [ ] **Domain**
  - [ ] Production Domain = `to-do-mvp.vercel.app`

---

## 🆘 還是找不到設定？

如果在 Vercel Dashboard 完全找不到 "Production Branch" 選項：

### 使用 Vercel CLI（最終方案）

```bash
# 1. 安裝並登入
npm i -g vercel
vercel login

# 2. 切換到專案目錄
cd /Users/hububble/Desktop/Too-Doo-List

# 3. 連接到 Vercel 專案
vercel link
# 選擇 to-do-staging 專案

# 4. 部署到 develop branch
git checkout develop
vercel --prod
# 這會部署當前 branch (develop) 到 production

# 5. 設定自動部署
# 編輯 .vercel/project.json（會自動生成）
# 確認 orgId 和 projectId 正確
```

---

## 🎯 總結

**最快速的解決方案：**
1. 刪除當前 Staging 專案
2. 重新創建，在創建時選擇 `develop` 作為 production branch
3. 設定環境變數和 domain
4. 測試部署

**如果實在找不到 production branch 選項：**
- 使用 Vercel CLI
- 或聯繫 Vercel 支援

有問題隨時問我！🚀

