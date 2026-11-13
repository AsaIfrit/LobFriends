// ===================== 多人連線設定 =====================
// 到 Supabase 專案的 Project Settings → API（或 Data API）複製下面兩個值貼進引號裡。
// 兩個都留空的話，遊戲會是單人模式（在 claude.ai 裡則使用 claude 的房間連線）。
window.LOBSTER_CONFIG = {
  SUPABASE_URL: 'https://uqzyofxutwummtemynqk.supabase.co/rest/v1/',        // 例如 'https://abcdefghijk.supabase.co'
  SUPABASE_ANON_KEY: 'sb_publishable_4-o5iyfiedXNPI_JmIWoag_8ZCgmZIv',   // 一長串以 eyJ 開頭的 anon public key（或 sb_publishable_ 開頭的 publishable key）
  ROOM: 'lob-world'    // 房間名稱，想開不同伺服器可以改成別的名字
};
