"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const statusConfig = {
  active: { label: "نشطة", bg: "#F0FDF4", color: "#16a34a", border: "#BBF7D0" },
  expired: { label: "منتهية", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  pending: { label: "قيد المراجعة", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  rejected: { label: "مرفوضة", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
};

const typeConfig = {
  broker: { label: "وسيط عقاري", color: "#2563EB", bg: "#EFF6FF" },
  contractor: { label: "مقاول", color: "#D97706", bg: "#FFFBEB" },
  engineer: { label: "مهندس", color: "#7C3AED", bg: "#F5F3FF" },
};

const filters = ["الكل", "نشطة", "منتهية", "قيد المراجعة", "مرفوضة"];

export default function AdminLicensesPage() {
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [search, setSearch] = useState("");
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or('fal_license.neq.null,commercial_register.neq.null')
      .order('created_at', { ascending: false });
    setLicenses(data || []);
    setLoading(false);
  };

  const updateVerified = async (id: string, verified: boolean) => {
    await supabase.from('profiles').update({ verified }).eq('id', id);
    setLicenses(prev => prev.map(l => l.id === id ? { ...l, verified } : l));
  };

  const filtered = licenses.filter((l) => {
    const matchSearch = l.full_name?.includes(search) || l.fal_license?.includes(search) || l.commercial_register?.includes(search);
    const matchFilter =
      activeFilter === "الكل" ||
      (activeFilter === "نشطة" && l.verified) ||
      (activeFilter === "قيد المراجعة" && !l.verified);
    return matchSearch && matchFilter;
  });

  const stats = [
    { label: "إجمالي التراخيص", value: licenses.length, color: "#2563EB", bg: "#EFF6FF", icon: "📋" },
    { label: "نشطة", value: licenses.filter(l => l.verified).length, color: "#16a34a", bg: "#F0FDF4", icon: "✅" },
    { label: "وسطاء", value: licenses.filter(l => l.role === "broker").length, color: "#D97706", bg: "#FFFBEB", icon: "🤝" },
    { label: "قيد المراجعة", value: licenses.filter(l => !l.verified).length, color: "#D97706", bg: "#FFFBEB", icon: "⏳" },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; } .row:hover { background: #F8FAFF !important; } .row { transition: background 0.15s; } .filter-btn { transition: all 0.15s; cursor: pointer; }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 4 }}>إدارة التراخيص</h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>مراجعة وإدارة تراخيص الوسطاء والمقاولين والمهندسين</p>
        </div>
        <button style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
          + إضافة ترخيص
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", border: "1px solid #F0F0F0", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className="filter-btn" style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", fontSize: 12, fontWeight: 700, fontFamily: "'Cairo', sans-serif", background: activeFilter === f ? "#0f172a" : "#fff", color: activeFilter === f ? "#fff" : "#374151", borderColor: activeFilter === f ? "#0f172a" : "#E5E7EB" }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ padding: "8px 32px 8px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", width: 220, outline: "none" }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB", borderBottom: "1px solid #F0F0F0" }}>
              {["المستخدم", "نوع الترخيص", "رقم الترخيص", "تاريخ الإصدار", "تاريخ الانتهاء", "الحالة", "الإجراءات"].map((h, i) => (
                <th key={i} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</td></tr>
            ) : filtered.map((l) => (
              <tr key={l.id} className="row" style={{ borderBottom: "1px solid #F8F9FB", background: "#fff" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: "#EFF6FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2563EB" }}>
                      {l.full_name?.[0] || "؟"}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{l.full_name || "—"}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ background: l.role === "broker" ? "#EFF6FF" : l.role === "contractor" ? "#FFFBEB" : "#F5F3FF", color: l.role === "broker" ? "#2563EB" : l.role === "contractor" ? "#D97706" : "#7C3AED", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                    {l.role === "broker" ? "وسيط عقاري" : l.role === "contractor" ? "مقاول" : "مهندس"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: "monospace" }}>
                  {l.fal_license || l.commercial_register || "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>
                  {l.created_at ? new Date(l.created_at).toLocaleDateString('ar-SA') : "—"}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>—</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ background: l.verified ? "#F0FDF4" : "#FFFBEB", color: l.verified ? "#16a34a" : "#D97706", border: `1px solid ${l.verified ? "#BBF7D0" : "#FDE68A"}`, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                    {l.verified ? "نشطة" : "قيد المراجعة"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!l.verified && (
                      <button onClick={() => updateVerified(l.id, true)} style={{ background: "#F0FDF4", color: "#16a34a", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>✅ قبول</button>
                    )}
                    {l.verified && (
                      <button onClick={() => updateVerified(l.id, false)} style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>🚫 إيقاف</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}