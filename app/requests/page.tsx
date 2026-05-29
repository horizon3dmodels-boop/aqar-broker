"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const types = ["الكل", "عقار", "مقاول", "مكتب هندسي"];
const typeIcons: Record<string, string> = {
  "عقار": "🏠", "مقاول": "🔧", "مكتب هندسي": "📐"
};
const typeColors: Record<string, string> = {
  "عقار": "#16a34a", "مقاول": "#F59E0B", "مكتب هندسي": "#7C3AED"
};
const typeBg: Record<string, string> = {
  "عقار": "#F0FDF4", "مقاول": "#FFFBEB", "مكتب هندسي": "#F5F3FF"
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("الكل");
  const [selectedCity, setSelectedCity] = useState("الكل");
  const [cities, setCities] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);
      await fetchRequests();
    };
    init();
  }, []);

  const fetchRequests = async (type = "الكل", city = "الكل") => {
    setLoading(true);
    let query = supabase
      .from("requests")
      .select("*, profiles!requests_user_id_fkey(full_name, phone, avatar_url, role)")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (type !== "الكل") query = query.eq("type", type);
    if (city !== "الكل") query = query.eq("city", city);
    const { data } = await query;
    setRequests(data || []);

    // جلب المدن المتاحة
    const uniqueCities = [...new Set((data || []).map((r: any) => r.city).filter(Boolean))];
    setCities(uniqueCities);
    setLoading(false);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    fetchRequests(type, selectedCity);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    fetchRequests(selectedType, city);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000 / 60);
    if (diff < 60) return `منذ ${diff} دقيقة`;
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
    return `منذ ${Math.floor(diff / 1440)} يوم`;
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .card-hover { transition: all 0.25s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 16px 32px rgba(0,0,0,0.1) !important; }
        .filter-btn { transition: all 0.2s; cursor: pointer; }
        .filter-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>📋 لوحة الطلبات</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>اعرض طلبك وتواصل مع المختصين مباشرة</p>
          </div>
          <button
            onClick={() => currentUser ? router.push("/requests/new") : router.push("/auth/login")}
            style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 14px rgba(22,163,74,0.4)" }}>
            + أضف طلبك
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px" }}>

        {/* الفلاتر */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

          {/* فلتر النوع */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {types.map(t => (
              <button key={t} onClick={() => handleTypeChange(t)} className="filter-btn" style={{
                padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                borderColor: selectedType === t ? "#0f172a" : "#E5E7EB",
                background: selectedType === t ? "#0f172a" : "#fff",
                color: selectedType === t ? "#fff" : "#6B7280",
                fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif",
              }}>
                {t === "الكل" ? "🗂️ الكل" : `${typeIcons[t]} ${t}`}
              </button>
            ))}
          </div>

          {/* فلتر المدينة */}
          {cities.length > 0 && (
            <select value={selectedCity} onChange={(e) => handleCityChange(e.target.value)}
              style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff", cursor: "pointer" }}>
              <option value="الكل">📍 كل المدن</option>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
          )}

          <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600, marginRight: "auto" }}>
            {loading ? "جاري التحميل..." : `${requests.length} طلب`}
          </span>
        </div>

        {/* القائمة */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 18, height: 200, border: "1px solid #F0F0F0" }}>
                <div style={{ padding: 20 }}>
                  <div style={{ height: 16, background: "#F3F4F6", borderRadius: 8, marginBottom: 10 }} />
                  <div style={{ height: 12, background: "#F3F4F6", borderRadius: 8, width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>لا توجد طلبات حالياً</p>
            <p style={{ fontSize: 13 }}>كن أول من يضيف طلبه!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {requests.map((r) => (
              <div key={r.id} className="card-hover"
                onClick={() => router.push(`/requests/${r.id}`)}
                style={{
                background: "#fff", borderRadius: 18,
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                border: `1.5px solid ${typeColors[r.type] || "#E5E7EB"}22`,
                overflow: "hidden", cursor: "pointer"
              }}>
                {/* Header */}
                <div style={{ background: typeBg[r.type] || "#F8F9FB", padding: "14px 18px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ background: typeColors[r.type] || "#6B7280", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
                    {typeIcons[r.type]} {r.type}
                  </span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{formatTime(r.created_at)}</span>
                </div>

                {/* المحتوى */}
                <div style={{ padding: "18px" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{r.title}</h3>
                  {r.description && (
                    <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {r.description}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    {r.budget && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: typeColors[r.type] || "#374151", background: typeBg[r.type] || "#F8F9FB", padding: "4px 10px", borderRadius: 20 }}>
                        💰 {Number(r.budget).toLocaleString("ar-SA")} ر.س
                      </span>
                    )}
                    {r.city && (
                      <span style={{ fontSize: 12, color: "#6B7280", background: "#F8F9FB", padding: "4px 10px", borderRadius: 20 }}>
                        📍 {r.city}
                      </span>
                    )}
                  </div>

                  {/* صاحب الطلب */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #0f172a, #1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {r.profiles?.avatar_url ? (
                          <img src={r.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{r.profiles?.full_name?.[0] || "م"}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{r.profiles?.full_name || "مستخدم"}</span>
                    </div>

                    {/* أزرار التواصل */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {r.phone && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${r.phone}`, "_blank"); }}
                          style={{ width: 34, height: 34, background: "#25D366", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.535 5.849L.057 23.985l6.284-1.648A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 01-5.031-1.371l-.361-.214-3.732.979 1.001-3.648-.235-.374A9.86 9.86 0 012.1 12c0-5.464 4.436-9.9 9.9-9.9s9.9 4.436 9.9 9.9-4.436 9.9-9.9 9.9z"/>
                          </svg>
                        </button>
                      )}
                      {r.phone && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${r.phone}`; }}
                          style={{ width: 34, height: 34, background: "#0284c7", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>
                          📞
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); currentUser ? router.push(`/messages?user=${r.user_id}`) : router.push("/auth/login"); }}
                        style={{ width: 34, height: 34, background: "#2563EB", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>
                        💬
                      </button>
                    </div>
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
