"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminContractors() {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'contractor')
      .order('created_at', { ascending: false });
    setContractors(data || []);
    setLoading(false);
  };

  const toggleVerified = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ verified: !current }).eq('id', id);
    setContractors(prev => prev.map(c => c.id === id ? { ...c, verified: !current } : c));
  };

  const filtered = contractors.filter(c => {
    // مواءمة الفلتر مع حقل verified القادم من قاعدة البيانات
    const currentStatus = c.verified ? "نشط" : "موقوف";
    if (statusFilter !== "الكل" && currentStatus !== statusFilter) return false;
    if (search && !c.full_name?.includes(search)) return false;
    return true;
  });

  return (
    <div style={{ padding: "24px", fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; } tr:hover td { background: #F8F9FB; }`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "🔧", label: "إجمالي المقاولين", value: contractors.length, color: "#3B82F6", bg: "#EFF6FF" },
          { icon: "✅", label: "نشطون", value: contractors.filter(c => c.verified).length, color: "#16a34a", bg: "#F0FDF4" },
          { icon: "🏆", label: "موثقون", value: contractors.filter(c => c.verified).length, color: "#F59E0B", bg: "#FFFBEB" },
          { icon: "⏸️", label: "موقوفون", value: contractors.filter(c => !c.verified).length, color: "#EF4444", bg: "#FFF5F5" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
            <div><div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div><div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "14px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", gap: 10, alignItems: "center" }}>
        <input placeholder="🔍 بحث باسم المقاول أو المالك..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Cairo'", color: "#374151", background: "#FAFAFA", outline: "none" }} />
        {["الكل", "نشط", "موقوف"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid", borderColor: statusFilter === s ? "#16a34a" : "#E5E7EB", background: statusFilter === s ? "#16a34a" : "#fff", color: statusFilter === s ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo'" }}>{s}</button>
        ))}
        <button onClick={() => setShowModal(true)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", boxShadow: "0 4px 12px rgba(22,163,74,0.3)", whiteSpace: "nowrap" }}>+ إضافة مقاول</button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB" }}>
              {["المقاول", "التخصص", "المدينة", "التقييم", "المشاريع", "الباقة", "موثق", "الحالة", "إجراءات"].map((h, i) => (
                <th key={i} style={{ padding: "13px 14px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{c.full_name?.[0] || "م"}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{c.full_name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{c.phone || "—"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px", fontSize: 12, color: "#374151" }}>مقاول</td>
                <td style={{ padding: "14px", fontSize: 12, color: "#374151" }}>{c.city || "—"}</td>
                <td style={{ padding: "14px" }}><span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>⭐ —</span></td>
                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "center" }}>—</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: c.has_package ? "#F0FDF4" : "#F3F4F6", color: c.has_package ? "#16a34a" : "#6B7280" }}>
                    {c.has_package ? "مشترك" : "بدون باقة"}
                  </span>
                </td>
                <td style={{ padding: "14px", textAlign: "center" }}>
                  <button onClick={() => toggleVerified(c.id, c.verified)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>
                    {c.verified ? "✅" : "⬜"}
                  </button>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: c.verified ? "#DCFCE7" : "#FEF9C3", color: c.verified ? "#16a34a" : "#92400E" }}>
                    {c.verified ? "نشط" : "معلق"}
                  </span>
                </td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleVerified(c.id, c.verified)} style={{ background: c.verified ? "#FEF9C3" : "#DCFCE7", color: c.verified ? "#92400E" : "#16a34a", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>
                      {c.verified ? "⏸ إيقاف" : "▶ تفعيل"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <div style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}><div style={{ fontSize: 48 }}>🔧</div><p style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>لا توجد نتائج</p></div>}
      </div>
    </div>
  );
}