"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDailyRent() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("الكل");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*, profiles!properties_user_id_fkey(full_name)')
      .eq('purpose', 'إيجار يومي')
      .order('created_at', { ascending: false });
    setListings(data || []);
    setLoading(false);
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'inactive' : 'active';
    await supabase.from('properties').update({ status: newStatus }).eq('id', id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  const deleteListing = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return;
    await supabase.from('properties').delete().eq('id', id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const filtered = listings.filter(l => {
    if (typeFilter !== "الكل" && l.type !== typeFilter) return false;
    if (search && !l.title?.includes(search) && !l.profiles?.full_name?.includes(search)) return false;
    return true;
  });

  return (
    <div style={{ padding: "24px", fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; } tr:hover td { background: #F8F9FB; }`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "🌴", label: "إجمالي الوحدات", value: listings.length, color: "#0EA5E9", bg: "#F0F9FF" },
          { icon: "✅", label: "نشطة", value: listings.filter(l => l.status === "active").length, color: "#16a34a", bg: "#F0FDF4" },
          { icon: "📅", label: "إجمالي الحجوزات", value: "—", color: "#F59E0B", bg: "#FFFBEB" },
          { icon: "⭐", label: "متوسط التقييم", value: "—", color: "#8B5CF6", bg: "#F5F3FF" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
            <div><div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div><div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "14px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="🔍 بحث بالاسم أو المالك..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Cairo'", color: "#374151", background: "#FAFAFA", outline: "none" }} />
        {["الكل", "استراحة", "شاليه", "غرفة فندقية", "شقة مفروشة"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", borderColor: typeFilter === t ? "#0EA5E9" : "#E5E7EB", background: typeFilter === t ? "#0EA5E9" : "#fff", color: typeFilter === t ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo'", whiteSpace: "nowrap" }}>{t}</button>
        ))}
        <button style={{ background: "#0EA5E9", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", whiteSpace: "nowrap" }}>+ إضافة وحدة</button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB" }}>
              {["الوحدة", "النوع", "المدينة", "السعر/ليلة", "الضيوف", "الحجوزات", "التقييم", "الحالة", "إجراءات"].map((h, i) => (
                <th key={i} style={{ padding: "13px 14px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</td></tr>
            ) : filtered.map(l => (
              <tr key={l.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                      <img src={l.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=80&q=80"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{l.profiles?.full_name || "—"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px" }}><span style={{ background: "#F0F9FF", color: "#0EA5E9", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{l.type}</span></td>
                <td style={{ padding: "14px", fontSize: 12, color: "#374151" }}>{l.city}</td>
                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{Number(l.price)?.toLocaleString()} ر.س</td>
                <td style={{ padding: "14px", fontSize: 13, color: "#374151", textAlign: "center" }}>—</td>
                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "center" }}>—</td>
                <td style={{ padding: "14px" }}><span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>⭐ —</span></td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: l.status === "active" ? "#DCFCE7" : "#F3F4F6", color: l.status === "active" ? "#16a34a" : "#6B7280" }}>
                    {l.status === "active" ? "نشط" : "موقوف"}
                  </span>
                </td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleStatus(l.id, l.status)} style={{ background: l.status === "active" ? "#FEF9C3" : "#DCFCE7", color: l.status === "active" ? "#92400E" : "#16a34a", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>
                      {l.status === "active" ? "⏸" : "▶"}
                    </button>
                    <button onClick={() => deleteListing(l.id)} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}><div style={{ fontSize: 48 }}>🌴</div><p style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>لا توجد نتائج</p></div>}
      </div>
    </div>
  );
}