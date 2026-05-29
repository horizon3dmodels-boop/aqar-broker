"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminEngineering() {
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'engineer')
      .order('created_at', { ascending: false });
    setOffices(data || []);
    setLoading(false);
  };

  const toggleVerified = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ verified: !current }).eq('id', id);
    setOffices(prev => prev.map(o => o.id === id ? { ...o, verified: !current } : o));
  };

  const filtered = offices.filter(o => {
    const currentStatus = o.verified ? "نشط" : "موقوف";
    if (statusFilter !== "الكل" && currentStatus !== statusFilter) return false;
    // تم الإبقاء على فلتر التخصص عاما بانتظار هيكلة الحقول الإضافية بجدول المبروفايل
    if (specFilter !== "الكل") return false; 
    if (search && !o.full_name?.includes(search)) return false;
    return true;
  });

  return (
    <div style={{ padding: "24px", fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; } tr:hover td { background: #F8F9FB; }`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "📐", label: "إجمالي المكاتب", value: offices.length, color: "#8B5CF6", bg: "#F5F3FF" },
          { icon: "✅", label: "نشطة", value: offices.filter(o => o.verified).length, color: "#16a34a", bg: "#F0FDF4" },
          { icon: "🏆", label: "موثقة", value: offices.filter(o => o.verified).length, color: "#F59E0B", bg: "#FFFBEB" },
          { icon: "📋", label: "إجمالي المشاريع", value: "—", color: "#3B82F6", bg: "#EFF6FF" },
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
        <select value={specFilter} onChange={e => setSpecFilter(e.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontFamily: "'Cairo'", color: "#374151", background: "#fff" }}>
          <option>الكل</option>
        </select>
        {["الكل", "نشط", "موقوف"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid", borderColor: statusFilter === s ? "#8B5CF6" : "#E5E7EB", background: statusFilter === s ? "#8B5CF6" : "#fff", color: statusFilter === s ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo'" }}>{s}</button>
        ))}
        <button style={{ background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", whiteSpace: "nowrap" }}>+ إضافة مكتب</button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB" }}>
              {["المكتب", "التخصص", "المدينة", "التقييم", "المشاريع", "الرخصة", "الباقة", "موثق", "الحالة", "إجراءات"].map((h, i) => (
                <th key={i} style={{ padding: "13px 12px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</td></tr>
            ) : filtered.map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#8B5CF6" }}>{o.full_name?.[0] || "م"}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{o.full_name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{o.phone || "—"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px" }}><span style={{ background: "#F5F3FF", color: "#8B5CF6", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>مكتب هندسي</span></td>
                <td style={{ padding: "14px", fontSize: 12, color: "#374151" }}>{o.city || "—"}</td>
                <td style={{ padding: "14px" }}><span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>⭐ —</span></td>
                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "center" }}>—</td>
                <td style={{ padding: "14px" }}>
                  {o.engineering_license
                    ? <span style={{ background: "#F0FDF4", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>✅ {o.engineering_license}</span>
                    : <span style={{ background: "#FFF5F5", color: "#EF4444", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>❌ غير مرخص</span>
                  }
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: o.has_package ? "#F0FDF4" : "#F3F4F6", color: o.has_package ? "#16a34a" : "#6B7280" }}>
                    {o.has_package ? "مشترك" : "بدون باقة"}
                  </span>
                </td>
                <td style={{ padding: "14px", textAlign: "center" }}>
                  <button onClick={() => toggleVerified(o.id, o.verified)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>
                    {o.verified ? "✅" : "⬜"}
                  </button>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: o.verified ? "#DCFCE7" : "#FEF9C3", color: o.verified ? "#16a34a" : "#92400E" }}>
                    {o.verified ? "نشط" : "معلق"}
                  </span>
                </td>
                <td style={{ padding: "14px" }}>
                  <button onClick={() => toggleVerified(o.id, o.verified)} style={{ background: o.verified ? "#FEF9C3" : "#DCFCE7", color: o.verified ? "#92400E" : "#16a34a", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>
                    {o.verified ? "⏸" : "▶"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}><div style={{ fontSize: 48 }}>📐</div><p style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>لا توجد نتائج</p></div>}
      </div>
    </div>
  );
}