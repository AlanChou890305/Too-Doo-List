# AdMob app-ads.txt 設置指南

本指南說明如何設置 `app-ads.txt` 文件以通過 AdMob 的應用程式驗證。

## ✅ 已完成的工作

1. **創建 app-ads.txt 文件**
   - 位置：`public/app-ads.txt`
   - 內容：`google.com, pub-6912116995419220, DIRECT, f08c47fec0942fa0`

2. **更新 Vercel 配置**
   - 在 `vercel.json` 中添加了 headers 配置，確保正確的 Content-Type

3. **自動部署**
   - `scripts/copy-public.js` 會自動將 `public/app-ads.txt` 複製到 `dist` 目錄
   - Vercel 會自動部署到 `https://to-do-mvp.vercel.app/app-ads.txt`

## 📋 驗證步驟

### 1. 部署到 Vercel

確保文件已部署：

```bash
# 本地構建測試
npm run build

# 檢查 dist 目錄中是否有 app-ads.txt
ls -la dist/app-ads.txt
```

### 2. 驗證文件可訪問

部署後，訪問以下 URL 確認文件可訪問：

```
https://to-do-mvp.vercel.app/app-ads.txt
```

您應該看到：
```
google.com, pub-6912116995419220, DIRECT, f08c47fec0942fa0
```

### 3. 檢查文件格式

確保文件：
- ✅ 位於網站根目錄（`/app-ads.txt`）
- ✅ Content-Type 為 `text/plain`
- ✅ 內容格式正確（每行一個條目）
- ✅ 沒有額外的空格或空行（除了最後一個換行符）

### 4. 在 AdMob 中驗證

1. 登入 [AdMob 控制台](https://admob.google.com/)
2. 前往「應用程式」→ 選擇您的應用程式
3. 點擊「驗證應用程式」或「檢查 app-ads.txt」
4. AdMob 會自動爬取您的網站並驗證文件

### 5. 等待驗證完成

- 通常需要幾分鐘到幾小時
- 如果驗證失敗，檢查：
  - 文件是否可公開訪問
  - 內容是否與 AdMob 帳戶中的信息匹配
  - 域名是否與 App Store 中列出的完全一致

## 🔍 疑難排解

### 問題：文件無法訪問（404）

**解決方案：**
1. 確認 `public/app-ads.txt` 存在
2. 運行 `npm run build` 檢查 `dist/app-ads.txt` 是否存在
3. 檢查 Vercel 部署日誌
4. 確認 Vercel 項目設置正確

### 問題：Content-Type 不正確

**解決方案：**
- `vercel.json` 中已配置正確的 headers
- 如果仍有問題，檢查 Vercel 部署設置

### 問題：AdMob 無法驗證

**檢查清單：**
1. ✅ 文件可通過 HTTPS 訪問
2. ✅ 文件內容與 AdMob 帳戶匹配
3. ✅ 域名與 App Store 中列出的完全一致
4. ✅ 文件格式正確（無額外空格）
5. ✅ 等待足夠的時間讓 AdMob 爬取

### 問題：域名不匹配

**重要：** AdMob 要求 `app-ads.txt` 的域名必須與 App Store 中列出的開發者網站域名**完全一致**。

如果您的 App Store 列表中的開發者網站是：
- `https://to-do-mvp.vercel.app` → 文件必須在 `https://to-do-mvp.vercel.app/app-ads.txt`
- 如果使用自訂域名，文件必須在該自訂域名的根目錄

## 📝 文件內容說明

```
google.com, pub-6912116995419220, DIRECT, f08c47fec0942fa0
```

格式說明：
- `google.com` - 廣告系統域名
- `pub-6912116995419220` - 您的 AdMob Publisher ID
- `DIRECT` - 關係類型（直接關係）
- `f08c47fec0942fa0` - 認證 ID

## 🔄 更新流程

如果需要更新 `app-ads.txt`：

1. 編輯 `public/app-ads.txt`
2. 提交更改到 Git
3. Vercel 會自動部署
4. 等待部署完成後，在 AdMob 中重新驗證

## ⚠️ 重要注意事項

1. **域名必須完全匹配**
   - App Store 中的開發者網站域名必須與部署 `app-ads.txt` 的域名完全一致
   - 大小寫敏感

2. **文件必須可公開訪問**
   - 不能需要認證
   - 必須通過 HTTPS 訪問
   - 必須返回正確的 Content-Type

3. **內容必須準確**
   - Publisher ID 必須與 AdMob 帳戶中的完全一致
   - 格式必須符合 IAB Tech Lab 規範

## 📚 相關資源

- [IAB Tech Lab app-ads.txt 規範](https://iabtechlab.com/ads-txt/)
- [AdMob app-ads.txt 文檔](https://support.google.com/admob/answer/9363762)
- [Vercel 靜態文件部署](https://vercel.com/docs/concepts/projects/overview#static-files)

---

**最後更新**：2024年
