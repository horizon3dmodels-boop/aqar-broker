"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const propertyTypes = ["الكل", "شقة", "فيلا", "دوبلكس", "أرض", "مكتب", "محل تجاري", "استراحة", "مستودع", "عمارة", "أخرى"];
const purposes = ["الكل", "بيع", "إيجار"];
const sortOptions = ["الأحدث", "السعر: الأقل", "السعر: الأعلى", "المساحة: الأكبر"];

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("الأحدث");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [searchText, setSearchText] = useState("");
  const [liked, setLiked] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [compareToast, setCompareToast] = useState(false);

  useEffect(() => {
    const loadFromStorage = () => {
      const saved = JSON.parse(localStorage.getItem("compareList") || "[]");
      if (saved.length > 0) {
        setCompareList(saved);
        localStorage.removeItem("compareList");
      }
    };
    loadFromStorage();
    window.addEventListener("focus", loadFromStorage);
    return () => window.removeEventListener("focus", loadFromStorage);
  }, []);

  const rawType = searchParams.get("type") || "الكل";
  const rawListing = searchParams.get("listing");
  let selectedPurposeFromURL = "الكل";
  if (rawListing === "rent") selectedPurposeFromURL = "إيجار";
  else if (rawListing === "daily") selectedPurposeFromURL = "إيجار يومي";
  else if (rawListing === "sale") selectedPurposeFromURL = "بيع";

  const [selectedType, setSelectedType] = useState(rawType);
  const [selectedPurpose, setSelectedPurpose] = useState(selectedPurposeFromURL);

  const fetchProperties = useCallback(async (
    type: string, purpose: string, sort: string,
    priceMin: string, priceMax: string, area: string
  ) => {
    setLoading(true);
    let query = supabase.from("properties").select("*").eq("status", "active").neq("purpose", "إيجار يومي");
    if (type !== "الكل") query = query.eq("type", type);
    if (purpose !== "الكل") query = query.eq("purpose", purpose);
    if (priceMin) query = query.gte("price", parseFloat(priceMin.replace(/,/g, "")));
    if (priceMax) query = query.lte("price", parseFloat(priceMax.replace(/,/g, "")));
    if (area) query = query.gte("area", parseFloat(area));
    if (sort === "الأحدث") query = query.order("created_at", { ascending: false });
    else if (sort === "السعر: الأقل") query = query.order("price", { ascending: true });
    else if (sort === "السعر: الأعلى") query = query.order("price", { ascending: false });
    else if (sort === "المساحة: الأكبر") query = query.order("area", { ascending: false });
    const { data } = await query;
    setProperties(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const type = searchParams.get("type") || "الكل";
    const listing = searchParams.get("listing");
    let purpose = "الكل";
    if (listing === "rent") purpose = "إيجار";
    else if (listing === "daily") purpose = "إيجار يومي";
    else if (listing === "sale") purpose = "بيع";
    setSelectedType(type);
    setSelectedPurpose(purpose);
    fetchProperties(type, purpose, sortBy, minPrice, maxPrice, minArea);
  }, [searchParams]);

  useEffect(() => {
    fetchProperties(selectedType, selectedPurpose, sortBy, minPrice, maxPrice, minArea);
  }, [sortBy, minPrice, maxPrice, minArea]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    fetchProperties(type, selectedPurpose, sortBy, minPrice, maxPrice, minArea);
  };

  const handlePurposeChange = (purpose: string) => {
    setSelectedPurpose(purpose);
    fetchProperties(selectedType, purpose, sortBy, minPrice, maxPrice, minArea);
  };

  const toggleLike = (id: string) =>
    setLiked((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const filtered = properties.filter((p) => {
    if (!searchText) return true;
    return p.title?.includes(searchText) || p.district?.includes(searchText) || p.city?.includes(searchText);
  });

  const formatPrice = (price: number) => price?.toLocaleString("ar-SA") || "—";

  const shareWhatsApp = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${p.id}`;
    const text = `🏠 ${p.title}\n📍 ${p.city}\n💰 ${formatPrice(p.price)} ر.س\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareTwitter = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${p.id}`;
    const text = `🏠 ${p.title} - ${formatPrice(p.price)} ر.س`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  const copyLink = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${p.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCompare = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.find(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= 4) return prev;
      if (prev.length === 0) {
        setCompareToast(true);
        setTimeout(() => setCompareToast(false), 3000);
      }
      return [...prev, p];
    });
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .card-hover { transition: all 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; }
        .filter-btn { transition: all 0.2s; cursor: pointer; }
        .filter-btn:hover { background: #f0fdf4 !important; color: #16a34a !important; }
        .share-btn { transition: all 0.15s; }
        .share-btn:hover { transform: scale(1.12); }
        input:focus, select:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; outline: none; }
      `}</style>

      {/* Search Bar */}
      <div style={{ background: "linear-gradient(135deg, #052e16, #16a34a)", padding: "28px 24px" }}>
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
              onClick={() => fetchProperties(selectedType, selectedPurpose, sortBy, minPrice, maxPrice, minArea)}
              style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              ابحث
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px", display: "flex", gap: 24 }}>

        {/* Sidebar Filters */}
        {showFilters && (
          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: 18, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", position: "sticky", top: 80 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>🔧 الفلاتر</h3>
                <button onClick={() => { setSelectedType("الكل"); setSelectedPurpose("الكل"); setMinPrice(""); setMaxPrice(""); setMinArea(""); }}
                  style={{ fontSize: 12, color: "#16a34a", background: "none", border: "none", cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>
                  مسح الكل
                </button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>الغرض</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {purposes.map((p) => (
                    <button key={p} onClick={() => handlePurposeChange(p)} className="filter-btn" style={{
                      padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                      borderColor: selectedPurpose === p ? "#16a34a" : "#E5E7EB",
                      fontSize: 13, fontWeight: 600,
                      background: selectedPurpose === p ? "#16a34a" : "#fff",
                      color: selectedPurpose === p ? "#fff" : "#6B7280",
                      fontFamily: "'Cairo', sans-serif",
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>نوع العقار</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {propertyTypes.map((t) => (
                    <button key={t} onClick={() => handleTypeChange(t)} className="filter-btn" style={{
                      padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                      borderColor: selectedType === t ? "#16a34a" : "#E5E7EB",
                      fontSize: 13, fontWeight: 600,
                      background: selectedType === t ? "#16a34a" : "#fff",
                      color: selectedType === t ? "#fff" : "#6B7280",
                      fontFamily: "'Cairo', sans-serif",
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>نطاق السعر (ر.س)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="من"
                    style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }} />
                  <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="إلى"
                    style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>المساحة (م²)</p>
                <input value={minArea} onChange={(e) => setMinArea(e.target.value)} placeholder="الحد الأدنى للمساحة"
                  style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setShowFilters(!showFilters)} style={{ border: "1.5px solid #E5E7EB", background: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", color: "#374151" }}>
                {showFilters ? "🙈 إخفاء الفلاتر" : "🔧 إظهار الفلاتر"}
              </button>
              <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>
                {loading ? "جاري التحميل..." : `${filtered.length} عقار متاح`}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff" }}>
                {sortOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
              <div style={{ display: "flex", border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                {(["grid", "list"] as const).map((mode) => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: "8px 12px", border: "none", background: viewMode === mode ? "#16a34a" : "#fff", color: viewMode === mode ? "#fff" : "#6B7280", cursor: "pointer", fontSize: 14 }}>
                    {mode === "grid" ? "⊞" : "☰"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", border: "1px solid #F0F0F0", height: 320 }}>
                  <div style={{ height: 190, background: "#F3F4F6" }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ height: 16, background: "#F3F4F6", borderRadius: 8, marginBottom: 10 }} />
                    <div style={{ height: 12, background: "#F3F4F6", borderRadius: 8, width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
              <p style={{ fontSize: 16, fontWeight: 700 }}>لا توجد عقارات تطابق البحث</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>جرب تغيير الفلاتر</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr", gap: 16 }}>
              {filtered.map((p) => (
                <div key={p.id} className="card-hover"
                  onClick={() => {
  if (compareList.length > 0 && !compareList.find(x => x.id === p.id)) {
    if (compareList.length < 4) {
      setCompareList(prev => [...prev, p]);
    }
    return;
  }
  router.push(`/properties/${p.id}`);
}}
                  style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", cursor: "pointer", display: viewMode === "list" ? "flex" : "block" }}>

                  <div style={{ position: "relative", height: viewMode === "grid" ? 190 : 160, width: viewMode === "list" ? 240 : "auto", flexShrink: 0, overflow: "visible" }}>
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e0f2fe, #bfdbfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🏠</div>
                      )}
                    </div>
                    <span style={{ position: "absolute", top: 10, right: 10, background: p.purpose === "بيع" ? "#0EA5E9" : "#10B981", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, fontFamily: "'Cairo', sans-serif" }}>
                      {p.purpose}
                    </span>
                    <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleLike(p.id); }}
                        style={{ width: 32, height: 32, background: "rgba(255,255,255,0.93)", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {liked.includes(p.id) ? "❤️" : "🤍"}
                      </button>
                      <button onClick={(e) => toggleCompare(e, p)}
                        style={{
                          height: 32, padding: "0 12px",
                          background: compareList.find(x => x.id === p.id) ? "#0284c7" : "rgba(255,255,255,0.93)",
                          border: "none", borderRadius: 20, cursor: "pointer",
                          fontSize: 11, fontWeight: 700, fontFamily: "'Cairo', sans-serif",
                          color: compareList.find(x => x.id === p.id) ? "#fff" : "#374151",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s", whiteSpace: "nowrap"
                        }}>
                        {compareList.find(x => x.id === p.id) ? "✓ قارن" : "قارن"}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: "16px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{p.title}</div>
                      <span style={{ fontSize: 11, background: "#F3F4F6", color: "#6B7280", padding: "2px 8px", borderRadius: 6, fontWeight: 600, flexShrink: 0, marginRight: 8 }}>{p.type}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12 }}>📍 {p.district ? `${p.district}، ` : ""}{p.city}</div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6B7280", marginBottom: 14 }}>
                      {p.rooms > 0 && <span>🛏 {p.rooms} غرف</span>}
                      {p.baths > 0 && <span>🚿 {p.baths}</span>}
                      {p.area && <span>📐 {p.area} م²</span>}
                    </div>
                    <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: 17, fontWeight: 800, color: "#16a34a" }}>{formatPrice(p.price)}</span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}> ر.س{p.purpose === "إيجار" ? "/شهر" : ""}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={(e) => e.stopPropagation()} style={{ width: 32, height: 32, background: "#F0FDF4", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>💬</button>
                        <button onClick={(e) => e.stopPropagation()} style={{ width: 32, height: 32, background: "#F0FDF4", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>📞</button>
                      </div>
                    </div>
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

      {compareToast && (
        <div style={{
          position: "fixed", bottom: 110, left: "50%",
          transform: "translateX(-50%)",
          background: "#0284c7", color: "#fff",
          borderRadius: 12, padding: "12px 24px",
          fontSize: 13, fontWeight: 700,
          fontFamily: "'Cairo', sans-serif",
          zIndex: 1001, direction: "rtl",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap"
        }}>
          ✅ تم الإضافة — اختر عقاراً آخر للمقارنة ↓
        </div>
      )}

      {compareList.length > 0 && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%",
          transform: "translateX(-50%)",
          background: "#0c4a6e", borderRadius: 20,
          padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          zIndex: 1000, direction: "rtl",
          fontFamily: "'Cairo', sans-serif"
        }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
            مقارنة ({compareList.length}/4):
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {compareList.map(p => (
              <div key={p.id} style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: "2px solid #0284c7", position: "relative" }}>
                {p.images?.[0]
                  ? <img src={p.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏠</div>
                }
                <button onClick={(e) => toggleCompare(e, p)} style={{
                  position: "absolute", top: -6, left: -6, width: 18, height: 18,
                  borderRadius: "50%", background: "#ef4444", border: "none",
                  color: "#fff", fontSize: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>×</button>
              </div>
            ))}
            {Array.from({ length: 4 - compareList.length }).map((_, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 10, border: "2px dashed rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 20 }}>+</div>
            ))}
          </div>
          <button
            onClick={() => { const ids = compareList.map(p => p.id).join(","); window.location.href = `/compare?ids=${ids}`; }}
            disabled={compareList.length < 2}
            style={{
              background: compareList.length >= 2 ? "#0284c7" : "#374151",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "10px 20px", fontSize: 13, fontWeight: 700,
              cursor: compareList.length >= 2 ? "pointer" : "not-allowed",
              fontFamily: "'Cairo', sans-serif"
            }}>
            قارن الآن ←
          </button>
          <button onClick={() => setCompareList([])} style={{
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 14px", fontSize: 12,
            cursor: "pointer", fontFamily: "'Cairo', sans-serif"
          }}>مسح</button>
        </div>
      )}
    </div>
  );
}
