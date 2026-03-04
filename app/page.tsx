// @ts-nocheck
"use client"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import type { Post, Template, RecurringRule } from "@/lib/types"

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const STATUSES = [
  { id: "draft",     label: "準備中",   color: "#7A9AB5" },
  { id: "wip",       label: "作成中",   color: "#D97706" },
  { id: "done",      label: "作成済み", color: "#2563EB" },
  { id: "scheduled", label: "予約済み", color: "#7C3AED" },
  { id: "live",      label: "公開済み", color: "#059669" },
];

const PLATFORMS = [
  { id: "yt",        name: "YouTube",          color: "#FF4444", icon: "▶", short: "YT" },
  { id: "tw",        name: "Twitter/X",         color: "#1D9BF0", icon: "𝕏", short: "TW" },
  { id: "tt",        name: "TikTok",            color: "#69C9D0", icon: "♪", short: "TT" },
  { id: "ig",        name: "Instagram",         color: "#E1306C", icon: "◈", short: "IG" },
  { id: "shorts",    name: "YT Shorts",         color: "#FF6B35", icon: "▷", short: "SH" },
  { id: "community", name: "Community",         color: "#7C3AED", icon: "◆", short: "CO" },
];


// 配信管理対象
const TARGETS = [
  { id: "shia",     name: "しあらぼ", color: "#EC4899", icon: "✦" },
  { id: "raica",    name: "ライカレ", color: "#10B981", icon: "◈" },
  { id: "yuru",     name: "ゆるラボ", color: "#3B82F6", icon: "◎" },
  { id: "note",     name: "note",    color: "#41C9B0", icon: "n" },
  { id: "x",        name: "X",       color: "#1D9BF0", icon: "𝕏" },
  { id: "line",     name: "LINE",    color: "#06C755", icon: "L" },
  { id: "merumaga", name: "メルマガ", color: "#F59E0B", icon: "✉" },
  { id: "other",    name: "その他",  color: "#94A3B8", icon: "…" },
];
const NAV_ITEMS = [
  { id: "calendar", label: "週間カレンダー", icon: "◫" },
  { id: "list",     label: "配信リスト",    icon: "≡"  },
  { id: "template", label: "テンプレート",  icon: "⊞"  },
  { id: "dest",     label: "配信先",       icon: "◉"  },
  { id: "settings", label: "設定",         icon: "⚙"  },
  { id: "setup",    label: "データ連携",      icon: "⬡"  },
  { id: "help",     label: "マニュアル",    icon: "?"   },
];

const DAYS_JP = ["日", "月", "火", "水", "木", "金", "土"];
const TODAY = new Date();
function fmtDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function todayStr() { return fmtDate(TODAY); }
function getWeekDates(anchor) {
  const d = new Date(anchor), day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return x; });
}
function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n); return fmtDate(d);
}

// (seed data removed — loaded from Supabase)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARED STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const S = {
  primary: { background:"#6D4EE8", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontSize:13, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5, whiteSpace:"nowrap", letterSpacing:"-0.01em" },
  ghost:   { background:"transparent", border:"1px solid #D8D0F8", borderRadius:8, color:"#C0BCCE", padding:"7px 12px", fontSize:13, cursor:"pointer", display:"inline-flex", alignItems:"center" },
  input:   { width:"100%", border:"1px solid #D8D0F8", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#1A1040", outline:"none", background:"#FAFCFF", fontFamily:"inherit", boxSizing:"border-box" },
  label:   { display:"block", fontSize:11, fontWeight:700, color:"#C0BCCE", letterSpacing:"0.06em", marginBottom:5 },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MICRO COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Toggle = ({ on, onChange }) => (
  <div onClick={() => onChange(!on)} style={{ width:42, height:23, borderRadius:12, background:on?"#8B6FE8":"#A78BFA", cursor:"pointer", display:"flex", alignItems:"center", padding:"0 3px", transition:"background 0.2s", flexShrink:0 }}>
    <div style={{ width:17, height:17, borderRadius:"50%", background:"#fff", marginLeft:on?"auto":0, transition:"margin 0.2s" }} />
  </div>
);

const StatusPill = ({ status, onChange, size="sm" }) => {
  const s = STATUSES.find(x => x.id === status) || STATUSES[0];
  const baseStyle = { background:`${s.color}18`, color:s.color, border:`1px solid ${s.color}40`, borderRadius:6, fontWeight:700, cursor:onChange?"pointer":"default", fontFamily:"inherit" };
  if (onChange) return (
    <select value={status} onChange={e => onChange(e.target.value)} style={{ ...baseStyle, padding: size==="xs"?"2px 6px":"3px 8px", fontSize: size==="xs"?10:11, outline:"none" }}>
      {STATUSES.map(x => <option key={x.id} value={x.id} style={{ background:"#fff", color:x.color }}>{x.label}</option>)}
    </select>
  );
  return <span style={{ ...baseStyle, padding: size==="xs"?"2px 6px":"2px 9px", fontSize: size==="xs"?10:11, display:"inline-block" }}>{s.label}</span>;
};

const PlatformChip = ({ platformId, size="sm" }) => {
  const p = PLATFORMS.find(x => x.id === platformId);
  if (!p) return null;
  return (
    <span style={{ fontSize:size==="xs"?9:10, color:p.color, background:`${p.color}15`, borderRadius:4, padding: size==="xs"?"1px 5px":"2px 6px", fontWeight:700, flexShrink:0 }}>
      {size==="xs" ? p.short : p.name}
    </span>
  );
};


const TargetChip = ({ targetId }) => {
  const t = TARGETS.find(x => x.id === targetId);
  if (!t) return null;
  return (
    <span style={{ fontSize:9, color:t.color, background:`${t.color}18`, borderRadius:4, padding:"1px 5px", fontWeight:700, borderLeft:`2px solid ${t.color}` }}>
      {t.name}
    </span>
  );
};
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEARCH MODAL (Cmd+K)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SearchModal({ posts, templates, onSelectPost, onClose }) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    if (!q.trim()) return { posts: posts.slice(0, 6), templates: templates.slice(0, 4) };
    const lq = q.toLowerCase();
    return {
      posts: posts.filter(p => [p.title, p.body, p.note, ...p.tags].join(" ").toLowerCase().includes(lq)).slice(0, 8),
      templates: templates.filter(t => [t.title, t.body, t.folder, ...t.tags].join(" ").toLowerCase().includes(lq)).slice(0, 5),
    };
  }, [q, posts, templates]);

  const highlight = (text) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark style={{ background:"#FEF08A", color:"#1A1040", borderRadius:2 }}>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,20,35,0.65)", zIndex:500, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:100, backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div style={{ width:580, background:"#fff", borderRadius:16, boxShadow:"0 24px 60px rgba(0,0,0,0.25)", overflow:"hidden", animation:"searchIn 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px", borderBottom:"1px solid #EDE8FF" }}>
          <span style={{ fontSize:18, color:"#7A9AB5" }}>⌕</span>
          <input ref={inputRef} value={q}
            onChange={e => { setQ(e.target.value); setCursor(-1); }}
            onKeyDown={e => {
              const total = results.posts.length + results.templates.length;
              if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c+1, total-1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c-1, -1)); }
              else if (e.key === "Enter" && cursor >= 0) {
                if (cursor < results.posts.length) { onSelectPost(results.posts[cursor]); onClose(); }
              }
            }}
            placeholder="配信・テンプレートを検索..."
            style={{ flex:1, border:"none", outline:"none", fontSize:16, color:"#1A1040", fontFamily:"inherit", background:"transparent" }} />
          <kbd style={{ background:"#E9DFFE", color:"#C0BCCE", borderRadius:5, padding:"2px 7px", fontSize:11, fontWeight:700 }}>ESC</kbd>
        </div>

        <div style={{ maxHeight:480, overflowY:"auto" }}>
          {results.posts.length > 0 && (
            <div>
              <div style={{ padding:"10px 20px 6px", fontSize:10, fontWeight:800, color:"#7A9AB5", letterSpacing:"0.1em" }}>配信</div>
              {results.posts.map((p, pi) => {
                const s = STATUSES.find(x => x.id === p.status);
                return (
                  <div key={p.id} onClick={() => { onSelectPost(p); onClose(); }}
                    style={{ padding:"11px 20px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", background:cursor===pi?"#EDE6FF":"transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background="#EDE6FF"}
                    onMouseLeave={e => { if(cursor!==pi) e.currentTarget.style.background="transparent"; }}>
                    <div style={{ width:3, height:32, borderRadius:2, background:s?.color, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1A1040", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{highlight(p.title || "（タイトル未入力）")}</div>
                      <div style={{ fontSize:11, color:"#C0BCCE", marginTop:2 }}>{p.date.slice(5).replace("-","/")} · {p.time}</div>
                    </div>
                    <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                      {p.platforms.slice(0,2).map(pid => <PlatformChip key={pid} platformId={pid} size="xs" />)}
                      <StatusPill status={p.status} size="xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {results.templates.length > 0 && (
            <div style={{ borderTop: results.posts.length > 0 ? "1px solid #EDE8FF" : "none" }}>
              <div style={{ padding:"10px 20px 6px", fontSize:10, fontWeight:800, color:"#7A9AB5", letterSpacing:"0.1em" }}>テンプレート</div>
              {results.templates.map(t => (
                <div key={t.id} style={{ padding:"11px 20px", display:"flex", alignItems:"center", gap:12 }}
                  onMouseEnter={e => e.currentTarget.style.background="#EDE6FF"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <span style={{ fontSize:18, flexShrink:0 }}>📄</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1A1040" }}>{highlight(t.title)}</div>
                    <div style={{ fontSize:11, color:"#C0BCCE", marginTop:2 }}>📂 {t.folder} · {t.tags.map(x=>`#${x}`).join(" ")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.posts.length === 0 && results.templates.length === 0 && (
            <div style={{ padding:"40px 20px", textAlign:"center", color:"#7A9AB5", fontSize:14 }}>"{q}" に一致する結果がありません</div>
          )}
        </div>

        <div style={{ padding:"10px 20px", borderTop:"1px solid #EDE8FF", display:"flex", gap:16, color:"#7A9AB5", fontSize:11 }}>
          <span>↑↓ 移動</span><span>↵ 選択</span><span>ESC 閉じる</span>
        </div>
      </div>
    </div>
  );
}


function filterTemplates(templates, q) {
  if (!q.trim()) return templates;
  const lq = q.toLowerCase();
  return templates.filter(t => [t.title, t.folder, ...t.tags, t.body].join(" ").toLowerCase().includes(lq));
}
function highlightTitle(title, q) {
  if (!q.trim()) return title;
  const idx = title.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return title;
  return [title.slice(0,idx), title.slice(idx,idx+q.length), title.slice(idx+q.length)];
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECURRING ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateRecurringPosts(rules, existingPosts, weeksAhead = 4) {
  const generated = [];
  const endDate = new Date(TODAY);
  endDate.setDate(endDate.getDate() + weeksAhead * 7);

  rules.filter(r => r.active).forEach(rule => {
    const start = new Date(rule.startDate);
    const cursor = new Date(start);
    let counter = rule.counter;

    while (cursor <= endDate) {
      const ds = fmtDate(cursor);
      if (cursor >= TODAY || ds >= todayStr()) {
        const alreadyExists = existingPosts.some(p => p.recurringId === rule.id && p.date === ds);
        if (!alreadyExists) {
          const title = rule.titleTemplate.replace("{{n}}", counter);
          generated.push({
            id: `gen_${rule.id}_${ds}`, title, date: ds, time: rule.time,
            duration: rule.duration, status: "draft", platforms: rule.platforms,
            tags: rule.tags, body: "", note: "", recurringId: rule.id, isGenerated: true, postTargets: [], defaultTemplateId: rule.defaultTemplateId || null,
          });
        }
      }
      counter++;
      if (rule.freq === "weekly")   cursor.setDate(cursor.getDate() + 7);
      else if (rule.freq === "daily")    cursor.setDate(cursor.getDate() + 1);
      else if (rule.freq === "biweekly") cursor.setDate(cursor.getDate() + 14);
      else if (rule.freq === "monthly") {
        const targetDay = rule.monthDay || cursor.getDate();
        cursor.setMonth(cursor.getMonth() + 1);
        // clamp to valid day (e.g. 31 → end of month)
        const maxDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        cursor.setDate(Math.min(targetDay, maxDay));
      }
      else break;
    }
  });
  return generated;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTION IMPORT PANEL  (Notion REST API直接連携)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function NotionImportPanel({ onImport, onClose }) {
  const [token, setToken]       = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState([]);
  const [pageContent, setPageContent] = useState({});
  const [error, setError]       = useState("");
  const [imported, setImported] = useState(new Set());

  const saveToken = () => {
    setTokenSaved(true);
  };

  // Extract plain text from Notion rich_text array
  const richToText = (arr) => (arr || []).map(x => x.plain_text || "").join("");

  // Get plain text from a page's blocks
  const fetchPageBlocks = async (pageId) => {
    const res = await fetch("/api/notion", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ action: "blocks", pageId }),
    });
    const data = await res.json();
    return (data.results || []).map(block => {
      const type = block.type;
      const content = block[type];
      if (content?.rich_text) return richToText(content.rich_text);
      return "";
    }).filter(Boolean).slice(0, 20).join("\n");
  };

  const search = async () => {
    if (!token.trim()) { setError("Notion Integration Tokenを入力してください"); return; }
    if (!query.trim()) return;
    setLoading(true); setError(""); setResults([]);
    try {
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ action: "search", query }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const pages = (data.results || []).map(p => {
        const props = p.properties || {};
        // Try to get title from common property names
        const titleProp = props.title || props.Name || props.名前 || props["タイトル"] || Object.values(props).find(v => v.type === "title");
        const title = titleProp ? richToText(titleProp.title || titleProp.rich_text || []) : "（タイトルなし）";
        const folder = p.parent?.database_id ? "Notionデータベース" : "Notionページ";
        return { id: p.id, title, folder, tags:[], body:"", url: p.url };
      });
      setResults(pages);
      if (pages.length === 0) setError("「" + query + "」に一致するページが見つかりませんでした");
    } catch (e) {
      setError(`検索エラー: ${e.message}。トークンとNotionの統合設定を確認してください。`);
    }
    setLoading(false);
  };

  const loadContent = async (item) => {
    if (pageContent[item.id] !== undefined) return;
    setPageContent(prev => ({ ...prev, [item.id]: "読み込み中..." }));
    try {
      const body = await fetchPageBlocks(item.id);
      setPageContent(prev => ({ ...prev, [item.id]: body || "（本文なし）" }));
    } catch {
      setPageContent(prev => ({ ...prev, [item.id]: "（本文の取得に失敗しました）" }));
    }
  };

  const doImport = (item) => {
    onImport({ id: Date.now() + Math.random(), title: item.title, folder: item.folder, tags:[], body: pageContent[item.id] || "" });
    setImported(s => new Set([...s, item.id]));
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,20,35,0.65)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div style={{ width:580, background:"#fff", borderRadius:16, boxShadow:"0 24px 60px rgba(0,0,0,0.25)", overflow:"hidden", animation:"searchIn 0.18s ease", maxHeight:"88vh", display:"flex", flexDirection:"column" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"18px 24px", borderBottom:"1px solid #EDE8FF", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"#F7F6F3", border:"1px solid #E8E5E0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"#4B38C8" }}>𝒩</div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#4B38C8" }}>Notionから取り込む</div>
              <div style={{ fontSize:11, color:"#C0BCCE", marginTop:1 }}>ページをテンプレートとして読み込む</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#C0BCCE", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"18px 24px" }}>
          {/* Token section */}
          <div style={{ background:"#EDE6FF", border:"1px solid #EDE8FF", borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label style={{ ...S.label, margin:0 }}>NOTION INTEGRATION TOKEN</label>
              {tokenSaved && <span style={{ fontSize:10, color:"#059669", fontWeight:700 }}>✓ 保存済み</span>}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input type="password" value={token} onChange={e => { setToken(e.target.value); setTokenSaved(false); }}
                placeholder="secret_xxxxxxxxxxxxxxxxxxxx"
                style={{ ...S.input, flex:1, fontSize:12, fontFamily:"'DM Mono',monospace" }} />
              <button onClick={saveToken} style={{ ...S.primary, padding:"8px 14px", fontSize:11, flexShrink:0, opacity:0.5, cursor:"default" }} disabled>サーバー設定済み</button>
            </div>
            <p style={{ margin:"8px 0 0", fontSize:11, color:"#7A9AB5", lineHeight:1.6 }}>
              Notion → 設定 → コネクト → インテグレーションを開発する → 内部インテグレーション → トークンをコピー
            </p>
            <p style={{ margin:"6px 0 0", fontSize:10, color:"#F59E0B", lineHeight:1.6, background:"#FFFBEB", borderRadius:6, padding:"6px 10px" }}>
              ⚠️ このパネルはデモ用途です。Vercel 本番環境では CORS の制約により直接接続できません。
              Next.js 移行後は <code style={{ background:"#FEF3C7", borderRadius:3, padding:"0 4px" }}>/api/notion</code> ルートを経由してください。
            </p>
          </div>

          {/* Search */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && search()}
              placeholder="例：動画テンプレート、告知フォーマット..."
              style={{ ...S.input, flex:1 }} />
            <button onClick={search} disabled={loading}
              style={{ ...S.primary, opacity:loading?0.6:1, flexShrink:0 }}>
              {loading ? "検索中..." : "検索"}
            </button>
          </div>

          {error && (
            <div style={{ color:"#EF4444", fontSize:12, marginBottom:12, padding:"10px 14px", background:"#FEF2F2", borderRadius:8, lineHeight:1.6 }}>{error}</div>
          )}

          {loading && (
            <div style={{ textAlign:"center", padding:"30px 0", color:"#C0BCCE" }}>
              <div style={{ animation:"spin 1s linear infinite", display:"inline-block", fontSize:22 }}>◌</div>
              <div style={{ fontSize:13, marginTop:10 }}>Notionを検索中...</div>
            </div>
          )}

          {/* Results */}
          {results.map(item => {
            const isOpen = pageContent[item.id] !== undefined;
            const isImported = imported.has(item.id);
            return (
              <div key={item.id} style={{ border:"1px solid #EDE8FF", borderRadius:10, marginBottom:8, overflow:"hidden" }}>
                <div style={{ padding:"13px 16px", display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:18, flexShrink:0, marginTop:2 }}>📄</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#4B38C8" }}>{item.title}</div>
                    <div style={{ fontSize:11, color:"#C0BCCE", marginTop:2 }}>📂 {item.folder}</div>
                    <button onClick={() => loadContent(item)}
                      style={{ marginTop:6, background:"none", border:"none", color:"#C0BCCE", fontSize:11, cursor:"pointer", padding:0, fontFamily:"inherit", textDecoration:"underline" }}>
                      {isOpen ? "本文を隠す" : "本文を確認 →"}
                    </button>
                    {isOpen && (
                      <div style={{ marginTop:8, padding:"10px 12px", background:"#EDE6FF", borderRadius:7, fontSize:11, color:"#64748B", lineHeight:1.7, whiteSpace:"pre-wrap", maxHeight:120, overflow:"auto" }}>
                        {pageContent[item.id]}
                      </div>
                    )}
                  </div>
                  <button onClick={() => doImport(item)} disabled={isImported}
                    style={{ ...S.primary, padding:"7px 14px", fontSize:11, background:isImported?"#C9BCEE":"#4B38C8", color:isImported?"#C0BCCE":"#fff", flexShrink:0, marginTop:2 }}>
                    {isImported ? "✓ 取り込み済" : "取り込む"}
                  </button>
                </div>
              </div>
            );
          })}

          {!loading && results.length === 0 && !error && (
            <div style={{ textAlign:"center", padding:"28px 0", color:"#7C70B8", fontSize:13 }}>
              キーワードを入力してNotionを検索してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CALENDAR VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CalendarView({ allPosts, weekAnchor, setWeekAnchor, selectedPost, onSelect, onNew }) {
  const calRef = useRef(null);
  const weekDates = getWeekDates(weekAnchor);
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const SLOT_H = 60;
  const NOW_H = 14, NOW_M = 30;

  useEffect(() => { if (calRef.current) calRef.current.scrollTop = 7 * SLOT_H; }, []);

  const getPostsForDay = (d) => allPosts.filter(p => p.date === fmtDate(d));
  const timeToTop = (time) => { const [h, m] = time.split(":").map(Number); return (h + m/60) * SLOT_H; };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 24px 12px", background:"#F8F5FF", borderBottom:"1px solid #E8E2FF", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#4B38C8" }}>
            {weekDates[0].getMonth()+1}月{weekDates[0].getDate()}日 — {weekDates[6].getMonth()+1}月{weekDates[6].getDate()}日
          </h2>
          <span style={{ fontSize:12, color:"#7A9AB5", fontWeight:600 }}>{weekDates[0].getFullYear()}</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button style={S.ghost} className="btn-ghost" onClick={() => { const d=new Date(weekAnchor); d.setDate(d.getDate()-7); setWeekAnchor(d); }}>←</button>
          <button style={{ ...S.ghost, fontSize:12, fontWeight:700, padding:"6px 12px" }} className="btn-ghost" onClick={() => setWeekAnchor(new Date())}>今週</button>
          <button style={S.ghost} className="btn-ghost" onClick={() => { const d=new Date(weekAnchor); d.setDate(d.getDate()+7); setWeekAnchor(d); }}>→</button>
          <button style={S.primary} onClick={() => onNew(todayStr(), "10:00")}>+ 配信を追加</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display:"flex", background:"#F8F5FF", borderBottom:"1px solid #E8E2FF", flexShrink:0, paddingLeft:52 }}>
        {weekDates.map((d, i) => {
          const isToday = fmtDate(d) === todayStr();
          return (
            <div key={i} style={{ flex:1, padding:"8px 0", textAlign:"center" }}>
              <div style={{ fontSize:10, color:i===0?"#EF4444":i===6?"#2563EB":"#C0BCCE", fontWeight:700, letterSpacing:"0.08em" }}>{DAYS_JP[d.getDay()]}</div>
              <div style={{ width:28, height:28, borderRadius:"50%", background:isToday?"#4B38C8":"transparent", display:"flex", alignItems:"center", justifyContent:"center", margin:"3px auto 0" }}>
                <span style={{ fontSize:14, fontWeight:isToday?900:500, color:isToday?"#fff":i===0?"#EF4444":i===6?"#2563EB":"#4B38C8" }}>{d.getDate()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div ref={calRef} style={{ flex:1, overflowY:"auto", overflowX:"hidden", position:"relative" }}>
        <div style={{ display:"flex", minHeight:24*SLOT_H }}>
          {/* Time axis */}
          <div style={{ width:52, flexShrink:0, position:"sticky", left:0, background:"#F8F5FF", zIndex:2 }}>
            {HOURS.map(h => (
              <div key={h} style={{ height:SLOT_H, display:"flex", alignItems:"flex-start", justifyContent:"flex-end", paddingRight:10, paddingTop:2 }}>
                <span style={{ fontSize:10, color:"#7C70B8", fontFamily:"'DM Mono',monospace" }}>{String(h).padStart(2,"0")}:00</span>
              </div>
            ))}
          </div>

          {/* Columns */}
          {weekDates.map((d, di) => {
            const dayPosts = getPostsForDay(d);
            const isToday = fmtDate(d) === todayStr();
            return (
              <div key={di} style={{ flex:1, position:"relative", borderLeft:"1px solid #E8E2FF", background:isToday?"#F8F5FF":"#FAFAF8", cursor:"crosshair" }}
                onClick={e => {
                  if (e.target !== e.currentTarget) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relY = e.clientY - rect.top + calRef.current.scrollTop;
                  const h = Math.floor(relY / SLOT_H);
                  const min = (relY % SLOT_H) < 30 ? "00" : "30";
                  onNew(fmtDate(d), `${String(h).padStart(2,"0")}:${min}`);
                }}>
                {HOURS.map(h => <div key={h} style={{ position:"absolute", top:h*SLOT_H, left:0, right:0, borderTop:h===0?"none":"1px solid #EDE8FF", pointerEvents:"none" }} />)}
                {HOURS.map(h => <div key={`h${h}`} style={{ position:"absolute", top:h*SLOT_H+SLOT_H/2, left:0, right:0, borderTop:"1px dashed #F0EBFF", pointerEvents:"none" }} />)}

                {isToday && (
                  <div style={{ position:"absolute", top:(NOW_H+NOW_M/60)*SLOT_H, left:-6, right:0, display:"flex", alignItems:"center", zIndex:3, pointerEvents:"none" }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:"#EF4444", flexShrink:0 }} />
                    <div style={{ flex:1, height:1.5, background:"#EF4444" }} />
                  </div>
                )}

                {dayPosts.map((p, pi) => {
                  const top = timeToTop(p.time || "09:00");
                  const height = Math.max((p.duration || 60)/60*SLOT_H, 28);
                  const s = STATUSES.find(x => x.id === p.status) || STATUSES[0];
                  const isSelected = selectedPost?.id === p.id;
                  const isRecurring = !!p.recurringId;

                  return (
                    <div key={p.id}
                      onClick={e => { e.stopPropagation(); onSelect(p); }}
                      style={{
                        position:"absolute", top, left:4, right:4, height,
                        borderRadius:8,
                        background:isSelected ? s.color : `${s.color}20`,
                        border:`1.5px solid ${isSelected?s.color:s.color+"60"}`,
                        padding:"4px 7px", cursor:"pointer", overflow:"hidden",
                        transition:"all 0.12s", zIndex:2,
                        borderStyle: isRecurring ? "dashed" : "solid",
                      }}>
                      {/* Title */}
                      <div style={{ fontSize:10, fontWeight:700, color:isSelected?"#fff":s.color, lineHeight:1.3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:height>36?2:1, WebkitBoxOrient:"vertical" }}>
                        {isRecurring && <span style={{ opacity:0.7 }}>↻ </span>}
                        {p.title || "（タイトル未入力）"}
                      </div>

                      {/* Status + Media row — always visible if height allows */}
                      {height >= 36 && (
                        <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:3, flexWrap:"wrap" }}>
                          {/* Status badge */}
                          <span style={{
                            fontSize:9, fontWeight:800, letterSpacing:"0.03em",
                            background:isSelected?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.7)",
                            color:isSelected?"#fff":s.color,
                            borderRadius:4, padding:"1px 5px", flexShrink:0,
                          }}>{s.label}</span>

                          {/* Platform chips */}
                          {p.platforms.slice(0,2).map(pid => {
                            const pl = PLATFORMS.find(x => x.id === pid);
                            return pl ? (
                              <span key={pid} style={{
                                fontSize:9, fontWeight:700,
                                color:isSelected?"rgba(255,255,255,0.9)":pl.color,
                                background:isSelected?"rgba(255,255,255,0.08)":`${pl.color}20`,
                                borderRadius:4, padding:"1px 5px", flexShrink:0,
                              }}>{pl.short}</span>
                            ) : null;
                          })}
                          {p.platforms.length > 2 && (
                            <span style={{ fontSize:9, color:isSelected?"rgba(255,255,255,0.6)":"#7A9AB5" }}>+{p.platforms.length-2}</span>
                          )}
                        </div>
                      )}

                      {/* Time */}
                      {height >= 52 && (
                        <div style={{ fontSize:9, color:isSelected?"rgba(255,255,255,0.65)":"#7A9AB5", marginTop:2 }}>{p.time}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIST VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ListView({ posts, filterStatus, setFilterStatus, onSelect, onNew, setPosts, onStatusChange }) {
  const [searchQ, setSearchQ] = useState("");
  const filtered = useMemo(() => {
    let list = filterStatus === "all" ? posts : posts.filter(p => p.status === filterStatus);
    if (searchQ.trim()) {
      const lq = searchQ.toLowerCase();
      list = list.filter(p => [p.title, p.body, p.note, ...p.tags].join(" ").toLowerCase().includes(lq));
    }
    return list.slice().sort((a,b) => a.date.localeCompare(b.date));
  }, [posts, filterStatus, searchQ]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ padding:"14px 24px 12px", background:"#F8F5FF", borderBottom:"1px solid #E8E2FF", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#4B38C8" }}>配信リスト</h2>
          <button style={S.primary} onClick={onNew}>+ 追加</button>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#7A9AB5" }}>⌕</span>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="リスト内を検索..."
              style={{ ...S.input, paddingLeft:32, fontSize:12 }} />
          </div>
          <div style={{ display:"flex", background:"#E9DFFE", borderRadius:8, padding:2, gap:1, flexShrink:0 }}>
            {[{id:"all",label:"すべて",color:"#4B38C8"}, ...STATUSES].map(s => (
              <button key={s.id} onClick={() => setFilterStatus(s.id)}
                style={{ padding:"5px 10px", borderRadius:6, border:"none", fontSize:11, fontWeight:700, cursor:"pointer",
                  background:filterStatus===s.id?"#fff":"transparent", color:filterStatus===s.id?(s.color||"#4B38C8"):"#C0BCCE",
                  boxShadow:filterStatus===s.id?"0 1px 3px rgba(0,0,0,0.12)":"none" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px 24px" }}>
        {filtered.map(p => {
          const s = STATUSES.find(x => x.id === p.status) || STATUSES[0];
          const diff = Math.round((new Date(p.date) - TODAY) / 86400000);
          return (
            <div key={p.id} className="post-row" onClick={() => onSelect(p)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"#fff", borderRadius:10, marginBottom:6, cursor:"pointer", border:"1px solid #EDE8FF", transition:"background 0.1s" }}>
              {p.recurringId && <span title="定期配信" style={{ fontSize:11, color:"#C0BCCE", flexShrink:0 }}>↻</span>}
              <div style={{ width:3, height:36, borderRadius:2, background:s.color, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#1A1040", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title || "（タイトル未入力）"}</div>
                <div style={{ display:"flex", gap:8, marginTop:3, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:diff<0?"#EF4444":diff===0?"#D97706":"#C0BCCE", fontWeight:600 }}>
                    {diff<0?`▲ 期限切れ ${p.date.slice(5).replace("-","/")}`:diff===0?"📍 今日":`${p.date.slice(5).replace("-","/")} (あと${diff}日)`}
                  </span>
                  <span style={{ color:"#7C70B8", fontSize:11 }}>{p.time}</span>
                  {p.platforms.slice(0,3).map(pid => <PlatformChip key={pid} platformId={pid} size="xs" />)}
                  {p.tags.slice(0,2).map(t => <span key={t} style={{ fontSize:10, color:"#C0BCCE", background:"#E9DFFE", borderRadius:4, padding:"1px 6px" }}>#{t}</span>)}
                  {(p.postTargets||[]).slice(0,3).map(pt => {
                    const tg = TARGETS.find(x => x.id === pt.targetId);
                    if (!tg) return null;
                    return <span key={pt.targetId} style={{ fontSize:9, color:tg.color, background:`${tg.color}12`, borderRadius:4, padding:"1px 6px", fontWeight:700, borderLeft:`2px solid ${tg.color}` }}>{tg.name}{pt.url?" 🔗":""}</span>;
                  })}
                </div>
              </div>
              <StatusPill status={p.status} onChange={v => onStatusChange ? onStatusChange({...p, status:v}) : setPosts(ps => ps.map(pp => pp.id===p.id?{...pp,status:v}:pp))} />
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign:"center", color:"#7A9AB5", marginTop:60, fontSize:14 }}>配信がありません</div>}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EDITOR PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function EditorPanel({ post, templates, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(post);
  const [tab, setTab] = useState("editor");
  const [tplOpen, setTplOpen] = useState(false);
  const [tplSearch, setTplSearch] = useState("");
  const filteredTpls = useMemo(() => filterTemplates(templates, tplSearch), [templates, tplSearch]);
  const tplSearchRef = useRef(null);
  const textareaRef = useRef(null);
  useEffect(() => {
    let f = { ...post };
    if (post.defaultTemplateId && !post.body) {
      const tpl = templates.find(t => t.id === post.defaultTemplateId);
      if (tpl) f = { ...f, body: tpl.body };
    }
    setForm(f);
    setTab("editor");
    setTplOpen(false);
    setTplSearch("");
  }, [post.id, templates]);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const insertFormat = (before, after="") => {
    const el = textareaRef.current; if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd, sel = form.body.slice(start, end);
    set("body", form.body.slice(0,start) + before + sel + after + form.body.slice(end));
    setTimeout(() => { el.focus(); el.setSelectionRange(start+before.length, start+before.length+sel.length); }, 0);
  };

  return (
    <div style={{ width:400, background:"#fff", borderLeft:"1px solid #E8E2FF", display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden", animation:"slideIn 0.18s ease" }}>
      <div style={{ padding:"13px 18px", borderBottom:"1px solid #EDE8FF", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", gap:2, background:"#E9DFFE", borderRadius:8, padding:2 }}>
          {[["editor","エディタ"],["meta","設定"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding:"5px 14px", borderRadius:6, border:"none", fontSize:12, fontWeight:700, cursor:"pointer",
                background:tab===id?"#fff":"transparent", color:tab===id?"#4B38C8":"#C0BCCE",
                boxShadow:tab===id?"0 1px 3px rgba(0,0,0,0.1)":"none" }}>
              {label}
            </button>
          ))}
        </div>
        {form.recurringId && <span style={{ fontSize:10, color:"#7C3AED", background:"#F5F3FF", borderRadius:5, padding:"3px 8px", fontWeight:700 }}>↻ 定期配信</span>}
        <button className="btn-ghost" onClick={onClose} style={{ ...S.ghost, padding:"4px 8px", color:"#C0BCCE", border:"none" }}>✕</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>
        {tab === "editor" ? (
          <>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="配信タイトルを入力..."
              style={{ width:"100%", border:"none", fontSize:17, fontWeight:800, color:"#1A1040", outline:"none", marginBottom:12, background:"transparent", fontFamily:"inherit" }} />
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <StatusPill status={form.status} onChange={v => set("status", v)} />
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                style={{ border:"1px solid #D8D0F8", borderRadius:6, padding:"3px 8px", fontSize:11, color:"#1A1040", outline:"none", background:"#FAFCFF", fontFamily:"inherit" }} />
              <input type="time" value={form.time} onChange={e => set("time", e.target.value)}
                style={{ border:"1px solid #D8D0F8", borderRadius:6, padding:"3px 8px", fontSize:11, color:"#1A1040", outline:"none", background:"#FAFCFF", fontFamily:"inherit", width:78 }} />
            </div>

            {/* Toolbar */}
            <div style={{ display:"flex", gap:2, padding:"5px 8px", background:"#EDE6FF", borderRadius:"8px 8px 0 0", border:"1px solid #D8D0F8", borderBottom:"none" }}>
              {[["B","**","**"],["I","_","_"],["—","—",""],["#"," # ",""]].map(([l,b,a]) => (
                <button key={l} className="toolbar-btn" onClick={() => insertFormat(b,a)}
                  style={{ padding:"4px 9px", border:"none", borderRadius:5, background:"transparent", fontSize:12, fontWeight:700, cursor:"pointer", color:"#C0BCCE" }}>
                  {l}
                </button>
              ))}
              <div style={{ flex:1 }} />
              <button className="toolbar-btn" onClick={() => { setTplOpen(v => !v); setTplSearch(""); setTimeout(() => tplSearchRef.current && tplSearchRef.current.focus(), 60); }}
                style={{ padding:"4px 10px", border:"1px solid #D8D0F8", borderRadius:5, background:tplOpen?"#EDE6FF":"#fff", fontSize:11, fontWeight:700, cursor:"pointer", color:tplOpen?"#6D4EE8":"#7C74A8" }}>
                テンプレ挿入 {tplOpen ? "▲" : "▼"}
              </button>
            </div>
            {tplOpen && (
              <div style={{ border:"1px solid #D8D0F8", borderTop:"none", background:"#fff", borderRadius:"0 0 8px 8px" }}>
                <div style={{ padding:"7px 10px", borderBottom:"1px solid #F0EBFF", display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:13, color:"#C0BCCE" }}>⌕</span>
                  <input ref={tplSearchRef} value={tplSearch} onChange={e => setTplSearch(e.target.value)}
                    placeholder="テンプレートを検索..."
                    style={{ flex:1, border:"none", outline:"none", fontSize:12, color:"#1A1040", fontFamily:"inherit", background:"transparent" }} />
                  {tplSearch && <button onClick={() => setTplSearch("")} style={{ border:"none", background:"none", color:"#C0BCCE", cursor:"pointer", fontSize:11 }}>✕</button>}
                </div>
                <div style={{ maxHeight:180, overflowY:"auto" }}>
                  {filteredTpls.length === 0
                    ? <div style={{ padding:"12px", fontSize:12, color:"#C0BCCE", textAlign:"center" }}>見つかりません</div>
                    : filteredTpls.map(t => {
                        const hl = highlightTitle(t.title, tplSearch);
                        return (
                          <div key={t.id} className="post-row" onClick={() => { set("body", t.body); setTplOpen(false); setTplSearch(""); }}
                            style={{ padding:"9px 12px", cursor:"pointer", borderBottom:"1px solid #F8F5FF", display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:"#4B38C8" }}>
                                {Array.isArray(hl)
                                  ? <>{hl[0]}<mark style={{ background:"#FEF08A", borderRadius:2 }}>{hl[1]}</mark>{hl[2]}</>
                                  : hl}
                              </div>
                              <div style={{ fontSize:10, color:"#C0BCCE", marginTop:1 }}>📂 {t.folder}</div>
                            </div>
                            <span style={{ fontSize:10, color:"#A89CC8", background:"#F0EBFF", borderRadius:4, padding:"2px 7px", fontWeight:600, flexShrink:0 }}>挿入</span>
                          </div>
                        );
                      })
                  }
                </div>
              </div>
            )}
            <textarea ref={textareaRef} value={form.body} onChange={e => set("body", e.target.value)}
              placeholder={"配信の内容、説明文、スクリプトを書く...\n\n**太字** _斜体_ # 見出し"}
              style={{ ...S.input, minHeight:220, resize:"vertical", borderRadius:tplOpen?"0 0 8px 8px":"0 0 8px 8px", borderTop:"none", lineHeight:1.8, marginBottom:12 }} />
            <div>
              <label style={S.label}>📝 メモ（内部用）</label>
              <input value={form.note} onChange={e => set("note", e.target.value)} placeholder="備考・メモ" style={{ ...S.input, fontSize:12 }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom:16 }}>
              <label style={S.label}>ステータス</label>
              <StatusPill status={form.status} onChange={v => set("status", v)} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div><label style={S.label}>配信日</label><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={S.input} /></div>
              <div><label style={S.label}>時刻</label><input type="time" value={form.time} onChange={e => set("time", e.target.value)} style={S.input} /></div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={S.label}>所要時間（分）</label>
              <input type="number" min={5} value={form.duration} onChange={e => set("duration", +e.target.value)} style={{ ...S.input, width:90 }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={S.label}>配信先プラットフォーム</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:4 }}>
                {PLATFORMS.map(pl => {
                  const on = form.platforms.includes(pl.id);
                  return (
                    <div key={pl.id} onClick={() => set("platforms", on?form.platforms.filter(x=>x!==pl.id):[...form.platforms,pl.id])}
                      style={{ padding:"5px 11px", borderRadius:6, border:`1.5px solid ${on?pl.color:"#C9BCEE"}`, background:on?`${pl.color}15`:"#fff", color:on?pl.color:"#C0BCCE", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.12s" }}>
                      {pl.icon} {pl.name}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={S.label}>タグ（カンマ区切り）</label>
              <input value={form.tags.join(", ")} onChange={e => set("tags", e.target.value.split(",").map(t=>t.trim()).filter(Boolean))} style={S.input} placeholder="動画, 告知, コラボ" />
            </div>
            <div style={{ marginBottom:8 }}>
              <label style={S.label}>配信管理対象とリンク</label>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {TARGETS.map(tg => {
                  const entry = (form.postTargets||[]).find(x => x.targetId === tg.id);
                  const isOn = !!entry;
                  return (
                    <div key={tg.id} style={{ borderRadius:8, border:`1.5px solid ${isOn ? tg.color : "#D4C8F4"}`, background:isOn ? `${tg.color}08` : "#FAFCFF" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", cursor:"pointer" }}
                        onClick={() => {
                          const cur = form.postTargets||[];
                          set("postTargets", isOn ? cur.filter(x=>x.targetId!==tg.id) : [...cur,{targetId:tg.id,url:""}]);
                        }}>
                        <span style={{ fontSize:13, color:tg.color }}>{tg.icon}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:isOn?tg.color:"#6B5EA8", flex:1 }}>{tg.name}</span>
                        <div style={{ width:32,height:18,borderRadius:9,background:isOn?tg.color:"#D4C8F4",display:"flex",alignItems:"center",padding:"0 2px",flexShrink:0 }}>
                          <div style={{ width:14,height:14,borderRadius:"50%",background:"#fff",marginLeft:isOn?"auto":0,transition:"margin 0.15s" }} />
                        </div>
                      </div>
                      {isOn && (
                        <div style={{ padding:"0 10px 8px" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:6,background:"#fff",borderRadius:6,border:`1px solid ${tg.color}40`,padding:"5px 8px" }}>
                            <span style={{ fontSize:11, color:tg.color }}>🔗</span>
                            <input value={entry.url}
                              onChange={e => set("postTargets", (form.postTargets||[]).map(x=>x.targetId===tg.id?{...x,url:e.target.value}:x))}
                              placeholder={`${tg.name} の投稿URL（任意）`}
                              onClick={ev => ev.stopPropagation()}
                              style={{ flex:1,border:"none",outline:"none",fontSize:11,color:"#1A1040",fontFamily:"inherit",background:"transparent" }} />
                            {entry.url && <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:10,color:tg.color,fontWeight:700,textDecoration:"none" }}>開く↗</a>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ padding:"12px 18px", borderTop:"1px solid #EDE8FF", display:"flex", gap:8, flexShrink:0 }}>
        <button onClick={() => onSave(form)} style={{ ...S.primary, flex:1, justifyContent:"center" }}>保存</button>
        <button className="btn-ghost" onClick={() => { if(window.confirm("削除しますか？")) onDelete(form.id); }}
          style={{ ...S.ghost, color:"#EF4444", borderColor:"#FECACA", padding:"9px 14px" }}>削除</button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEMPLATE VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TemplateView({ templates, setTemplates, showToast }) {
  const [folder, setFolder] = useState("all");
  const [editing, setEditing] = useState(null);
  const [notionOpen, setNotionOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const folders = ["all", ...new Set(templates.map(t => t.folder))];

  const shown = useMemo(() => {
    let list = folder === "all" ? templates : templates.filter(t => t.folder === folder);
    if (searchQ.trim()) {
      const lq = searchQ.toLowerCase();
      list = list.filter(t => [t.title, t.body, t.folder, ...t.tags].join(" ").toLowerCase().includes(lq));
    }
    return list;
  }, [templates, folder, searchQ]);

  const saveTpl = async (t: any) => {
    try {
      const isNew = !t.id || typeof t.id === "number" && t.id > 1e12;
      const method = isNew ? "POST" : "PUT";
      const url    = isNew ? "/api/templates" : `/api/templates/${t.id}`;
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setTemplates(ts => isNew ? [...ts, saved] : ts.map(x => x.id === t.id ? saved : x));
      setEditing(null); showToast("テンプレートを保存しました");
    } catch (e) { showToast("保存に失敗しました"); console.error(e); }
  };
  const deleteTpl = async (id: any) => {
    try {
      if (id && typeof id === "number" && id < 1e12) {
        const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
      }
      setTemplates(ts => ts.filter(x => x.id !== id));
      showToast("テンプレートを削除しました");
    } catch (e) { showToast("削除に失敗しました"); console.error(e); }
  };

  const importFromNotion = async (item: any) => {
    try {
      const res = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setTemplates(ts => [...ts, saved]);
      showToast(`「${saved.title}」を取り込みました`);
    } catch (e) { showToast("取り込みに失敗しました"); console.error(e); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ padding:"14px 24px 12px", background:"#F8F5FF", borderBottom:"1px solid #E8E2FF", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#4B38C8" }}>テンプレート</h2>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setNotionOpen(true)}
              style={{ ...S.ghost, gap:7, fontSize:12, fontWeight:700, borderColor:"#C9BCEE", color:"#C0BCCE" }}>
              <span style={{ fontSize:15 }}>𝒩</span> Notionから取り込む
            </button>
            <button onClick={() => setEditing({ id:Date.now(), title:"", folder:"", tags:[], body:"" })} style={S.primary}>+ 新規テンプレート</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#7A9AB5" }}>⌕</span>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="テンプレートを検索..." style={{ ...S.input, paddingLeft:28, width:220, fontSize:12 }} />
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {folders.map(f => (
              <button key={f} onClick={() => setFolder(f)}
                style={{ padding:"5px 13px", borderRadius:7, border:"1px solid", fontSize:11, fontWeight:700, cursor:"pointer",
                  background:folder===f?"#4B38C8":"#fff", color:folder===f?"#fff":"#C0BCCE", borderColor:folder===f?"#4B38C8":"#C9BCEE" }}>
                {f==="all"?"すべて":`📂 ${f}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:12 }}>
          {shown.map(t => (
            <div key={t.id} className="tpl-card" onClick={() => setEditing(t)}
              style={{ background:"#fff", border:"1px solid #EDE8FF", borderRadius:12, padding:18, cursor:"pointer", transition:"border-color 0.12s" }}>
              <div style={{ fontSize:22, marginBottom:10 }}>📄</div>
              <div style={{ fontWeight:700, fontSize:13, color:"#4B38C8", marginBottom:5 }}>{t.title}</div>
              <div style={{ fontSize:11, color:"#C0BCCE", marginBottom:8 }}>📂 {t.folder}</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
                {t.tags.map(tag => <span key={tag} style={{ background:"#E9DFFE", color:"#C0BCCE", borderRadius:4, padding:"2px 7px", fontSize:10, fontWeight:600 }}>#{tag}</span>)}
              </div>
              <div style={{ fontSize:11, color:"#7A9AB5", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{t.body}</div>
            </div>
          ))}
          <div onClick={() => setEditing({ id:Date.now(), title:"", folder:"", tags:[], body:"" })}
            style={{ border:"2px dashed #E8E2FF", borderRadius:12, padding:18, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#7A9AB5", fontSize:13, fontWeight:600, gap:8, minHeight:120 }}>
            <span style={{ fontSize:24 }}>+</span>
            <span>新規作成</span>
          </div>
        </div>
      </div>

      {editing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,20,35,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(3px)" }}
          onClick={() => setEditing(null)}>
          <div style={{ background:"#fff", borderRadius:16, padding:28, width:480, maxHeight:"80vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#4B38C8" }}>{editing.title || "新規テンプレート"}</h3>
              <button onClick={() => setEditing(null)} style={{ ...S.ghost, padding:"4px 8px", border:"none", color:"#C0BCCE" }}>✕</button>
            </div>
            {[["title","テンプレート名","例：週刊まとめテンプレート"],["folder","フォルダ","YouTube / SNS / ..."]].map(([k,l,p]) => (
              <div key={k} style={{ marginBottom:12 }}>
                <label style={S.label}>{l}</label>
                <input value={editing[k]} onChange={e => setEditing({...editing,[k]:e.target.value})} placeholder={p} style={S.input} />
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>タグ（カンマ区切り）</label>
              <input value={editing.tags.join(", ")} onChange={e => setEditing({...editing,tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean)})} style={S.input} placeholder="動画, まとめ" />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>テンプレート内容</label>
              <textarea value={editing.body} onChange={e => setEditing({...editing,body:e.target.value})} style={{ ...S.input, minHeight:160, resize:"vertical", lineHeight:1.8 }} />
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"space-between" }}>
              <button onClick={() => { if(window.confirm("削除しますか？")) { deleteTpl(editing.id); setEditing(null); } }}
                style={{ ...S.ghost, color:"#EF4444", borderColor:"#FECACA" }}>削除</button>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-ghost" onClick={() => setEditing(null)} style={S.ghost}>キャンセル</button>
                <button onClick={() => saveTpl(editing)} style={S.primary}>保存する</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notionOpen && <NotionImportPanel onImport={importFromNotion} onClose={() => setNotionOpen(false)} />}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUMMARY EMAIL PREVIEW MODAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SummaryEmailModal({ posts, onClose }) {
  const _today = new Date();
  const dateStr = `${_today.getFullYear()}年${_today.getMonth()+1}月${_today.getDate()}日（${["日","月","火","水","木","金","土"][_today.getDay()]}）`;
  const sendTime = "08:00";

  const todayPosts   = posts.filter(p => p.date === todayStr());
  const tomorrowStr  = addDays(todayStr(), 1);
  const tomorrowPosts= posts.filter(p => p.date === tomorrowStr);
  const weekPosts    = posts.filter(p => p.date > todayStr() && p.date <= addDays(todayStr(), 6));
  const alertPosts   = posts.filter(p => p.date < todayStr() && p.status !== "live");
  const statusCounts = {};
  STATUSES.forEach(s => { statusCounts[s.id] = posts.filter(p => p.status === s.id).length; });

  const Section = ({ title, children, bg="#EDE6FF" }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:800, color:"#7A9AB5", letterSpacing:"0.1em", marginBottom:8 }}>{title}</div>
      <div style={{ background:bg, borderRadius:10, overflow:"hidden" }}>{children}</div>
    </div>
  );

  const PostRow = ({ post }) => {
    const s = STATUSES.find(x => x.id === post.status);
    const pl = PLATFORMS.find(x => post.platforms[0] === x.id);
    return (
      <div style={{ padding:"10px 16px", borderBottom:"1px solid #EDE8FF", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:3, height:28, borderRadius:2, background:s?.color, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#4B38C8" }}>{post.title}</div>
          <div style={{ fontSize:11, color:"#7A9AB5", marginTop:2 }}>{post.time} {pl ? `· ${pl.name}` : ""}</div>
        </div>
        <span style={{ fontSize:10, fontWeight:800, color:s?.color, background:`${s?.color}15`, borderRadius:5, padding:"2px 8px" }}>{s?.label}</span>
      </div>
    );
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,20,35,0.7)", zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div style={{ width:560, maxHeight:"88vh", display:"flex", flexDirection:"column", background:"#fff", borderRadius:16, boxShadow:"0 24px 60px rgba(0,0,0,0.3)", overflow:"hidden", animation:"searchIn 0.18s ease" }}
        onClick={e => e.stopPropagation()}>

        {/* Email chrome */}
        <div style={{ background:"#DDD6FF", padding:"16px 24px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#EF4444" }} />
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#D97706" }} />
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#059669" }} />
            </div>
            <span style={{ fontSize:11, color:"#C0BCCE", fontWeight:600 }}>メールプレビュー</span>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#C0BCCE", cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        </div>

        {/* Email meta */}
        <div style={{ padding:"16px 24px 0", borderBottom:"1px solid #EDE8FF", flexShrink:0 }}>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:"#7A9AB5", fontWeight:700, letterSpacing:"0.08em", marginBottom:2 }}>FROM</div>
            <div style={{ fontSize:13, color:"#4B38C8" }}>{"DelivCast <noreply@delivcast.app>"}</div>
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:"#7A9AB5", fontWeight:700, letterSpacing:"0.08em", marginBottom:2 }}>件名</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#4B38C8" }}>📅 [{dateStr}] 配信サマリー — {todayPosts.length}件のスケジュール</div>
          </div>
          <div style={{ marginBottom:12, display:"flex", gap:16, fontSize:11, color:"#7A9AB5" }}>
            <span>送信時刻: {sendTime}</span>
            <span>自動送信</span>
          </div>
        </div>

        {/* Email body */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          {/* Hero */}
          <div style={{ background:"linear-gradient(135deg, #6D4EE8, #9B6FF0)", borderRadius:12, padding:"20px 24px", marginBottom:20, color:"#fff" }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:4, letterSpacing:"0.08em" }}>DelivCast 配信サマリー</div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.02em" }}>{dateStr}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:4 }}>おはようございます。本日の配信スケジュールです。</div>
            {/* Status bar */}
            <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap" }}>
              {STATUSES.map(s => (
                <div key={s.id} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{statusCounts[s.id]}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontWeight:700 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert */}
          {alertPosts.length > 0 && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", gap:10 }}>
              <span style={{ fontSize:16 }}>⚠️</span>
              <div>
                <div style={{ fontSize:12, fontWeight:800, color:"#EF4444", marginBottom:4 }}>期限切れの配信があります</div>
                {alertPosts.map(p => <div key={p.id} style={{ fontSize:11, color:"#DC2626" }}>· {p.title}（{p.date.slice(5).replace("-","/")}）</div>)}
              </div>
            </div>
          )}

          {/* Today */}
          <Section title="TODAY — 本日の配信">
            {todayPosts.length === 0
              ? <div style={{ padding:"16px", fontSize:13, color:"#7A9AB5" }}>本日の配信はありません</div>
              : todayPosts.map(p => <PostRow key={p.id} post={p} />)}
          </Section>

          {/* Tomorrow */}
          <Section title="TOMORROW — 明日の配信">
            {tomorrowPosts.length === 0
              ? <div style={{ padding:"16px", fontSize:13, color:"#7A9AB5" }}>明日の配信はありません</div>
              : tomorrowPosts.map(p => <PostRow key={p.id} post={p} />)}
          </Section>

          {/* This week */}
          <Section title="THIS WEEK — 今週の残り配信">
            {weekPosts.length === 0
              ? <div style={{ padding:"16px", fontSize:13, color:"#7A9AB5" }}>今週の配信はありません</div>
              : weekPosts.map(p => <PostRow key={p.id} post={p} />)}
          </Section>

          {/* Footer */}
          <div style={{ borderTop:"1px solid #EDE8FF", paddingTop:16, fontSize:11, color:"#7A9AB5", textAlign:"center", lineHeight:1.8 }}>
            このメールはDelivCastから毎朝{sendTime}に自動送信されます<br/>
            設定 → 通知設定 から変更できます
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETTINGS VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SettingsView({ recurringRules, setRecurringRules, notifSettings, setNotifSettings, showToast, allPosts, templates }) {
  const [editRule, setEditRule] = useState(null);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const FREQ_LABELS = { daily:"毎日", weekly:"毎週", biweekly:"隔週", monthly:"毎月" };

  const saveRule = async (r) => {
    try {
      const isNew = !recurringRules.some(x => x.id === r.id);
      const method = isNew ? "POST" : "PUT";
      const url    = isNew ? "/api/recurring" : `/api/recurring/${r.id}`;
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setRecurringRules(rs => isNew ? [...rs, saved] : rs.map(x => x.id === r.id ? saved : x));
      setEditRule(null); showToast("定期スケジュールを保存しました");
    } catch (e) { showToast("保存に失敗しました"); console.error(e); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ padding:"14px 24px 12px", background:"#F8F5FF", borderBottom:"1px solid #E8E2FF", flexShrink:0 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#4B38C8" }}>設定</h2>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:800 }}>

          {/* Notifications */}
          <div style={{ background:"#fff", borderRadius:14, padding:22, border:"1px solid #EDE8FF" }}>
            <h3 style={{ margin:"0 0 18px", fontSize:14, fontWeight:800, color:"#4B38C8" }}>📧 通知・リマインダー</h3>
            <label style={S.label}>通知メールアドレス</label>
            <input value={notifSettings.email} onChange={e => setNotifSettings({...notifSettings,email:e.target.value})} placeholder="you@example.com" style={{ ...S.input, marginBottom:14 }} />
            <label style={S.label}>毎朝のサマリーメール</label>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <Toggle on={notifSettings.daily} onChange={v => setNotifSettings({...notifSettings,daily:v})} />
              <span style={{ fontSize:13, color:"#C0BCCE", fontWeight:600 }}>{notifSettings.daily?"ON":"OFF"}</span>
            </div>
            {notifSettings.daily && (
              <><label style={S.label}>送信時刻</label>
              <input type="time" value={notifSettings.time} onChange={e => setNotifSettings({...notifSettings,time:e.target.value})} style={{ ...S.input, width:120, marginBottom:14 }} /></>
            )}
            <label style={S.label}>リマインダー（配信X日前）</label>
            <input type="number" min={1} max={14} value={notifSettings.reminderDays} onChange={e => setNotifSettings({...notifSettings,reminderDays:+e.target.value})} style={{ ...S.input, width:80, marginBottom:16 }} />
            <button onClick={() => setEmailPreviewOpen(true)}
              style={{ ...S.ghost, fontSize:12, fontWeight:700, gap:6, borderStyle:"dashed" }}>
              📧 サマリーメールのプレビュー
            </button>
          </div>

          {/* Recurring rules */}
          <div style={{ background:"#fff", borderRadius:14, padding:22, border:"1px solid #EDE8FF" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:"#4B38C8" }}>🔁 定期スケジュール</h3>
              <button style={{ ...S.primary, padding:"6px 12px", fontSize:11 }}
                onClick={() => setEditRule({ id:`r${Date.now()}`, title:"", titleTemplate:"", freq:"weekly", weekDay:1, time:"10:00", duration:60, platforms:[], tags:[], active:true, startDate:todayStr(), counter:1 })}>
                + 追加
              </button>
            </div>
            {recurringRules.map(r => (
              <div key={r.id} style={{ padding:"12px 0", borderBottom:"1px solid #F0EBFF", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ flex:1, cursor:"pointer" }} onClick={() => setEditRule(r)}>
                  <div style={{ fontWeight:700, color:"#4B38C8", fontSize:13 }}>{r.title}</div>
                  <div style={{ color:"#C0BCCE", fontSize:11, marginTop:2 }}>
                    {FREQ_LABELS[r.freq]}{r.freq==="weekly"?` 曜日${r.weekDay}`:""} {r.time} · {r.duration}分
                  </div>
                  <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
                    {r.platforms.map(pid => <PlatformChip key={pid} platformId={pid} size="xs" />)}
                  </div>
                </div>
                <Toggle on={r.active} onChange={async v => {
                  const updated = {...r, active: v};
                  try {
                    const res = await fetch(`/api/recurring/${r.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
                    if (!res.ok) throw new Error(await res.text());
                    setRecurringRules(rs => rs.map(rr => rr.id===r.id?{...rr,active:v}:rr));
                  } catch (e) { showToast("保存に失敗しました"); }
                }} />
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => showToast("設定を保存しました")} style={{ ...S.primary, marginTop:20 }}>設定を保存</button>
      </div>

      {editRule && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,20,35,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(3px)" }}
          onClick={() => setEditRule(null)}>
          <div style={{ background:"#fff", borderRadius:16, padding:28, width:460, maxHeight:"80vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:"#4B38C8" }}>定期スケジュール</h3>
              <button onClick={() => setEditRule(null)} style={{ ...S.ghost, padding:"4px 8px", border:"none", color:"#C0BCCE" }}>✕</button>
            </div>
            <label style={S.label}>表示名</label>
            <input value={editRule.title} onChange={e => setEditRule({...editRule,title:e.target.value})} style={{ ...S.input, marginBottom:12 }} placeholder="週刊まとめ動画" />
            <label style={S.label}>タイトルテンプレート（{"{{n}}"}でカウンター）</label>
            <input value={editRule.titleTemplate} onChange={e => setEditRule({...editRule,titleTemplate:e.target.value})} style={{ ...S.input, marginBottom:12 }} placeholder="週刊まとめ動画 #{{n}}" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <label style={S.label}>頻度</label>
                <select value={editRule.freq} onChange={e => setEditRule({...editRule,freq:e.target.value})} style={{ ...S.input }}>
                  <option value="daily">毎日</option>
                  <option value="weekly">毎週</option>
                  <option value="biweekly">隔週</option>
                  <option value="monthly">毎月</option>
                </select>
              </div>
              {editRule.freq==="weekly"&&<div>
                <label style={S.label}>曜日</label>
                <select value={editRule.weekDay} onChange={e => setEditRule({...editRule,weekDay:+e.target.value})} style={S.input}>
                  {DAYS_JP.map((d,i) => <option key={i} value={i}>{d}曜日</option>)}
                </select>
              </div>}
              {editRule.freq==="monthly"&&<div>
                <label style={S.label}>毎月何日</label>
                <select value={editRule.monthDay||1} onChange={e => setEditRule({...editRule,monthDay:+e.target.value})} style={S.input}>
                  {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}日</option>)}
                </select>
              </div>}
              <div>
                <label style={S.label}>時刻</label>
                <input type="time" value={editRule.time} onChange={e => setEditRule({...editRule,time:e.target.value})} style={S.input} />
              </div>
              <div>
                <label style={S.label}>所要時間（分）</label>
                <input type="number" value={editRule.duration} onChange={e => setEditRule({...editRule,duration:+e.target.value})} style={S.input} />
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>開始カウンター番号</label>
              <input type="number" min={1} value={editRule.counter} onChange={e => setEditRule({...editRule,counter:+e.target.value})} style={{ ...S.input, width:80 }} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>開始日</label>
              <input type="date" value={editRule.startDate} onChange={e => setEditRule({...editRule,startDate:e.target.value})} style={S.input} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>配信先</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {PLATFORMS.map(pl => {
                  const on = editRule.platforms.includes(pl.id);
                  return <div key={pl.id} onClick={() => setEditRule({...editRule,platforms:on?editRule.platforms.filter(x=>x!==pl.id):[...editRule.platforms,pl.id]})}
                    style={{ padding:"4px 10px", borderRadius:6, border:`1.5px solid ${on?pl.color:"#C9BCEE"}`, background:on?`${pl.color}15`:"#fff", color:on?pl.color:"#C0BCCE", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                    {pl.icon} {pl.name}
                  </div>;
                })}
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>デフォルトテンプレート</label>
              <select value={editRule.defaultTemplateId||""} onChange={e => setEditRule({...editRule,defaultTemplateId:e.target.value?+e.target.value:null})} style={S.input}>
                <option value="">なし（本文を空にする）</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.title} — {t.folder}</option>)}
              </select>
              <p style={{ margin:"4px 0 0",fontSize:11,color:"#A89CC8",lineHeight:1.5 }}>投稿を開いたとき自動で本文に挿入されます</p>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => setEditRule(null)} style={S.ghost}>キャンセル</button>
              <button onClick={() => saveRule(editRule)} style={S.primary}>保存する</button>
            </div>
          </div>
        </div>
      )}
      {emailPreviewOpen && <SummaryEmailModal posts={allPosts} onClose={() => setEmailPreviewOpen(false)} />}
    </div>
  );
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DestView({ showToast }) {
  const [dests, setDests] = useState(PLATFORMS.map(p => ({ ...p, active:p.id!=="ig", account:`@my_${p.id}` })));
  const [tgt, setTgt] = useState(TARGETS.map(t => ({ ...t, active:true, accountUrl:"", memo:"" })));
  const [tab, setTab] = useState("targets");
  const [saving, setSaving] = useState(false);

  const saveTargets = async () => {
    setSaving(true);
    try {
      for (const t of tgt) {
        await fetch(`/api/targets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: t.id, name: t.name, color: t.color, icon: t.icon, active: t.active, account_url: t.accountUrl, memo: t.memo })
        });
      }
      showToast("配信先を保存しました");
    } catch (e) { showToast("保存に失敗しました"); }
    setSaving(false);
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ padding:"14px 24px 0", background:"#F8F5FF", borderBottom:"1px solid #E8E2FF", flexShrink:0 }}>
        <h2 style={{ margin:"0 0 12px", fontSize:17, fontWeight:800, color:"#4B38C8" }}>配信先管理</h2>
        <div style={{ display:"flex" }}>
          {[["targets","配信管理対象"],["platforms","プラットフォーム"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding:"8px 18px", border:"none", borderBottom:`2.5px solid ${tab===id?"#6D4EE8":"transparent"}`, background:"transparent", fontSize:13, fontWeight:tab===id?800:500, color:tab===id?"#6D4EE8":"#6B5EA8", cursor:"pointer" }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        {tab === "targets" && (
          <div style={{ maxWidth:640, display:"flex", flexDirection:"column", gap:10 }}>
            {tgt.map((tg,i) => (
              <div key={tg.id} style={{ background:"#fff", border:`1.5px solid ${tg.active?tg.color+"50":"#D4C8F4"}`, borderRadius:12, padding:"14px 16px", opacity:tg.active?1:0.6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:tg.active?10:0 }}>
                  <div style={{ width:36,height:36,borderRadius:9,background:`${tg.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:tg.color,fontWeight:700 }}>{tg.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, color:"#1A1040", fontSize:14 }}>{tg.name}</div>
                    {tg.accountUrl && <a href={tg.accountUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:tg.color,textDecoration:"none" }}>{tg.accountUrl.slice(0,44)}{tg.accountUrl.length>44?"…":""} ↗</a>}
                  </div>
                  <div onClick={() => setTgt(ts => ts.map((x,j) => j===i?{...x,active:!x.active}:x))}
                    style={{ width:38,height:22,borderRadius:11,background:tg.active?tg.color:"#D4C8F4",display:"flex",alignItems:"center",padding:"0 3px",cursor:"pointer",transition:"background 0.2s",flexShrink:0 }}>
                    <div style={{ width:16,height:16,borderRadius:"50%",background:"#fff",marginLeft:tg.active?"auto":0,transition:"margin 0.2s" }} />
                  </div>
                </div>
                {tg.active && (
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7,background:"#F8F5FF",borderRadius:7,padding:"6px 10px",border:`1px solid ${tg.color}35` }}>
                      <span style={{ fontSize:11,color:tg.color }}>🔗</span>
                      <input value={tg.accountUrl} onChange={e => setTgt(ts => ts.map((x,j) => j===i?{...x,accountUrl:e.target.value}:x))}
                        placeholder={`${tg.name} のアカウントURL`}
                        style={{ flex:1,border:"none",outline:"none",fontSize:12,color:"#1A1040",fontFamily:"inherit",background:"transparent" }} />
                      {tg.accountUrl && <a href={tg.accountUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:10,color:tg.color,fontWeight:700,textDecoration:"none",background:`${tg.color}15`,padding:"3px 7px",borderRadius:4 }}>開く↗</a>}
                    </div>
                    <textarea value={tg.memo} onChange={e => setTgt(ts => ts.map((x,j) => j===i?{...x,memo:e.target.value}:x))}
                      placeholder="メモ（更新頻度・読者数など）" rows={2}
                      style={{ border:"1px solid #E0D8FF",borderRadius:7,padding:"6px 10px",fontSize:12,color:"#4B3F8A",fontFamily:"inherit",background:"#FAFCFF",resize:"none",outline:"none",lineHeight:1.6 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ padding:"16px 0" }}>
          <button onClick={saveTargets} disabled={saving} style={{ ...S.primary, opacity:saving?0.6:1 }}>
            {saving ? "保存中..." : "配信先を保存"}
          </button>
        </div>

        {tab === "platforms" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:12 }}>
            {dests.map(d => (
              <div key={d.id} style={{ background:"#fff",border:"1px solid #EDE8FF",borderRadius:12,padding:18,opacity:d.active?1:0.55 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                    <div style={{ width:38,height:38,borderRadius:10,background:`${d.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:d.color }}>{d.icon}</div>
                    <div>
                      <div style={{ fontWeight:700,color:"#4B38C8",fontSize:14 }}>{d.name}</div>
                      <div style={{ color:"#C0BCCE",fontSize:11,marginTop:2 }}>{d.account}</div>
                    </div>
                  </div>
                  <Toggle on={d.active} onChange={v => setDests(ds => ds.map(dd => dd.id===d.id?{...dd,active:v}:dd))} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SetupView({ posts, templates, recurringRules, showToast }) {
  const [sbUrl, setSbUrl] = useState("");
  const [sbKey, setSbKey] = useState("");
  const [notionToken, setNotionToken] = useState("");
  const [sbStatus, setSbStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState("supabase");

  const checkSupabase = async () => {
    if (!sbUrl || !sbKey) return;
    setChecking(true); setSbStatus(null);
    try {
      const r = await fetch(`${sbUrl}/rest/v1/`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }
      });
      setSbStatus(r.ok ? "ok" : "error");
    } catch (e) { setSbStatus("error"); }
    setChecking(false);
  };

  const exportData = () => {
    const data = { posts, templates, recurringRules, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "delivcast-export.json";
    a.click();
    showToast("データをエクスポートしました");
  };

  const sInput = { width:"100%", border:"1px solid #D8D0F8", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#1A1040", outline:"none", background:"#FAFCFF", fontFamily:"inherit", boxSizing:"border-box" };
  const sLabel = { fontSize:11, fontWeight:700, color:"#7C74A8", display:"block", marginBottom:4, letterSpacing:"0.04em" };
  const sCard = { background:"#fff", border:"1px solid #E0D8FF", borderRadius:12, padding:"18px 20px", marginBottom:16 };
  const sH = { fontSize:13, fontWeight:800, color:"#4B38C8", margin:"0 0 12px", letterSpacing:"-0.01em" };
  const sStep = { display:"flex", gap:10, marginBottom:10 };
  const sBall = { width:22, height:22, borderRadius:"50%", background:"#6D4EE8", color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 };
  const sText = { fontSize:13, color:"#1A1040", lineHeight:1.7 };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ padding:"14px 24px 0", background:"#F8F5FF", borderBottom:"1px solid #E8E2FF", flexShrink:0 }}>
        <h2 style={{ margin:"0 0 12px", fontSize:17, fontWeight:800, color:"#4B38C8" }}>データ連携</h2>
        <div style={{ display:"flex" }}>
          {[["supabase","Supabase"],["notion","Notion"],["export","データ管理"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding:"8px 18px", border:"none", borderBottom:`2.5px solid ${tab===id?"#6D4EE8":"transparent"}`, background:"transparent", fontSize:13, fontWeight:tab===id?800:500, color:tab===id?"#6D4EE8":"#6B5EA8", cursor:"pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"22px 28px" }}>
        <div style={{ maxWidth:600 }}>

          {tab === "supabase" && (
            <div>
              <div style={sCard}>
                <p style={sH}>接続設定</p>
                <div style={{ marginBottom:12 }}>
                  <span style={sLabel}>SUPABASE URL</span>
                  <input value={sbUrl} onChange={e => setSbUrl(e.target.value)} placeholder="https://xxxxxxxxxxxx.supabase.co" style={sInput} />
                </div>
                <div style={{ marginBottom:16 }}>
                  <span style={sLabel}>ANON KEY</span>
                  <input value={sbKey} onChange={e => setSbKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." type="password" style={sInput} />
                  <p style={{ margin:"5px 0 0", fontSize:11, color:"#A89CC8" }}>Supabase Dashboard → Settings → API から取得</p>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <button onClick={checkSupabase} disabled={checking||!sbUrl||!sbKey}
                    style={{ padding:"9px 18px", borderRadius:8, border:"none", background:(!sbUrl||!sbKey)?"#E9DFFE":"#6D4EE8", color:(!sbUrl||!sbKey)?"#B0A8D8":"#fff", fontSize:13, fontWeight:700, cursor:(!sbUrl||!sbKey)?"default":"pointer" }}>
                    {checking ? "確認中..." : "接続テスト"}
                  </button>
                  {sbStatus === "ok"    && <span style={{ fontSize:13, color:"#059669", fontWeight:700 }}>✓ 接続成功</span>}
                  {sbStatus === "error" && <span style={{ fontSize:13, color:"#EF4444", fontWeight:700 }}>✗ 接続失敗 — URLとキーを確認</span>}
                </div>
              </div>

              <div style={sCard}>
                <p style={sH}>.env.local の設定</p>
                <div style={{ background:"#1E1B4B", borderRadius:10, padding:"14px 16px", fontFamily:"monospace", fontSize:12, lineHeight:2 }}>
                  <div><span style={{ color:"#6EE7B7" }}>NEXT_PUBLIC_SUPABASE_URL</span><span style={{ color:"#94A3B8" }}>=</span><span style={{ color:"#FDE68A" }}>{sbUrl || "https://xxxx.supabase.co"}</span></div>
                  <div><span style={{ color:"#6EE7B7" }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</span><span style={{ color:"#94A3B8" }}>=</span><span style={{ color:"#FDE68A" }}>{sbKey ? sbKey.slice(0,20)+"..." : "eyJh..."}</span></div>
                  <div><span style={{ color:"#6EE7B7" }}>NOTION_TOKEN</span><span style={{ color:"#94A3B8" }}>=</span><span style={{ color:"#FDE68A" }}>secret_xxxx</span></div>
                </div>
              </div>

              <div style={sCard}>
                <p style={sH}>作成するテーブル</p>
                {[["posts","配信スケジュール本体"],["post_targets","投稿ごとの配信先+URL"],["templates","テンプレート"],["recurring_rules","定期繰り返しルール"],["targets","配信管理対象マスター"]].map(([t,d]) => (
                  <div key={t} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #F0EBFF", fontSize:13 }}>
                    <code style={{ background:"#EDE6FF", color:"#4B38C8", borderRadius:4, padding:"1px 7px", fontSize:12 }}>{t}</code>
                    <span style={{ color:"#7C74A8", fontSize:12 }}>{d}</span>
                  </div>
                ))}
                <p style={{ margin:"10px 0 0", fontSize:11, color:"#A89CC8" }}>完全なDDLは「実装ロードマップ」ドキュメントを参照</p>
              </div>
            </div>
          )}

          {tab === "notion" && (
            <div>
              <div style={sCard}>
                <p style={sH}>インテグレーショントークンの取得</p>
                <div style={{ marginBottom:16 }}>
                  <span style={sLabel}>NOTION TOKEN（確認用）</span>
                  <input value={notionToken} onChange={e => setNotionToken(e.target.value)} placeholder="secret_xxxxxxxxxxxxxxxxxxxx" type="password" style={sInput} />
                </div>
                {[
                  ["1","Notion → 設定 → インテグレーション → 新しいインテグレーションを作成"],
                  ["2","タイプ:「内部」/ ワークスペースを選択 → 保存"],
                  ["3","secret_ から始まるトークンをコピーして上の欄に保存"],
                  ["4","取り込みたいページを開き、右上「…」→ 接続を追加 でインテグレーションを選択"],
                ].map(([n, txt]) => (
                  <div key={n} style={sStep}>
                    <div style={sBall}>{n}</div>
                    <div style={sText}>{txt}</div>
                  </div>
                ))}
                <p style={{ margin:"8px 0 0", fontSize:11, color:"#A89CC8", lineHeight:1.7 }}>
                  本番環境では .env.local の NOTION_TOKEN に設定し、/api/notion ルート経由で呼び出します。
                </p>
              </div>
              <div style={sCard}>
                <p style={sH}>Notionからの取り込み手順</p>
                {[
                  ["1","設定画面 → 「Notionから取り込む」パネルを開く"],
                  ["2","ページ名で検索 → 「本文を確認」で内容をプレビュー"],
                  ["3","「取り込む」でテンプレートとして保存"],
                ].map(([n, txt]) => (
                  <div key={n} style={sStep}>
                    <div style={sBall}>{n}</div>
                    <div style={sText}>{txt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "export" && (
            <div>
              <div style={sCard}>
                <p style={sH}>現在のデータをエクスポート</p>
                <p style={{ fontSize:13, color:"#7C74A8", margin:"0 0 14px", lineHeight:1.7 }}>
                  投稿 <strong style={{ color:"#4B38C8" }}>{posts.length}件</strong>、テンプレート <strong style={{ color:"#4B38C8" }}>{templates.length}件</strong>、定期ルール <strong style={{ color:"#4B38C8" }}>{recurringRules.length}件</strong> を JSON でダウンロードします。Supabase 移行時のシードデータとして使えます。
                </p>
                <button onClick={exportData} style={{ padding:"10px 20px", borderRadius:8, border:"none", background:"#6D4EE8", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  ⬇ delivcast-export.json をダウンロード
                </button>
              </div>
              <div style={sCard}>
                <p style={sH}>Supabase へのインポート手順</p>
                {[
                  ["1","上記ボタンで delivcast-export.json を取得"],
                  ["2","DDLを実行してテーブルを作成済みであることを確認"],
                  ["3","ダッシュボードの Table Editor → Insert rows でインポート、またはコードで一括挿入"],
                ].map(([n, txt]) => (
                  <div key={n} style={sStep}>
                    <div style={sBall}>{n}</div>
                    <div style={sText}>{txt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELP VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HELP_SECTIONS = [
  { id:"overview",  label:"画面構成" },
  { id:"calendar",  label:"カレンダー" },
  { id:"editor",    label:"投稿エディタ" },
  { id:"template",  label:"テンプレート" },
  { id:"recurring", label:"定期配信" },
  { id:"dest",      label:"配信先管理" },
  { id:"shortcuts", label:"ショートカット" },
  { id:"workflow",  label:"配信ワークフロー" },
];

function HelpView() {
  const [section, setSection] = useState("overview");

  const sH2  = { fontSize:16, fontWeight:800, color:"#4B38C8", margin:"0 0 16px", borderBottom:"2px solid #E9DFFE", paddingBottom:8 };
  const sH3  = { fontSize:13, fontWeight:800, color:"#1A1040", margin:"18px 0 8px" };
  const sP   = { fontSize:13, color:"#4B3F8A", lineHeight:1.8, margin:"0 0 10px" };
  const sRow = { display:"grid", gridTemplateColumns:"190px 1fr", gap:12, padding:"8px 0", borderBottom:"1px solid #F0EBFF", alignItems:"start" };
  const sKey = { fontSize:12, color:"#7C74A8", fontWeight:600 };
  const sVal = { fontSize:12, color:"#1A1040", lineHeight:1.6 };
  const sKbd = { background:"#EDE6FF", color:"#4B38C8", borderRadius:5, padding:"2px 8px", fontSize:11, fontWeight:700, border:"1px solid #C9BCEE", fontFamily:"monospace" };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ width:156, background:"#F8F5FF", borderRight:"1px solid #E8E2FF", flexShrink:0, padding:"14px 0", overflowY:"auto" }}>
        {HELP_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            style={{ width:"100%", padding:"9px 14px", border:"none", borderLeft:`3px solid ${section===s.id?"#6D4EE8":"transparent"}`, background:section===s.id?"#EDE6FF":"transparent", textAlign:"left", fontSize:12, fontWeight:section===s.id?800:500, color:section===s.id?"#4B38C8":"#6B5EA8", cursor:"pointer" }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"24px 32px" }}>
        <div style={{ maxWidth:560 }}>

          {section === "overview" && (
            <div>
              <p style={sH2}>画面構成</p>
              <p style={sP}>DelivCastは左サイドバーで画面を切り替えます。</p>
              {[
                ["◫ 週間カレンダー","1週間のスケジュールをタイムライン表示。空きスロットをクリックで新規作成。"],
                ["≡ 配信リスト","全投稿を一覧表示。ステータスでフィルタリング可能。"],
                ["⊞ テンプレート","繰り返し使う文章を保存・管理。エディタから検索して挿入できる。"],
                ["◉ 配信先管理","しあらぼ・ライカレ等の配信管理対象とアカウントURLを管理。"],
                ["⚙ 設定","定期スケジュール・通知設定・Notion取り込み。"],
                ["⬡ データ連携","Supabase接続設定・Notionトークン設定・データエクスポート。"],
                ["? マニュアル","このページ。"],
              ].map(([k,v]) => (
                <div key={k} style={sRow}><span style={sKey}>{k}</span><span style={sVal}>{v}</span></div>
              ))}
            </div>
          )}

          {section === "calendar" && (
            <div>
              <p style={sH2}>週間カレンダー</p>
              <p style={sH3}>基本操作</p>
              {[
                ["空きスロットをクリック","その日時で新規投稿を作成"],
                ["投稿ブロックをクリック","右パネルでエディタが開く"],
                ["◀ ▶ ボタン","前後の週に移動"],
                ["「今週」ボタン","今週に戻る"],
              ].map(([k,v]) => (
                <div key={k} style={sRow}><span style={sKey}>{k}</span><span style={sVal}>{v}</span></div>
              ))}
              <p style={sH3}>投稿ブロックの見方</p>
              <p style={sP}>ブロック内にはステータスバッジ・プラットフォームチップ・配信管理対象チップが表示されます。ブロックの高さは所要時間に比例します。</p>
            </div>
          )}

          {section === "editor" && (
            <div>
              <p style={sH2}>投稿エディタ</p>
              <p style={sH3}>エディタタブ</p>
              <p style={sP}>タイトル・ステータス・日時・本文・メモを編集します。ツールバーから太字 / 斜体 / 区切り / 見出しを挿入できます。</p>
              <p style={sH3}>テンプレ挿入（検索付き）</p>
              <p style={sP}>「テンプレ挿入▼」ボタンを押すと検索バーが開きます。タイトル・フォルダ・タグ・本文を横断検索。クリックで本文に挿入されます。</p>
              <p style={sH3}>設定タブ</p>
              {[
                ["ステータス","準備中 / 作成中 / 作成済み / 予約済み / 公開済み"],
                ["配信先プラットフォーム","YouTube・Twitter等。複数選択可。"],
                ["配信管理対象とリンク","しあらぼ等をONにすると投稿固有のURLを設定できる。"],
              ].map(([k,v]) => (
                <div key={k} style={sRow}><span style={sKey}>{k}</span><span style={sVal}>{v}</span></div>
              ))}
              <p style={sH3}>ステータスの流れ</p>
              <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", margin:"6px 0" }}>
                {[["#7A9AB5","準備中"],["#D97706","作成中"],["#2563EB","作成済み"],["#7C3AED","予約済み"],["#059669","公開済み"]].map(([c,l],i,a) => (
                  <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:11, color:c, background:`${c}18`, borderRadius:4, padding:"2px 8px", fontWeight:700, borderLeft:`2px solid ${c}` }}>{l}</span>
                    {i < a.length-1 && <span style={{ color:"#C0BCCE", fontSize:11 }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {section === "template" && (
            <div>
              <p style={sH2}>テンプレート</p>
              <p style={sP}>よく使う文章のひな型を保存します。フォルダとタグで整理できます。</p>
              <p style={sH3}>作成方法</p>
              {[
                ["「+ テンプレートを追加」","空のテンプレートを作成"],
                ["エディタ → テンプレ挿入","既存テンプレートを本文に貼り付け"],
              ].map(([k,v]) => (
                <div key={k} style={sRow}><span style={sKey}>{k}</span><span style={sVal}>{v}</span></div>
              ))}
              <p style={sH3}>定期配信との連携</p>
              <p style={sP}>設定画面の定期ルールに「デフォルトテンプレート」を設定すると、定期配信の投稿を開いた際に自動で本文が挿入されます。</p>
            </div>
          )}

          {section === "recurring" && (
            <div>
              <p style={sH2}>定期配信スケジュール</p>
              <p style={sP}>設定 → 定期スケジュールから作成します。</p>
              {[
                ["頻度","毎日 / 毎週 / 隔週 / 毎月"],
                ["タイトルテンプレート","{{n}} でカウンター自動連番（例：週刊まとめ #42）"],
                ["デフォルトテンプレート","投稿を開いたとき自動で本文挿入"],
                ["生成範囲","現在から5週間先まで自動プレビュー"],
              ].map(([k,v]) => (
                <div key={k} style={sRow}><span style={sKey}>{k}</span><span style={sVal}>{v}</span></div>
              ))}
              <p style={sH3}>確定の仕組み</p>
              <p style={sP}>生成された定期配信は点線枠で表示されます。編集して保存すると確定済みになり、本文・メモを持つ正式な投稿になります。</p>
            </div>
          )}

          {section === "dest" && (
            <div>
              <p style={sH2}>配信先管理</p>
              <p style={sH3}>配信管理対象タブ</p>
              <p style={sP}>しあらぼ・ライカレ・ゆるラボ・note・X・LINE・メルマガ・その他のチャンネルURLとメモを管理します。</p>
              <p style={sH3}>投稿ごとのリンク設定</p>
              <p style={sP}>エディタ → 設定タブ → 配信管理対象とリンク から、その投稿固有のURL（記事URL・動画URLなど）を設定できます。リストやカレンダーにも表示されます。</p>
              <p style={sH3}>プラットフォームタブ</p>
              <p style={sP}>YouTube・Twitter/X・TikTok等のSNSアカウントのON/OFFを管理します。</p>
            </div>
          )}

          {section === "shortcuts" && (
            <div>
              <p style={sH2}>キーボードショートカット</p>
              {[
                [["⌘K"],"グローバル検索を開く / 閉じる"],
                [["Esc"],"検索 / モーダルを閉じる"],
                [["↑","↓"],"（検索モーダル内）前後の結果へ移動"],
                [["↵"],"（検索モーダル内）選択して開く"],
              ].map(([keys, desc]) => (
                <div key={desc} style={sRow}>
                  <span style={{ display:"flex", gap:4 }}>
                    {keys.map(k => <kbd key={k} style={sKbd}>{k}</kbd>)}
                  </span>
                  <span style={sVal}>{desc}</span>
                </div>
              ))}
            </div>
          )}

          {section === "workflow" && (
            <div>
              <p style={sH2}>推奨ワークフロー</p>
              <p style={sH3}>週次ルーティン</p>
              {[
                ["月曜朝","週間カレンダーで今週の配信計画を確認・調整"],
                ["配信前日","ステータスを「作成中」→「作成済み」に更新、本文を仕上げる"],
                ["配信当日","予約投稿後に「予約済み」→ 公開後に「公開済み」に変更"],
                ["週末","設定 → サマリーメールプレビューで週のまとめを確認"],
              ].map(([k,v]) => (
                <div key={k} style={sRow}><span style={sKey}>{k}</span><span style={sVal}>{v}</span></div>
              ))}
              <p style={sH3}>Notionとの連携フロー</p>
              {[
                ["1. Notionで下書き","記事・台本をNotionで作成"],
                ["2. 設定 → Notion取り込み","ページ検索 → 「取り込む」でテンプレート化"],
                ["3. エディタで挿入","テンプレ挿入から対象のページを選んで本文に貼り付け"],
              ].map(([k,v]) => (
                <div key={k} style={sRow}><span style={sKey}>{k}</span><span style={sVal}>{v}</span></div>
              ))}
              <p style={sH3}>本番移行後のフロー</p>
              {[
                ["データ連携 → データ管理","現在のデータをエクスポート"],
                ["Supabase移行","DDL実行 → データインポート → Vercelデプロイ"],
                ["以降","Next.js + Supabaseで完全にデータが永続化される"],
              ].map(([k,v]) => (
                <div key={k} style={sRow}><span style={sKey}>{k}</span><span style={sVal}>{v}</span></div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROOT APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface Props {
  initialPosts: Post[]
  initialTemplates: Template[]
  initialRecurring: RecurringRule[]
}

export default function DelivCast({ initialPosts, initialTemplates, initialRecurring }: Props) {
  const [view, setView] = useState("calendar");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(initialRecurring);
  const [selectedPost, setSelectedPost] = useState(null);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState({ email:"", daily:true, time:"08:00", reminderDays:2 });

  // Merge real posts + generated recurring previews
  const allPosts = useMemo(() => {
    const generated = generateRecurringPosts(recurringRules, posts, 5);
    return [...posts, ...generated];
  }, [posts, recurringRules]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  // Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(s => !s); }
      if (e.key === "Escape") { setSearchOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const upsertPost = useCallback(async (p: Post) => {
    const isNew = !p.id || String(p.id).startsWith("gen_") || Number(p.id) > 1e12;
    try {
      const method = isNew ? "POST" : "PUT";
      const url    = isNew ? "/api/posts" : `/api/posts/${p.id}`;
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      if (!res.ok) throw new Error(await res.text());
      const saved: Post = await res.json();
      setPosts(ps => isNew
        ? [...ps.filter(x => !String(x.id).startsWith("gen_") || x.recurringId !== p.recurringId || x.date !== p.date), saved]
        : ps.map(x => x.id === p.id ? saved : x)
      );
      setSelectedPost(saved);
      showToast("保存しました");
    } catch (e) {
      showToast("保存に失敗しました");
      console.error(e);
    }
  }, [posts]);

  const deletePost = useCallback(async (id: number | string) => {
    try {
      if (!String(id).startsWith("gen_")) {
        const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
      }
      setPosts(ps => ps.filter(p => p.id !== id));
      setSelectedPost(null);
      showToast("削除しました");
    } catch (e) {
      showToast("削除に失敗しました");
      console.error(e);
    }
  }, []);

  const newPost = (date, time) => {
    setSelectedPost({ id: Date.now(), title:"", date, time: time||"10:00", duration:60, status:"draft", platforms:[], tags:[], body:"", note:"", recurringId:null , postTargets:[] });
  };

  const handleSelectPost = (p) => {
    setSelectedPost(p);
    if (view !== "calendar") setView("calendar");
  };

  const navTo = (id) => {
    setView(id);
    if (id !== "calendar") setSelectedPost(null);
    setSidebarOpen(false);
  };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif", background:"#F8F5FF", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#D1CEC8; border-radius:4px; }
        select { appearance:none; }
        input,textarea,select { font-family:inherit; }
        @keyframes slideIn { from{transform:translateX(18px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeUp  { from{transform:translateY(6px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes searchIn{ from{transform:translateY(-10px) scale(0.98);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .btn-ghost:hover   { background:rgba(0,0,0,0.05)!important; }
        .post-row:hover    { background:#F4F0FF!important; }
        .tpl-card:hover    { border-color:#B8B4AC!important; }
        .toolbar-btn:hover { background:rgba(0,0,0,0.07)!important; }
      `}</style>

      {/* MOBILE OVERLAY */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:40 }} />
      )}

      {/* MOBILE HEADER BAR */}
      {isMobile && (
        <div style={{ position:"fixed", top:0, left:0, right:0, height:52, background:"#2D2D35", display:"flex", alignItems:"center", padding:"0 16px", zIndex:50, flexShrink:0 }}>
          <button onClick={() => setSidebarOpen(v => !v)}
            style={{ background:"none", border:"none", color:"#F0EEFF", fontSize:20, cursor:"pointer", padding:"4px 8px 4px 0", lineHeight:1 }}>
            ☰
          </button>
          <div style={{ width:22, height:22, borderRadius:6, background:"linear-gradient(135deg,#A78BFA,#C4B5FD)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", marginRight:7 }}>◫</div>
          <span style={{ color:"#F0EEFF", fontWeight:900, fontSize:15, letterSpacing:"-0.02em", flex:1 }}>DelivCast</span>
          <button onClick={() => setSearchOpen(true)}
            style={{ background:"none", border:"none", color:"#C8C4D8", fontSize:17, cursor:"pointer", padding:"4px" }}>⌕</button>
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{
        width:220, background:"#2D2D35", display:"flex", flexDirection:"column", flexShrink:0,
        ...(isMobile ? {
          position:"fixed", top:0, left:0, bottom:0, zIndex:50,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition:"transform 0.22s ease",
          boxShadow:"4px 0 24px rgba(0,0,0,0.35)",
        } : {})
      }}>
        <div style={{ padding:"22px 20px 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#A78BFA,#C4B5FD)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#fff" }}>◫</div>
            <span style={{ color:"#F0EEFF", fontWeight:900, fontSize:15, letterSpacing:"-0.02em" }}>DelivCast</span>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)}
                style={{ background:"none", border:"none", color:"#C8C4D8", fontSize:16, cursor:"pointer", marginLeft:"auto", padding:"2px 4px" }}>✕</button>
            )}
          </div>
          <p style={{ color:"#6B5EA8", fontSize:10, margin:"5px 0 0", letterSpacing:"0.1em", fontWeight:600 }}>配信管理ツール</p>
        </div>

        {/* Search button */}
        <div style={{ padding:"0 12px 10px" }}>
          <div onClick={() => { setSearchOpen(true); setSidebarOpen(false); }}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"rgba(255,255,255,0.08)", borderRadius:8, cursor:"pointer", border:"1px solid rgba(255,255,255,0.18)" }}>
            <span style={{ fontSize:13, color:"#C8C4D8" }}>⌕</span>
            <span style={{ fontSize:12, color:"#C8C4D8", flex:1 }}>検索...</span>
            {!isMobile && <kbd style={{ fontSize:10, color:"#6B5EA8", background:"rgba(255,255,255,0.08)", borderRadius:4, padding:"1px 5px" }}>⌘K</kbd>}
          </div>
        </div>

        <nav style={{ flex:1, padding:"4px 10px" }}>
          {NAV_ITEMS.map(n => (
            <div key={n.id} className="nav-item" onClick={() => navTo(n.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, cursor:"pointer", marginBottom:1,
                background:view===n.id?"rgba(255,255,255,0.12)":"transparent", borderLeft:`2px solid ${view===n.id?"#A78BFA":"transparent"}` }}
              onMouseEnter={e => { if(view!==n.id) e.currentTarget.style.background="rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { if(view!==n.id) e.currentTarget.style.background="transparent"; }}>
              <span style={{ fontSize:13, color:view===n.id?"#F0EEFF":"#C8C4D8" }}>{n.icon}</span>
              <span style={{ fontSize:13, color:view===n.id?"#E9DFFE":"#C0BCCE", fontWeight:view===n.id?700:500 }}>{n.label}</span>
            </div>
          ))}
        </nav>

        {/* Active recurring rules indicator */}
        {recurringRules.filter(r=>r.active).length > 0 && (
          <div style={{ padding:"12px 20px", borderTop:"1px solid #D8D0F8", cursor:"pointer" }} onClick={() => setView("settings")}>
            <p style={{ color:"#C0BCCE", fontSize:10, margin:"0 0 8px", letterSpacing:"0.08em", fontWeight:700 }}>定期スケジュール</p>
            {recurringRules.filter(r=>r.active).map(r => (
              <div key={r.id} style={{ display:"flex", gap:7, alignItems:"center", marginBottom:5 }}>
                <span style={{ fontSize:10, color:"#7C3AED" }}>↻</span>
                <span style={{ color:"#B0ABCA", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", ...(isMobile ? { marginTop:52 } : {}) }}>
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          {view==="calendar" && <CalendarView allPosts={allPosts} weekAnchor={weekAnchor} setWeekAnchor={setWeekAnchor} selectedPost={selectedPost} onSelect={setSelectedPost} onNew={newPost} />}
          {view==="list"     && <ListView posts={allPosts} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onSelect={setSelectedPost} onNew={() => newPost(todayStr(),"10:00")} setPosts={setPosts} onStatusChange={upsertPost} />}
          {view==="template" && <TemplateView templates={templates} setTemplates={setTemplates} showToast={showToast} />}
          {view==="dest"     && <DestView showToast={showToast} />}
          {view==="settings" && <SettingsView recurringRules={recurringRules} setRecurringRules={setRecurringRules} notifSettings={notifSettings} setNotifSettings={setNotifSettings} showToast={showToast} allPosts={allPosts} templates={templates} />}
          {view==="setup"    && <SetupView posts={posts} templates={templates} recurringRules={recurringRules} showToast={showToast} />}
          {view==="help"     && <HelpView />}
        </div>

        {selectedPost !== null && (
          <div style={isMobile ? { position:"fixed", inset:0, zIndex:60, marginTop:52, display:"flex", flexDirection:"column" } : {}}>
            <EditorPanel post={selectedPost} templates={templates} onSave={upsertPost} onDelete={deletePost} onClose={() => setSelectedPost(null)} />
          </div>
        )}
      </div>

      {searchOpen && <SearchModal posts={allPosts} templates={templates} onSelectPost={handleSelectPost} onClose={() => setSearchOpen(false)} />}

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"#6D4EE8", color:"#fff", borderRadius:10, padding:"11px 22px", fontSize:13, fontWeight:600, zIndex:9999, animation:"fadeUp 0.2s ease", boxShadow:"0 4px 20px rgba(0,0,0,0.3)", whiteSpace:"nowrap" }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
