"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const specialties = ["الكل", "تصميم معماري", "تصميم داخلي", "إشراف هندسي", "مساحة وتخطيط"];

export default function EngineeringPage() {
  const router = useRouter();
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("الكل");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("role", "engineer");
      if (verifiedOnly) query = query.eq("verified", true);
      const { data } = await query;
      setOffices(data || []);
      setLoading(false);
    };
    fetch();
  }, [verifiedOnly]);

  const filtered = offices.filter((o) => {
    if (!searchQuery) return true;
    return o.full_name?.includes(searchQuery) || o.city?.includes(searchQuery) || o.bio?.includes(searchQuery);
  });

  const toggleLike = (id: string) =>
    setLiked((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .card-hover { transition: all 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; }
        .filter-btn { transition: all 0.2s; cursor: pointer; }
        .filter-btn:hover { background: #f0f9ff !important; color: #0284c7 !important; border-color: #0284c7 !important; }
        input:focus, select:focus { border-color: #0284c7 !important; box-shadow: 0 0 0 3px rgba(2,132,199,0.1) !important; outline: none; }
      `}</style>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0c4a6e, #0284c7)", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 10 }}>📐 المكاتب الهندسية المعتمدة</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, marginBottom: 24 }}>نخبة من المهندسين والمكاتب الاستشارية لتصميم وتخطيط وإشراف على مشاريعك</p>
          <div style={{ display: "flex", gap: 10, background: "#fff", borderRadius: 16, padding: 10, maxWidth: 600, margin: "0 auto" }}>
            <input
              type="text"
              placeholder="🔍 ابحث عن مكتب أو مدينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: "none", fontSize: 14, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "transparent", outline: "none", padding: "4px 8px" }}
            />
            <button style={{ background: "#0284c7", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              ابحث
            </button>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px" }}>

        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {specialties.map((s) => (
                <button key={s} onClick={() => setActiveSpecialty(s)} className="filter-btn" style={{
                  padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                  borderColor: activeSpecialty === s ? "#0284c7" : "#E5E7EB",
                  background: activeSpecialty === s ? "#0284c7" : "#fff",
                  color: activeSpecialty === s ? "#fff" : "#6B7280",
                  fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif",
                }}>{s}</button>
              ))}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} style={{ accentColor: "#0284c7", width: 16, height: 16 }} />
              موثّق فقط ✓
            </label>
          </div>
        </div>

        <p style={{ marginBottom: 16, fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
          {loading ? "جاري التحميل..." : `${filtered.length} مكتب هندسي متاح`}
        </p>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 20, height: 300, border: "1px solid #F0F0F0" }}>
                <div style={{ height: 160, background: "#F3F4F6" }} />
                <div style={{ padding: 18 }}>
                  <div style={{ height: 16, background: "#F3F4F6", borderRadius: 8, marginBottom: 10 }} />
                  <div style={{ height: 12, background: "#F3F4F6", borderRadius: 8, width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📐</div>
            <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد مكاتب هندسية مسجلة حالياً</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
            {filtered.map((o) => (
              <div key={o.id} className="card-hover"
                onClick={() => router.push(`/engineering/${o.id}`)}
                style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", cursor: "pointer" }}>

                {/* صورة الغلاف */}
                <div style={{ position: "relative", height: 160, background: "linear-gradient(135deg, #0c4a6e, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {o.avatar_url ? (
                    <img src={o.avatar_url} alt={o.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 56, color: "rgba(255,255,255,0.3)" }}>📐</span>
                  )}
                  {o.verified && (
                    <span style={{ position: "absolute", top: 12, right: 12, background: "#DCFCE7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>موثّق ✓</span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(o.id); }}
                    style={{ position: "absolute", top: 10, left: 10, width: 32, height: 32, background: "rgba(255,255,255,0.93)", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {liked.includes(o.id) ? "❤️" : "🤍"}
                  </button>
                </div>

                {/* المحتوى */}
                <div style={{ padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid #fff", marginTop: -28, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", overflow: "hidden" }}>
                      {o.avatar_url ? (
                        <img src={o.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{o.full_name?.[0] || "م"}</span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{o.full_name}</h3>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>📍 {o.city || "غير محدد"}</p>
                    </div>
                  </div>

                  {o.bio && (
                    <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {o.bio}
                    </p>
                  )}

                  {o.commercial_register && (
                    <div style={{ background: "#F0F9FF", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#0284c7", fontWeight: 700, marginBottom: 12, display: "inline-block" }}>
                      📋 سجل تجاري: {o.commercial_register}
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${o.phone}`, "_blank"); }}
                      style={{ padding: "8px 14px", background: "#25D366", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                      💬 واتساب
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/engineering/${o.id}`); }}
                      style={{ padding: "8px 14px", background: "#0284c7", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                      عرض الملف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
