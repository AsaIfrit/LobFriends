# 🦞 龍蝦好友會

一款可以多人連線的 3D 小島生活遊戲，直接在瀏覽器裡玩（手機、電腦都可以）。

## 上線步驟

### 1. 建立 Supabase 專案（負責多人連線）
1. 到 https://supabase.com 註冊（可以直接用 GitHub 帳號登入）。
2. 按 **New project**，取一個名字、設定資料庫密碼，地區選離你最近的（例如 Tokyo 或 Singapore），按建立，等 1～2 分鐘。
3. 進到專案後，到左下 **Project Settings → API**（新版介面可能叫 **Data API** 或 **API Keys**），複製兩個值：
   - **Project URL**（像 `https://xxxxxxxx.supabase.co`）
   - **anon public key**（`eyJ` 開頭的長字串；新版可能是 `sb_publishable_` 開頭的 Publishable key）
4. 用記事本打開 `config.js`，把兩個值貼進引號裡，存檔。

> 這兩個值本來就是設計成可以公開放在網頁上的，不是密碼。不需要建立任何資料表。

### 2. 放到 GitHub Pages
1. 到 https://github.com 新增一個 **Public** repository，例如 `lobster-friends`。
2. 在 repository 頁面按 **Add file → Upload files**，把這個資料夾裡的**所有檔案和 js 資料夾**一起拖進去（`index.html` 要在最上層，不要多包一層資料夾），按 **Commit changes**。
3. 到 **Settings → Pages**，Source 選 **Deploy from a branch**，Branch 選 **main**、資料夾選 **/(root)**，按 **Save**。
4. 等 1～2 分鐘，網址會是 `https://你的帳號.github.io/lobster-friends/`。
5. 把網址分享給朋友，大家同時打開就能在地圖上看到彼此、發表情、聊天！

### 之後要更新遊戲
在 repository 裡重新 Upload files 覆蓋舊檔案就好（`config.js` 記得保留你填好的版本）。

## 連不上時
- 左上角會顯示「🟢 線上 N 人」，如果一直是「連線中…」：
  - 檢查 `config.js` 的兩個值有沒有貼錯、有沒有多空白。
  - 到 Supabase 專案的 **Realtime → Settings**，確認有允許公開頻道（Allow public access / 不要只限 private channels）。
- 免費方案有同時連線人數和訊息量的上限，朋友間試玩通常夠用。

## 操作
- 電腦：WASD 移動、Shift 跑、空白鍵跳、J／點擊攻擊、E 或 F 互動、1～0 切換道具、B 背包、Q 表情、C 合成、T 天賦、滾輪切換道具、Shift＋滾輪縮放
- 手機：左半邊拖曳移動、右半邊轉視角、右上 ☰ 開選單
- iPhone 全螢幕：用 Safari 開網址 → 分享 → 加入主畫面
