"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [recentProps, setRecentProps] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState<"filters" | "ai">("filters");
  const [activeTab, setActiveTab] = useState<"sale" | "rent" | "daily">("sale");
  const [searchType, setSearchType] = useState("الكل");
  const [searchCity, setSearchCity] = useState("");
  const [searchPriceMin, setSearchPriceMin] = useState("");
  const [searchPriceMax, setSearchPriceMax] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [counts, setCounts] = useState({ sale: 0, rent: 0, daily: 0 });

  useEffect(() => {
    supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setRecentProps(data || []));

    supabase.from('properties').select('purpose').eq('status', 'active').then(({ data }) => {
      const sale = data?.filter((p: any) => p.purpose === 'بيع' || !p.purpose).length || 0;
      const rent = data?.filter((p: any) => p.purpose === 'إيجار').length || 0;
      const daily = data?.filter((p: any) => p.purpose === 'إيجار يومي').length || 0;
      setCounts({ sale, rent, daily });
    });
  }, []);

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "var(--bg)", minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *, button, input, textarea, select { font-family: 'Cairo', sans-serif; }
        :root{
          --green:#16a34a; --green-600:#15903f; --green-700:#117a36;
          --green-50:#ecfdf5; --green-100:#d1fae5;
          --ink:#0f172a; --ink-2:#1e293b; --muted:#475569; --muted-2:#64748b;
          --line:#e2e8f0; --line-2:#eef2f6; --bg:#ffffff; --bg-soft:#f8fafc; --bg-2:#f1f5f9;
          --shadow-sm: 0 1px 2px rgba(15,23,42,.04);
          --shadow-md: 0 8px 24px -8px rgba(15,23,42,.12), 0 2px 6px rgba(15,23,42,.04);
          --shadow-lg: 0 24px 60px -20px rgba(15,23,42,.25), 0 8px 20px -8px rgba(15,23,42,.08);
        }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        .hero { position: relative; color: #fff; padding: 84px 0 200px; overflow: hidden; isolation: isolate; }
        .hero::before {
          content: ""; position: absolute; inset: 0; z-index: -2;
          background-image: url('/hero-riyadh-night.jpg');
          background-size: cover; background-position: center;
          filter: saturate(1.5) brightness(1.18) contrast(1.12);
        }
        .hero::after {
          content: ""; position: absolute; inset: 0; z-index: -1;
          background: radial-gradient(ellipse at 78% 40%, rgba(15,23,42,.7) 0%, rgba(15,23,42,.35) 30%, rgba(15,23,42,.08) 60%, rgba(15,23,42,.25) 100%),
            linear-gradient(180deg, rgba(15,23,42,.18) 0%, rgba(15,23,42,.05) 40%, rgba(15,23,42,.75) 100%),
            radial-gradient(ellipse at 15% 75%, rgba(22,163,74,.15), transparent 50%);
        }
        .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18); padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; backdrop-filter: blur(8px); }
        .hero-eyebrow .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.25); }
        .hero h1 { font-size: clamp(34px, 5vw, 60px); font-weight: 800; line-height: 1.15; margin: 18px 0 14px; letter-spacing: -.5px; max-width: 880px; }
        .hero h1 .accent { color: #86efac; }
        .hero p.lede { font-size: 18px; color: #cbd5e1; max-width: 640px; margin: 0 0 36px; font-weight: 400; line-height: 1.7; }
        .search { background: #fff; color: var(--ink); border-radius: 18px; padding: 10px; box-shadow: 0 30px 60px -20px rgba(0,0,0,.45), 0 12px 24px -10px rgba(0,0,0,.25); max-width: 1100px; position: relative; }
        .search-tabs { display: flex; gap: 4px; padding: 6px 6px 0; position: absolute; top: -50px; right: 10px; }
        .search-tab { background: rgba(255,255,255,.12); color: #e2e8f0; padding: 10px 22px; border-radius: 12px 12px 0 0; font-size: 14px; font-weight: 600; border: 1px solid transparent; backdrop-filter: blur(8px); transition: background .15s, color .15s; cursor: pointer; }
        .search-tab:hover { background: rgba(255,255,255,.2); color: #fff; }
        .search-tab.active { background: #fff; color: var(--ink); }
        .search-tab .count { font-size: 11px; color: var(--muted-2); font-weight: 500; margin-inline-start: 6px; }
        .search-tab.active .count { color: var(--green-700); }
        .search-tab.ai { background: linear-gradient(135deg, #FF6B35, #FF3CAC, #784BA0, #2B86C5, #00D2FF); color: #fff; border-color: rgba(255,255,255,.2); box-shadow: 0 8px 20px -6px rgba(120,75,160,.55); display: inline-flex; align-items: center; gap: 6px; }
        .search-tab.ai:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .search-tab.ai.active { box-shadow: 0 10px 24px -6px rgba(120,75,160,.6), 0 0 0 2px #fff inset; }
        .search-tab.ai .sparkle { display: inline-block; animation: twinkle 2s ease-in-out infinite; }
        @keyframes twinkle { 0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); } 50% { opacity: .7; transform: scale(1.15) rotate(15deg); } }
        .ai-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: stretch; padding: 6px; }
        .ai-input-wrap { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 12px; background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%); border: 1.5px solid #e9d5ff; transition: border-color .15s, box-shadow .15s; }
        .ai-input-wrap:focus-within { border-color: #7C3AED; box-shadow: 0 0 0 4px rgba(124,58,237,.12); }
        .ai-input-wrap .ai-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #7C3AED 0%, #2563EB 100%); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
        .ai-input { flex: 1; border: none; background: transparent; outline: none; font-size: 15px; color: var(--ink); font-weight: 500; min-width: 0; }
        .ai-input::placeholder { color: #94a3b8; font-weight: 400; }
        .ai-submit { background: linear-gradient(135deg, #FF6B35, #FF3CAC, #784BA0, #2B86C5, #00D2FF); color: #fff; border-radius: 12px; padding: 0 28px; font-size: 16px; font-weight: 800; display: inline-flex; align-items: center; gap: 10px; transition: filter .15s, transform .15s; box-shadow: 0 8px 20px -6px rgba(120,75,160,.5); white-space: nowrap; border: none; cursor: pointer; text-decoration: none; }
        .ai-submit:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .search-row { display: grid; grid-template-columns: 1.1fr 1.2fr 1.1fr auto; gap: 6px; align-items: stretch; }
        .field { padding: 14px 18px; border-radius: 12px; transition: background .15s; cursor: pointer; display: flex; flex-direction: column; gap: 4px; min-width: 0; text-align: right; position: relative; }
        .field:hover { background: var(--bg-soft); }
        .field + .field { border-inline-start: 1px solid var(--line); }
        .field-label { font-size: 12px; color: var(--muted-2); font-weight: 600; }
        .field-value { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--ink); }
        .field-value svg { width: 16px; height: 16px; color: var(--muted); }
        .field-value .placeholder { color: var(--muted-2); font-weight: 500; }
        .search-submit { background: var(--green); color: #fff; border-radius: 12px; padding: 0 28px; font-size: 16px; font-weight: 700; display: inline-flex; align-items: center; gap: 10px; transition: background .15s, transform .15s; border: none; cursor: pointer; text-decoration: none; white-space: nowrap; }
        .search-submit:hover { background: var(--green-600); transform: translateY(-1px); }
        .search-submit svg { width: 20px; height: 20px; }
        .hero-stats { display: flex; gap: 48px; margin-top: 36px; flex-wrap: wrap; }
        .hero-stat { display: flex; flex-direction: column; }
        .hero-stat .num { font-size: 28px; font-weight: 800; color: #fff; }
        .hero-stat .num .plus { color: #86efac; }
        .hero-stat .lbl { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .categories { margin-top: -80px; position: relative; z-index: 2; padding-bottom: 80px; }
        .categories-card { background: #fff; border-radius: 20px; box-shadow: var(--shadow-lg); border: 1px solid var(--line-2); padding: 28px; }
        .cat-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; }
        .cat { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 18px 8px; border-radius: 14px; transition: background .15s, transform .15s; text-align: center; cursor: pointer; text-decoration: none; color: inherit; }
        .cat:hover { background: var(--bg-soft); transform: translateY(-2px); }
        .cat-icon { width: 60px; height: 60px; border-radius: 16px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); color: var(--green-700); display: grid; place-items: center; border: 1px solid rgba(22,163,74,.12); transition: background .2s, color .2s, transform .2s, box-shadow .2s; }
        .cat:hover .cat-icon { background: linear-gradient(135deg, var(--green) 0%, var(--green-700) 100%); color: #fff; border-color: transparent; box-shadow: 0 10px 20px -8px rgba(22,163,74,.45); transform: translateY(-1px); }
        .cat-icon svg { width: 32px; height: 32px; }
        .cat-name { font-size: 14px; font-weight: 600; color: var(--ink); }
        section.block { padding: 80px 0; }
        .section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; gap: 24px; flex-wrap: wrap; }
        .section-head .title-wrap { max-width: 640px; }
        .section-eyebrow { display: inline-block; color: var(--green-700); font-weight: 700; font-size: 13px; background: var(--green-50); padding: 5px 12px; border-radius: 6px; margin-bottom: 14px; }
        .section-title { font-size: 34px; font-weight: 800; color: var(--ink); margin: 0 0 8px; letter-spacing: -.5px; line-height: 1.2; }
        .section-sub { color: var(--muted); font-size: 16px; margin: 0; }
        .see-all { display: inline-flex; align-items: center; gap: 8px; color: var(--green-700); font-weight: 600; font-size: 14px; padding: 10px 18px; border: 1.5px solid var(--green-100); border-radius: 10px; background: #fff; transition: background .15s; text-decoration: none; }
        .see-all:hover { background: var(--green-50); }
        .see-all svg { width: 16px; height: 16px; }
        .props-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .prop { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid var(--line-2); transition: transform .2s ease, box-shadow .2s ease; cursor: pointer; display: flex; flex-direction: column; text-decoration: none; color: inherit; }
        .prop:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
        .prop-media { position: relative; aspect-ratio: 4/3; overflow: hidden; background: var(--bg-2); }
        .prop-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
        .prop:hover .prop-media img { transform: scale(1.04); }
        .prop-tags { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; }
        .tag { background: #fff; color: var(--ink); padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
        .tag.sale { background: var(--green); color: #fff; }
        .tag.rent { background: #2563eb; color: #fff; }
        .tag.daily { background: #7c3aed; color: #fff; }
        .prop-body { padding: 18px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .prop-price { font-size: 22px; font-weight: 800; color: var(--ink); letter-spacing: -.3px; display: flex; align-items: baseline; gap: 6px; }
        .prop-price .currency { font-size: 13px; color: var(--muted); font-weight: 600; }
        .prop-title { font-size: 15px; font-weight: 600; color: var(--ink-2); margin: 0; line-height: 1.5; }
        .prop-loc { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 13px; font-weight: 500; }
        .prop-loc svg { width: 14px; height: 14px; color: var(--green); }
        .prop-specs { display: flex; gap: 14px; padding-top: 12px; margin-top: auto; border-top: 1px solid var(--line-2); color: var(--muted); font-size: 13px; font-weight: 500; }
        .projects { background: var(--bg-soft); }
        .proj-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
        .proj { position: relative; border-radius: 20px; overflow: hidden; aspect-ratio: 16/10; color: #fff; display: flex; flex-direction: column; justify-content: flex-end; padding: 32px; isolation: isolate; cursor: pointer; transition: transform .25s ease; }
        .proj:hover { transform: translateY(-3px); }
        .proj-bg { position: absolute; inset: 0; z-index: -2; background-size: cover; background-position: center; transition: transform .6s ease; }
        .proj:hover .proj-bg { transform: scale(1.04); }
        .proj::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(0deg, rgba(15,23,42,.92) 0%, rgba(15,23,42,.45) 50%, rgba(15,23,42,.1) 100%); }
        .proj.small { aspect-ratio: auto; min-height: 280px; }
        .proj-status { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,.16); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; align-self: flex-start; margin-bottom: auto; border: 1px solid rgba(255,255,255,.22); }
        .proj-status .dot { width: 7px; height: 7px; border-radius: 50%; background: #86efac; }
        .proj-status.upcoming .dot { background: #fde047; }
        .proj-status.upcoming { color: #fef9c3; }
        .proj-developer { font-size: 13px; color: #cbd5e1; font-weight: 500; margin-bottom: 8px; }
        .proj-title { font-size: 30px; font-weight: 800; margin: 0 0 8px; letter-spacing: -.5px; }
        .proj.small .proj-title { font-size: 22px; }
        .proj-loc { display: flex; align-items: center; gap: 6px; color: #cbd5e1; font-size: 14px; margin-bottom: 16px; }
        .proj-loc svg { width: 15px; height: 15px; }
        .proj-meta { display: flex; gap: 18px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.18); flex-wrap: wrap; }
        .proj-meta .item { display: flex; flex-direction: column; }
        .proj-meta .lbl { font-size: 11px; color: #94a3b8; font-weight: 500; }
        .proj-meta .val { font-size: 15px; color: #fff; font-weight: 700; }
        .proj-side { display: flex; flex-direction: column; gap: 20px; }
        .services-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
        .service { background: #fff; border: 1px solid var(--line-2); border-radius: 16px; padding: 28px; transition: transform .2s ease, box-shadow .2s ease, border-color .15s; cursor: pointer; display: flex; flex-direction: column; gap: 14px; text-decoration: none; color: inherit; }
        .service:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--green-100); }
        .service-icon { width: 54px; height: 54px; border-radius: 14px; background: var(--green-50); color: var(--green-700); display: grid; place-items: center; }
        .service-icon svg { width: 28px; height: 28px; }
        .service h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--ink); }
        .service p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.7; }
        .service-link { color: var(--green-700); font-weight: 600; font-size: 14px; margin-top: auto; padding-top: 8px; display: inline-flex; align-items: center; gap: 6px; }
        .service-link svg { width: 14px; height: 14px; }
        .cta-strip { background: linear-gradient(135deg, var(--ink) 0%, #1e293b 100%); color: #fff; border-radius: 20px; padding: 48px; display: flex; justify-content: space-between; align-items: center; gap: 30px; flex-wrap: wrap; position: relative; overflow: hidden; }
        .cta-strip::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 80% 50%, rgba(22,163,74,.35), transparent 60%); pointer-events: none; }
        .cta-strip > * { position: relative; }
        .cta-strip h3 { font-size: 28px; font-weight: 800; margin: 0 0 6px; }
        .cta-strip p { margin: 0; color: #cbd5e1; font-size: 15px; }
        .cta-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 10px; font-weight: 700; font-size: 14px; transition: all .15s; text-decoration: none; white-space: nowrap; }
        .btn-primary { background: var(--green); color: #fff; }
        .btn-primary:hover { background: var(--green-600); }
        .btn-white { background: #fff; color: var(--ink); }
        .btn-white:hover { background: #f1f5f9; }
        @media (max-width: 1100px) {
          .cat-grid { grid-template-columns: repeat(5,1fr); }
          .props-grid { grid-template-columns: repeat(2,1fr); }
          .services-grid { grid-template-columns: repeat(2,1fr); }
          .proj-grid { grid-template-columns: 1fr; }
          .search-row { grid-template-columns: 1fr 1fr; gap: 8px; }
          .search-submit { grid-column: 1/-1; padding: 14px; justify-content: center; }
          .ai-row { grid-template-columns: 1fr; }
          .ai-submit { padding: 14px; justify-content: center; }
        }
        @media (max-width: 640px) {
          .cat-grid { grid-template-columns: repeat(3,1fr); }
          .props-grid { grid-template-columns: 1fr; }
          .services-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 26px; }
          .hero h1 { font-size: 32px; }
          .search-row { grid-template-columns: 1fr; }
          .field + .field { border-inline-start: none; border-top: 1px solid var(--line); }
        }
      `}} />

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">
            <span className="dot" />
            الآلاف من العقارات المحدثة يومياً
          </span>
          <h1>اعثر على عقارك المثالي في <span className="accent">المملكة العربية السعودية</span></h1>
          <p className="lede" style={{ height: "90px" }}>منصة عقارية ذكية تربطك مباشرةً بأفضل العروض من ملّاك ومطورين موثوقين — من جميع أنحاء المملكة.</p>

          <div style={{ position: "relative", maxWidth: "1100px" }}>
            <div className="search-tabs">
              <button className={`search-tab ai`} onClick={() => window.open("/broker-ai", "_blank")}>
                <span className="sparkle">✨</span> اسأل Broker AI
              </button>
              <button className={`search-tab ${searchMode === "filters" && activeTab === "sale" ? "active" : ""}`} onClick={() => { setSearchMode("filters"); setActiveTab("sale"); }}>
                للبيع <span className="count">{counts.sale.toString()}</span>
              </button>
              <button className={`search-tab ${searchMode === "filters" && activeTab === "rent" ? "active" : ""}`} onClick={() => { setSearchMode("filters"); setActiveTab("rent"); }}>
                للإيجار <span className="count">{counts.rent.toString()}</span>
              </button>
              <button className={`search-tab ${searchMode === "filters" && activeTab === "daily" ? "active" : ""}`} onClick={() => { setSearchMode("filters"); setActiveTab("daily"); }}>
                إيجار يومي <span className="count">{counts.daily.toString()}</span>
              </button>
            </div>

            <div className="search">
              {searchMode === "filters" && (
                <div className="search-row">
                  {/* نوع العقار */}
                  <div className="field">
                    <span className="field-label">نوع العقار</span>
                    <span className="field-value">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>
                      <span>{searchType}</span>
                      <svg style={{ marginInlineStart: "auto" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                    <select value={searchType} onChange={e => setSearchType(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}>
                      {["الكل","شقة","فيلا","أرض","مكتب","استراحة","دوبلكس","عمارة","محل تجاري","مستودع","أخرى"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* المدينة */}
                  <div className="field">
                    <span className="field-label">المدينة</span>
                    <span className="field-value">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>{searchCity || "اختر المدينة"}</span>
                      <svg style={{ marginInlineStart: "auto" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                    <select value={searchCity} onChange={e => setSearchCity(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}>
                      <option value="">الكل</option>
                      {["الرياض","جدة","مكة المكرمة","المدينة المنورة","الدمام","الخبر","تبوك","أبها"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* السعر */}
                  <div className="field">
                    <span className="field-label">السعر (ريال)</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input value={searchPriceMin} onChange={e => setSearchPriceMin(e.target.value)} placeholder="من" style={{ width: "50%", border: "none", outline: "none", fontSize: 13, fontFamily: "'Cairo'", color: "#0f172a", background: "transparent" }} />
                      <span style={{ color: "#94a3b8" }}>—</span>
                      <input value={searchPriceMax} onChange={e => setSearchPriceMax(e.target.value)} placeholder="إلى" style={{ width: "50%", border: "none", outline: "none", fontSize: 13, fontFamily: "'Cairo'", color: "#0f172a", background: "transparent" }} />
                    </div>
                  </div>

                  {/* زر البحث */}
                  <Link href={`/properties?type=${encodeURIComponent(searchType)}&city=${encodeURIComponent(searchCity)}&priceMin=${searchPriceMin}&priceMax=${searchPriceMax}&listing=${activeTab}`} className="search-submit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    ابحث الآن
                  </Link>
                </div>
              )}

              {searchMode === "ai" && (
                <div className="ai-row">
                  <div className="ai-input-wrap">
                    <span className="ai-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"/>
                        <path d="M19 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" opacity=".7"/>
                      </svg>
                    </span>
                    <input className="ai-input" type="text" value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="مثال: أبحث عن شقة في حي النرجس بميزانية مليون ريال، ٣ غرف، قريبة من مدرسة..." />
                  </div>
                  <Link href={`/properties?ai=${encodeURIComponent(aiQuery)}`} className="ai-submit">🤖 اسأل بروكر AI</Link>
                </div>
              )}
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat"><span className="num" suppressHydrationWarning>{(counts.sale + counts.rent + counts.daily).toLocaleString()}<span className="plus">+</span></span><span className="lbl">عقار معروض</span></div>
            <div className="hero-stat"><span className="num" suppressHydrationWarning>1,240<span className="plus">+</span></span><span className="lbl">وسيط معتمد</span></div>
            <div className="hero-stat"><span className="num" suppressHydrationWarning>134</span><span className="lbl">مدينة ومحافظة</span></div>
            <div className="hero-stat"><span className="num" suppressHydrationWarning>320<span className="plus">+</span></span><span className="lbl">مشروع تطويري</span></div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories">
        <div className="container">
          <div className="categories-card">
            <div className="cat-grid">
              {[
                { label: "شقة", href: "/properties?type=شقة", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M7 28V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v20"/><path d="M4 28h24"/><rect x="11" y="10" width="3.5" height="3.5" rx=".4"/><rect x="17.5" y="10" width="3.5" height="3.5" rx=".4"/><rect x="11" y="16" width="3.5" height="3.5" rx=".4"/><rect x="17.5" y="16" width="3.5" height="3.5" rx=".4"/><path d="M14 28v-5h4v5"/></svg> },
                { label: "فيلا", href: "/properties?type=فيلا", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 16L16 6l12 10"/><path d="M7 14v14h18V14"/><path d="M4 28h24"/><path d="M13 28v-7h6v7"/><rect x="9" y="17" width="3" height="3" rx=".3"/><rect x="20" y="17" width="3" height="3" rx=".3"/></svg> },
                { label: "أرض", href: "/properties?type=أرض", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h22v16H5z" strokeDasharray="3 3"/><circle cx="5" cy="8" r="1.4" fill="currentColor" stroke="none"/><circle cx="27" cy="8" r="1.4" fill="currentColor" stroke="none"/><circle cx="5" cy="24" r="1.4" fill="currentColor" stroke="none"/><circle cx="27" cy="24" r="1.4" fill="currentColor" stroke="none"/><path d="M11 19l3-3 3 2 4-4"/></svg> },
                { label: "مكتب", href: "/properties?type=مكتب", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 28V11a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v17"/><path d="M18 28V16h7a1 1 0 0 1 1 1v11"/><path d="M3 28h26"/><path d="M9 14h5M9 18h5M9 22h5"/><path d="M21 20h2M21 24h2"/></svg> },
                { label: "استراحة", href: "/properties?type=استراحة", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M11 9c2-1 4-1 6 0"/><path d="M14 8c-2.5-2-5-2-7 0"/><path d="M14 8c2.5-2 5-2 7 0"/><path d="M14 9v6"/><path d="M5 22v6h22v-6"/><path d="M5 22l9-7 9 7"/><path d="M13 28v-3h4v3"/></svg> },
                { label: "دوبلكس", href: "/properties?type=دوبلكس", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14L16 5l12 9"/><path d="M7 12v16h18V12"/><path d="M3 28h26"/><path d="M7 19h18"/><rect x="10" y="14" width="3" height="3" rx=".3"/><rect x="19" y="14" width="3" height="3" rx=".3"/><path d="M14.5 28v-3h3v3"/></svg> },
                { label: "عمارة", href: "/properties?type=عمارة", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M8 28V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v24"/><path d="M4 28h24"/><rect x="11" y="6" width="3" height="3" rx=".3"/><rect x="18" y="6" width="3" height="3" rx=".3"/><rect x="11" y="11" width="3" height="3" rx=".3"/><rect x="18" y="11" width="3" height="3" rx=".3"/><rect x="11" y="16" width="3" height="3" rx=".3"/><rect x="18" y="16" width="3" height="3" rx=".3"/><path d="M14 28v-7h4v7"/></svg> },
                { label: "محل تجاري", href: "/properties?type=محل تجاري", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 10l2-4h18l2 4"/><path d="M5 10c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M11 10c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M17 10c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M7 13v15h18V13"/><path d="M4 28h24"/><path d="M13 28v-7h6v7"/></svg> },
                { label: "مستودع", href: "/properties?type=مستودع", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l12-6 12 6v16H4z"/><path d="M4 28h24"/><rect x="10" y="16" width="12" height="9"/><path d="M10 20h12"/><path d="M16 16v9"/></svg> },
                { label: "أخرى", href: "/properties", icon: <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="9" height="9" rx="1.5"/><rect x="18" y="5" width="9" height="9" rx="1.5"/><rect x="5" y="18" width="9" height="9" rx="1.5"/><path d="M22.5 18v9M18 22.5h9"/></svg> },
              ].map((cat) => (
                <Link key={cat.label} href={cat.href} className="cat">
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-name">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="block" style={{ paddingTop: "20px" }}>
        <div className="container">
          <div className="section-head">
            <div className="title-wrap">
              <span className="section-eyebrow">أحدث الإعلانات</span>
              <h2 className="section-title">العقارات المضافة حديثاً</h2>
              <p className="section-sub">آخر العقارات المضافة على المنصة — محدّثة بشكل مستمر.</p>
            </div>
            <Link href="/properties" className="see-all">
              عرض جميع العقارات
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
          </div>

          <div className="props-grid">
            {recentProps.length > 0 ? recentProps.map((p) => (
              <Link key={p.id} href={`/properties/${p.id}`} className="prop">
                <div className="prop-media">
                  <img src={p.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80"} alt={p.title} />
                  <div className="prop-tags">
                    <span className={`tag ${p.purpose === 'إيجار' ? 'rent' : p.purpose === 'إيجار يومي' ? 'daily' : 'sale'}`}>
                      {p.purpose === 'إيجار' ? 'للإيجار' : p.purpose === 'إيجار يومي' ? 'إيجار يومي' : 'للبيع'}
                    </span>
                  </div>
                </div>
                <div className="prop-body">
                  <div className="prop-price">{Number(p.price).toLocaleString()} <span className="currency">ر.س</span></div>
                  <h3 className="prop-title">{p.title}</h3>
                  <div className="prop-loc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {p.district}، {p.city}
                  </div>
                  <div className="prop-specs">
                    {p.rooms && <span>🛏 {p.rooms} غرف</span>}
                    {p.baths && <span>🚿 {p.baths} حمام</span>}
                    {p.area && <span>📐 {p.area} م²</span>}
                  </div>
                </div>
              </Link>
            )) : (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: 15 }}>
                لا توجد عقارات حالياً
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="block projects">
        <div className="container">
          <div className="section-head">
            <div className="title-wrap">
              <span className="section-eyebrow">المشاريع الكبرى</span>
              <h2 className="section-title">مشاريع تطويرية واعدة</h2>
              <p className="section-sub">استثمر في مستقبل المملكة — مشاريع من كبار المطورين بمواصفات عالمية.</p>
            </div>
            <Link href="/projects" className="see-all">
              جميع المشاريع
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
          </div>
          <div className="proj-grid">
            <article className="proj">
              <div className="proj-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1400&q=80')" }} />
              <span className="proj-status"><span className="dot" /> يُسلَّم 2027</span>
              <div>
                <div className="proj-developer">شركة رؤى المستقبل العقارية</div>
                <h3 className="proj-title">واجهة الياسمين السكنية</h3>
                <div className="proj-loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> شمال الرياض</div>
                <div className="proj-meta">
                  <div className="item"><span className="lbl">يبدأ من</span><span className="val">1.45 مليون ر.س</span></div>
                  <div className="item"><span className="lbl">الوحدات</span><span className="val">320 وحدة</span></div>
                  <div className="item"><span className="lbl">التسليم</span><span className="val">Q3 / 2027</span></div>
                </div>
              </div>
            </article>
            <div className="proj-side">
              <article className="proj small">
                <div className="proj-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80')" }} />
                <span className="proj-status upcoming"><span className="dot" /> حجوزات مفتوحة</span>
                <div>
                  <div className="proj-developer">مجموعة الخزامى العقارية</div>
                  <h3 className="proj-title">مرسى جدة ووترفرونت</h3>
                  <div className="proj-loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> الكورنيش الشمالي — جدة</div>
                </div>
              </article>
              <article className="proj small">
                <div className="proj-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80')" }} />
                <span className="proj-status"><span className="dot" /> قيد التنفيذ</span>
                <div>
                  <div className="proj-developer">دار العمران للتطوير</div>
                  <h3 className="proj-title">ضاهية النخيل الذكية</h3>
                  <div className="proj-loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> شرق الدمام</div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="block" style={{ paddingBottom: "40px" }}>
        <div className="container">
          <div className="section-head">
            <div className="title-wrap">
              <span className="section-eyebrow">خدمات متكاملة</span>
              <h2 className="section-title">كل ما تحتاجه في رحلتك العقارية</h2>
              <p className="section-sub">شبكة من المتخصصين المعتمدين لتسهيل كل خطوة.</p>
            </div>
          </div>
          <div className="services-grid">
            <Link href="/contractors" className="service">
              <span className="service-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M2 20h20"/><path d="M6 20V10l3-2v12"/><path d="M14 20V6l4 2v12"/></svg></span>
              <h3>مقاولون معتمدون</h3>
              <p>تواصل مع مقاولين موثوقين لمشاريع البناء والترميم بضمان جودة التنفيذ.</p>
              <span className="service-link">استعرض المقاولين <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></span>
            </Link>
            <Link href="/engineering" className="service">
              <span className="service-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18"/><path d="M9 13h6"/><path d="M9 17h6"/></svg></span>
              <h3>مكاتب هندسية</h3>
              <p>مكاتب مرخّصة لتصميم الفلل والمشاريع مع متابعة كاملة للترخيص.</p>
              <span className="service-link">احجز استشارة <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></span>
            </Link>
            <Link href="/pricing" className="service">
              <span className="service-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>
              <h3>تقييم عقاري</h3>
              <p>تقارير تقييم احترافية معتمدة من الهيئة السعودية للمقيمين المعتمدين.</p>
              <span className="service-link">اطلب تقييماً <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></span>
            </Link>
            <Link href="/support" className="service">
              <span className="service-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
              <h3>استشارات عقارية</h3>
              <p>مستشارون لاختيار الاستثمار الأمثل ودراسات الجدوى والتمويل.</p>
              <span className="service-link">تحدّث مع مستشار <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container" style={{ marginBottom: "40px" }}>
        <div className="cta-strip">
          <div>
            <h3>عندك عقار وتبي تبيعه أو تأجره؟</h3>
            <p>أضف إعلانك مجاناً، ووصل أكثر من مليون باحث شهرياً عن العقار المناسب.</p>
          </div>
          <div className="cta-buttons">
            <Link href="/add-property" className="btn btn-primary">أضف إعلانك مجاناً</Link>
            <Link href="/pricing" className="btn btn-white">الاشتراك في باقة مدفوعة</Link>
          </div>
        </div>
      </section>
    </div>
  );
}