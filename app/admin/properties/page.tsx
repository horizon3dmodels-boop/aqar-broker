"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminProperties() {
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [typeFilter, setTypeFilter] = useState("الكل");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*, profiles!properties_user_id_fkey(full_name, role)')
      .order('created_at', { ascending: false });
    setProperties(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('properties').update({ status }).eq('id', id);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const deleteProperty = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const filtered = properties.filter((p) => {
    // ملاحظة: تم تعديل قيم الفلترة لتطابق البيانات من Supabase
    if (statusFilter !== "الكل" && p.status !== (statusFilter === "نشط" ? "active" : statusFilter === "معلق" ? "pending" : "rejected")) return false;
    if (typeFilter !== "الكل" && p.type !== typeFilter) return false;
    if (searchText && !p.title?.includes(searchText) && !p.profiles?.full_name?.includes(searchText)) return false;
    return true;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  return (
    <div style={{ padding: "24px" }}>
      <style>{`input:focus, select:focus { border-color: #16a34a !important; outline: none; } tr:hover td { background: #F8F9FB; }`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "إجمالي الإعلانات", value: properties.length, color: "#3B82F6", bg: "#EFF6FF", icon: "🏠" },
          { label: "نشط", value: properties.filter(p => p.status === "active").length, color: "#16a34a", bg: "#F0FDF4", icon: "✅" },
          { label: "معلق للمراجعة", value: properties.filter(p => p.status === "pending").length, color: "#F59E0B", bg: "#FFFBEB", icon: "⏳" },
          { label: "مرفوض", value: properties.filter(p => p.status === "rejected").length, color: "#EF4444", bg: "#FFF5F5", icon: "❌" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input type="text" placeholder="🔍 بحث بالعنوان أو المستخدم..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ flex: 1, minWidth: 200, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff" }}>
          {["الكل", "نشط", "معلق", "مرفوض"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff" }}>
          {["الكل", "فيلا", "شقة", "أرض", "دوبلكس", "مكتب"].map((t) => <option key={t}>{t}</option>)}
        </select>
        {selected.length > 0 && (
          <>
            <button onClick={() => selected.forEach(id => updateStatus(id, "active"))} style={{ background: "#DCFCE7", color: "#16a34a", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>✅ قبول ({selected.length})</button>
            <button onClick={() => selected.forEach(id => updateStatus(id, "rejected"))} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>❌ رفض ({selected.length})</button>
          </>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB" }}>
              <th style={{ padding: "14px", width: 40 }}>
                <input type="checkbox" onChange={(e) => setSelected(e.target.checked ? filtered.map(p => p.id) : [])} style={{ accentColor: "#16a34a", width: 15, height: 15 }} />
              </th>
              {["العقار", "المستخدم", "النوع", "السعر", "رقم الرخصة", "المشاهدات", "الحالة", "التاريخ", "إجراءات"].map((h, i) => (
                <th key={i} style={{ padding: "14px 12px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                <td style={{ padding: "14px", textAlign: "center" }}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} style={{ accentColor: "#16a34a", width: 15, height: 15 }} />
                </td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <img src={p.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&q=80"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>📍 {p.district}، {p.city}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{p.profiles?.full_name || "—"}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{p.profiles?.role || "—"}</div>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ background: "#F3F4F6", color: "#374151", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{p.type}</span>
                </td>
                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{Number(p.price)?.toLocaleString()} ر.س</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ background: "#F0F9FF", color: "#0EA5E9", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{p.rega_number || "—"}</span>
                </td>
                <td style={{ padding: "14px", fontSize: 13, color: "#6B7280" }}>👁️ —</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: p.status === "active" ? "#DCFCE7" : p.status === "pending" ? "#FEF9C3" : "#FFF5F5", color: p.status === "active" ? "#16a34a" : p.status === "pending" ? "#92400E" : "#EF4444" }}>
                    {p.status === "active" ? "نشط" : p.status === "pending" ? "معلق" : "مرفوض"}
                  </span>
                </td>
                <td style={{ padding: "14px", fontSize: 12, color: "#9CA3AF" }}>{new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {p.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(p.id, "active")} style={{ background: "#DCFCE7", color: "#16a34a", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>✅</button>
                        <button onClick={() => updateStatus(p.id, "rejected")} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>❌</button>
                      </>
                    )}
                    {p.status === "active" && (
                      <button onClick={() => updateStatus(p.id, "pending")} style={{ background: "#FEF9C3", color: "#92400E", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>⏸</button>
                    )}
                    <button onClick={() => window.open(`/properties/${p.id}`, '_blank')} style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>👁️</button>
                    <button onClick={() => deleteProperty(p.id)} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>عرض {filtered.length} من {properties.length} إعلان</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map((p) => (
              <button key={p} style={{ width: 34, height: 34, border: "1.5px solid", borderColor: p === 1 ? "#16a34a" : "#E5E7EB", borderRadius: 8, background: p === 1 ? "#16a34a" : "#fff", color: p === 1 ? "#fff" : "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}