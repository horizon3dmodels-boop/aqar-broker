"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const types = ["الكل", "استراحة", "شاليه", "غرفة فندقية", "شقة مفروشة", "شقة", "فيلا", "أخرى"];
const typeIcons: Record<string, string> = {
  "الكل": "🏠", "استراحة": "🌴", "شاليه": "🏖️", "غرفة فندقية": "🏨",
  "شقة مفروشة": "🛋️", "شقة": "🏢", "فيلا": "🏡", "أخرى": "✨"
};

export default function DailyRentPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("الكل");
  const [sortBy, setSortBy] = useState("الأحدث");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [liked, setLiked] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchListings = async (type = selectedType, sort = sortBy) => {
    setLoading(true);
    let query = supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .eq("purpose", "إيجار يومي");
    if (type !== "الكل") query = query.eq("type", type);
    if (sort === "السعر: الأقل") query = query.order("price", { ascending: true });
    else if (sort === "السعر: الأعلى") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchListings(selectedType, sortBy); }, [sortBy]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    fetchListings(type, sortBy);
  };

  const toggleLike = (id: string) =>
    setLiked((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const filtered = listings.filter((p) => {
    if (!searchText) return true;
    return p.title?.includes(searchText) || p.district?.includes(searchText) || p.city?.includes(searchText);
  });

  const formatPrice = (price: number) => price?.toLocaleString("ar-SA") || "—";

  const shareWhatsApp = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${p.id}`;
    const text = `🏠 ${p.title}\n📍 ${p.city}\n💰 ${formatPrice(p.price)} ر.س/ليلة\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareTwitter = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${p.id}`;
    const text = `🏠 ${p.title} - ${formatPrice(p.price)} ر.س/ليلة`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  const copyLink = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${p.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .card-hover { transition: all 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; }
        .filter-btn { transition: all 0.2s; cursor: pointer; }
        .filter-btn:hover { background: #e0f2fe !important; color: #0284c7 !important; }
        .share-btn { transition: all 0.15s; }
        .share-btn:hover { transform: scale(1.12); }
        input:focus, select:focus { border-color: #0284c7 !important; box-shadow: 0 0 0 3px rgba(2,132,199,0.1) !important; outline: none; }
      `}</style>

      {/* Search Bar — نفس نمط صفحة العقارات */}
      <div style={{ background: "linear-gradient(135deg, #0c4a6e, #0284c7)", padding: "28px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, background: "#fff", borderRadius: 16, padding: 10 }}>
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم أو الحي أو المدينة..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ flex: 1, border: "none", fontSize: 14, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "transparent", outline: "none", padding: "4px 8px" }}
            />
            <button
              onClick={() => fetchListings(selectedType, sortBy)}
              style={{ background: "#0284c7", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              ابحث
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px" }}>

        {/* شريط الفلاتر + العرض + الترتيب */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          {/* فلاتر النوع */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            {types.map(t => (
              <button key={t} onClick={() => handleTypeChange(t)} className="filter-btn" style={{
                padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                borderColor: selectedType === t ? "#0284c7" : "#E5E7EB",
                background: selectedType === t ? "#0284c7" : "#fff",
                color: selectedType === t ? "#fff" : "#6B7280",
                fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif"
              }}>
                {typeIcons[t]} {t}
              </button>
            ))}
          </div>

          {/* الترتيب + grid/list */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff" }}>
              {["الأحدث", "السعر: الأقل", "السعر: الأعلى"].map(o => <option key={o}>{o}</option>)}
            </select>
            <div style={{ display: "flex", border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
              {(["grid", "list"] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding: "8px 12px", border: "none",
                  background: viewMode === mode ? "#0284c7" : "#fff",
                  color: viewMode === mode ? "#fff" : "#6B7280",
                  cursor: "pointer", fontSize: 14
                }}>
                  {mode === "grid" ? "⊞" : "☰"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 600, marginBottom: 16 }}>
          {loading ? "جاري التحميل..." : `${filtered.length} وحدة متاحة`}
        </p>

        {/* القائمة */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #F0F0F0", height: 380 }}>
                <div style={{ height: 200, background: "#F3F4F6" }} />
                <div style={{ padding: 18 }}>
                  <div style={{ height: 16, background: "#F3F4F6", borderRadius: 8, marginBottom: 10 }} />
                  <div style={{ height: 12, background: "#F3F4F6", borderRadius: 8, width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
            <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد وحدات إيجار يومي حالياً</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>جرب تغيير النوع أو تحقق لاحقاً</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(300px, 1fr))" : "1fr",
            gap: 20
          }}>
            {filtered.map(p => (
              <div key={p.id} className="card-hover"
                onClick={() => router.push(`/properties/${p.id}`)}
                style={{
                  background: "#fff", borderRadius: 20, overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0",
                  cursor: "pointer",
                  display: viewMode === "list" ? "flex" : "block"
                }}>

                {/* الصورة */}
                <div style={{
                  position: "relative",
                  height: viewMode === "grid" ? 200 : 160,
                  width: viewMode === "list" ? 240 : "auto",
                  flexShrink: 0, overflow: "hidden"
                }}>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e0f2fe, #bae6fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🌙</div>
                  )}
                  <span style={{ position: "absolute", top: 12, right: 12, background: "#0284c7", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>
                    {p.type}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(p.id); }}
                    style={{ position: "absolute", top: 10, left: 10, width: 34, height: 34, background: "rgba(255,255,255,0.93)", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {liked.includes(p.id) ? "❤️" : "🤍"}
                  </button>
                </div>

                {/* المحتوى */}
                <div style={{ padding: "16px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{p.title}</h3>
                    <span style={{ fontSize: 11, background: "#F3F4F6", color: "#6B7280", padding: "2px 8px", borderRadius: 6, fontWeight: 600, flexShrink: 0, marginRight: 8 }}>{p.type}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>📍 {p.district ? `${p.district}، ` : ""}{p.city}</p>

                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6B7280", marginBottom: 12 }}>
                    {p.rooms > 0 && <span>🛏 {p.rooms} غرف</span>}
                    {p.baths > 0 && <span>🚿 {p.baths}</span>}
                    {p.area && <span>📐 {p.area} م²</span>}
                  </div>

                  {p.features?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {p.features.slice(0, 3).map((f: string, i: number) => (
                        <span key={i} style={{ background: "#F8F9FB", border: "1px solid #E5E7EB", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#374151" }}>✓ {f}</span>
                      ))}
                      {p.features.length > 3 && <span style={{ fontSize: 11, color: "#9CA3AF" }}>+{p.features.length - 3}</span>}
                    </div>
                  )}

                  {/* السعر + أزرار التواصل */}
                  <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "#0284c7" }}>{formatPrice(p.price)}</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}> ر.س/ليلة</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={(e) => e.stopPropagation()}
                        style={{ width: 32, height: 32, background: "#F0F9FF", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>💬</button>
                      <button onClick={(e) => e.stopPropagation()}
                        style={{ width: 32, height: 32, background: "#F0F9FF", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>📞</button>
                    </div>
                  </div>

                  {/* أزرار المشاركة */}
                  <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 10, marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>مشاركة:</span>
                    <button onClick={(e) => shareWhatsApp(e, p)} className="share-btn" title="مشاركة على واتساب"
                      style={{ width: 30, height: 30, background: "#25D366", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.535 5.849L.057 23.985l6.284-1.648A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 01-5.031-1.371l-.361-.214-3.732.979 1.001-3.648-.235-.374A9.86 9.86 0 012.1 12c0-5.464 4.436-9.9 9.9-9.9s9.9 4.436 9.9 9.9-4.436 9.9-9.9 9.9z"/>
                      </svg>
                    </button>
                    <button onClick={(e) => shareTwitter(e, p)} className="share-btn" title="مشاركة على X"
                      style={{ width: 30, height: 30, background: "#000", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>
                    <button onClick={(e) => copyLink(e, p)} className="share-btn" title="نسخ الرابط"
                      style={{ width: 30, height: 30, background: copiedId === p.id ? "#16a34a" : "#F3F4F6", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "all 0.2s" }}>
                      {copiedId === p.id ? "✓" : "🔗"}
                    </button>
                    {copiedId === p.id && (
                      <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>تم النسخ!</span>
                    )}
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
