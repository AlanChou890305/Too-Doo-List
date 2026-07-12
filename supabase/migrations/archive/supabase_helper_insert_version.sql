-- Helper Script: Insert New App Version with Release Notes
-- Usage: Manually update version, build_number, and release_notes before executing

-- Step 1: Deactivate old versions (optional)
UPDATE public.app_versions
SET is_active = false
WHERE platform = 'ios' AND is_active = true;

-- Step 2: Insert new version
-- ⚠️ IMPORTANT: Update these values before executing!
INSERT INTO public.app_versions (
  version,
  build_number,
  platform,
  is_active,
  force_update,
  release_notes,
  update_url
) VALUES (
  '1.2.4',  -- ← 更新版本號
  '12',     -- ← 更新 Build 號
  'ios',
  true,
  false,    -- ← 是否強制更新（true/false）
  '錯誤修正與改進

- 修正日曆導覽問題：切換月份時，選定的日期不再自動跳回 1 號
- 強化今日指示器：標記今日的紫色圓圈變得稍微大一點，更容易看見
- 改進分析追蹤：更好的事件追蹤機制，幫助我們了解你如何使用 App，進而改善體驗

後端優化

- 使用者版本追蹤，提供更好的支援與診斷
- 自動偵測時區，確保排程準確',  -- ← 從 RELEASE_NOTES.md 複製
  'https://apps.apple.com/app/id6739833088'  -- ← App Store 連結
);

-- Step 3: Verify insertion
SELECT
  version,
  build_number,
  platform,
  is_active,
  force_update,
  LEFT(release_notes, 100) as release_notes_preview,
  created_at
FROM public.app_versions
WHERE platform = 'ios'
ORDER BY created_at DESC
LIMIT 3;

-- Expected output:
-- version | build_number | platform | is_active | force_update | release_notes_preview | created_at
-- 1.2.4   | 12           | ios      | true      | false        | 本版新增...           | (just now)
-- 1.2.3   | 11           | ios      | false     | false        | ...                  | (previous)
