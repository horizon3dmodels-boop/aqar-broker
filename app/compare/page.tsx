"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    if (ids.length === 0) { setLoading(false); return; }
    supabase.from("properties").select("*").in("id", ids).then(({ data }) => {
      setProperties(data || []);
      setLoading(false);
    });
  }, [searchParams]);

  const formatPrice = (price: number) => price?.toLocaleString("ar-SA") || "—";
  const val = (v: any, suffix = "") => v ? `${v}${suffix}` : "—";

  const rows = [
    { label: "السعر", icon: "💰", render: (p: any) => `${formatPrice(p.price)} ر.س${p.purpose === "إيجار" ? "/شهر" : ""}` },
    { label: "الغرض", icon: "🎯", render: (p: any) => val(p.purpose) },
    { label: "النوع", icon: "🏷️", render: (p: any) => val(p.type) },
    { label: "المدينة", icon: "📍", render: (p: any) => `${p.district ? p.district + "، " : ""}${p.city || "—"}` },
    { label: "المساحة", icon: "📐", render: (p: any) => val(p.area, " م²") },
    { label: "الغرف", icon: "🛏", render: (p: any) => p.rooms > 0 ? `${p.rooms} غرف` : "—" },
    { label: "الحمامات", icon: "🚿", render: (p: any) => p.baths > 0 ? `${p.baths}` : "—" },
    { label: "سعر المتر", icon: "📊", render: (p: any) => p.price && p.area ? `${formatPrice(Math.round(p.price / p.area))} ر.س` : "—" },
    { label: "المميزات", icon: "✨", render: (p: any) => p.features?.length > 0 ? p.features.slice(0, 4).join("، ") : "—" },
    { label: "تاريخ الإضافة", icon: "📅", render: (p: any) => p.created_at ? new Date(p.created_at).toLocaleDateString("ar-SA") : "—" },
  ];

  // Best value highlights
  const cheapest = properties.length > 1 ? properties.reduce((a, b) => (a.price < b.price ? a : b), properties[0]) : null;
  const largestArea = properties.length > 1 ? properties.reduce((a, b) => ((a.area || 0) > (b.area || 0) ? a : b), properties[0]) : null;
  const bestPricePerMeter = properties.length > 1
    ? properties.filter(p => p.price && p.area).reduce((a, b) =>
        (a.price / a.area < b.price / b.area ? a : b), properties.find(p => p.price && p.area) || properties[0])
    : null;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F0F4F8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .badge-animate { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .row-hover:hover { background: #EFF6FF !important; }
        .card-in { animation: slideUp 0.4s ease both; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .back-btn:hover { background: #1d4ed8 !important; }
        .prop-btn:hover { background: #0f766e !important; color: #fff !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => router.back()} className="back-btn"
              style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", transition: "background 0.2s" }}>
              ← رجوع
            </button>
            <div>
              <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 2 }}>⚖️ مقارنة العقارات</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                {loading ? "جاري التحميل..." : `مقارنة ${properties.length} عقار`}
              </p>
            </div>
          </div>
          <button onClick={() => router.push("/properties")}
            style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
            + إضافة عقار
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <p style={{ fontSize: 16, color: "#6B7280", fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>جاري تحميل العقارات...</p>
        </div>
      ) : properties.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64 }}>🏠</div>
          <p style={{ fontSize: 18, color: "#374151", fontWeight: 800, fontFamily: "'Cairo', sans-serif" }}>لم يتم اختيار عقارات للمقارنة</p>
          <button onClick={() => router.push("/properties")}
            style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", marginTop: 8 }}>
            تصفح العقارات
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>

          {/* بطاقات الميداليات */}
          {properties.length > 1 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
              {cheapest && (
                <div className="badge-animate" style={{ background: "#fff", borderRadius: 14, padding: "12px 18px", border: "2px solid #fbbf24", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🥇</span>
                  <div>
                    <p style={{ fontSize: 11, color: "#92400e", fontWeight: 700 }}>الأقل سعراً</p>
                    <p style={{ fontSize: 13, color: "#0f172a", fontWeight: 800 }}>{cheapest.title?.slice(0, 30)}</p>
                  </div>
                </div>
              )}
              {largestArea && largestArea.area && (
                <div className="badge-animate" style={{ background: "#fff", borderRadius: 14, padding: "12px 18px", border: "2px solid #34d399", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>📐</span>
                  <div>
                    <p style={{ fontSize: 11, color: "#065f46", fontWeight: 700 }}>الأوسع مساحةً</p>
                    <p style={{ fontSize: 13, color: "#0f172a", fontWeight: 800 }}>{largestArea.title?.slice(0, 30)}</p>
                  </div>
                </div>
              )}
              {bestPricePerMeter && bestPricePerMeter.area && (
                <div className="badge-animate" style={{ background: "#fff", borderRadius: 14, padding: "12px 18px", border: "2px solid #818cf8", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>💎</span>
                  <div>
                    <p style={{ fontSize: 11, color: "#3730a3", fontWeight: 700 }}>أفضل سعر للمتر</p>
                    <p style={{ fontSize: 13, color: "#0f172a", fontWeight: 800 }}>{bestPricePerMeter.title?.slice(0, 30)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* جدول المقارنة */}
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #E5E7EB" }}>

            {/* رؤوس الأعمدة — صور العقارات */}
            <div style={{ display: "grid", gridTemplateColumns: `220px repeat(${properties.length}, 1fr)`, borderBottom: "2px solid #F0F0F0" }}>
              {/* خلية فارغة */}
              <div style={{ background: "#F8F9FB", padding: "20px", borderLeft: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 28 }}>⚖️</span>
              </div>

              {properties.map((p, i) => (
                <div key={p.id} className="card-in" style={{
                  padding: "0",
                  borderLeft: i > 0 ? "1px solid #F0F0F0" : "none",
                  animationDelay: `${i * 0.1}s`,
                  position: "relative"
                }}>
                  {/* صورة العقار */}
                  <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🏠</div>
                    )}
                    {/* شارة الغرض */}
                    <span style={{
                      position: "absolute", top: 10, right: 10,
                      background: p.purpose === "بيع" ? "#0EA5E9" : "#10B981",
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 100
                    }}>{p.purpose}</span>
                    {/* شارة الميدالية */}
                    {cheapest?.id === p.id && properties.length > 1 && (
                      <span style={{ position: "absolute", top: 10, left: 10, background: "#fbbf24", color: "#78350f", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 100 }}>🥇 الأرخص</span>
                    )}
                  </div>
                  {/* معلومات مختصرة */}
                  <div style={{ padding: "14px 16px", borderTop: "1px solid #F0F0F0" }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 4, lineHeight: 1.4 }}>{p.title}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>📍 {p.city}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => router.push(`/properties/${p.id}`)} className="prop-btn"
                        style={{ flex: 1, background: "#F0FDF4", color: "#16a34a", border: "1px solid #BBF7D0", borderRadius: 8, padding: "7px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", transition: "all 0.2s" }}>
                        عرض التفاصيل
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* صفوف المقارنة */}
            {rows.map((row, ri) => (
              <div key={ri} className="row-hover" style={{
                display: "grid",
                gridTemplateColumns: `220px repeat(${properties.length}, 1fr)`,
                borderBottom: ri < rows.length - 1 ? "1px solid #F8F8F8" : "none",
                transition: "background 0.15s"
              }}>
                {/* عنوان الصف */}
                <div style={{
                  background: "#F8F9FB", padding: "16px 20px",
                  borderLeft: "1px solid #F0F0F0",
                  display: "flex", alignItems: "center", gap: 10
                }}>
                  <span style={{ fontSize: 18 }}>{row.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{row.label}</span>
                </div>

                {/* قيم كل عقار */}
                {properties.map((p, pi) => {
                  const value = row.render(p);
                  // تمييز السعر الأقل
                  const isLowest = row.label === "السعر" && cheapest?.id === p.id && properties.length > 1;
                  const isLargest = row.label === "المساحة" && largestArea?.id === p.id && properties.length > 1 && p.area;
                  const isBestMeter = row.label === "سعر المتر" && bestPricePerMeter?.id === p.id && properties.length > 1 && p.area;
                  const highlighted = isLowest || isLargest || isBestMeter;

                  return (
                    <div key={p.id} style={{
                      padding: "16px 20px",
                      borderLeft: pi > 0 ? "1px solid #F0F0F0" : "none",
                      display: "flex", alignItems: "center",
                      background: highlighted ? "#F0FFF4" : "transparent"
                    }}>
                      <span style={{
                        fontSize: 13, fontWeight: highlighted ? 800 : 500,
                        color: highlighted ? "#15803d" : "#374151",
                        display: "flex", alignItems: "center", gap: 6
                      }}>
                        {highlighted && <span style={{ fontSize: 14 }}>{isLowest ? "🥇" : isLargest ? "📐" : "💎"}</span>}
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* زر العودة للبحث */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button onClick={() => router.push("/properties")}
              style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 14, padding: "14px 36px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              🔍 البحث عن عقارات أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
