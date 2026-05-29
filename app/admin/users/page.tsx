"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const roleColors: Record<string, { bg: string; color: string }> = {
  "وسيط": { bg: "#EFF6FF", color: "#3B82F6" },
  "مالك": { bg: "#F0FDF4", color: "#16a34a" },
  "مقاول": { bg: "#FFFBEB", color: "#F59E0B" },
  "مكتب هندسي": { bg: "#F5F3FF", color: "#8B5CF6" },
  "باحث": { bg: "#F8F9FB", color: "#6B7280" },
};

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, verified: boolean) => {
    await supabase.from('profiles').update({ verified }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, verified } : u));
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "الكل" && u.role !== roleFilter) return false;
    if (statusFilter === "موثّق" && !u.verified) return false;
    if (statusFilter === "معلق" && u.verified) return false;
    if (searchText && !u.full_name?.includes(searchText) && !u.phone?.includes(searchText)) return false;
    return true;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  return (
    <div style={{ padding: "24px" }}>
      <style>{`input:focus, select:focus { border-color: #16a34a !important; outline: none; } tr:hover td { background: #F8F9FB; } .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; }`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "إجمالي", value: users.length, color: "#3B82F6", bg: "#EFF6FF", icon: "👥" },
          { label: "وسطاء", value: users.filter(u => u.role === "broker").length, color: "#3B82F6", bg: "#EFF6FF", icon: "🤝" },
          { label: "ملاك", value: users.filter(u => u.role === "owner").length, color: "#16a34a", bg: "#F0FDF4", icon: "🏠" },
          { label: "مقاولون", value: users.filter(u => u.role === "contractor").length, color: "#F59E0B", bg: "#FFFBEB", icon: "🔧" },
          { label: "بانتظار التوثيق", value: users.filter(u => !u.verified).length, color: "#EF4444", bg: "#FFF5F5", icon: "⏳" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: s.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input type="text" placeholder="🔍 بحث بالاسم أو الجوال..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ flex: 1, minWidth: 200, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff" }}>
          {["الكل", "broker", "owner", "contractor", "engineer", "visitor"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff" }}>
          {["الكل", "موثّق", "معلق"].map((s) => <option key={s}>{s}</option>)}
        </select>
        {selected.length > 0 && (
          <>
            <button onClick={() => selected.forEach(id => updateStatus(id, true))} style={{ background: "#DCFCE7", color: "#16a34a", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>✅ توثيق ({selected.length})</button>
            <button onClick={() => selected.forEach(id => updateStatus(id, false))} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>🚫 إيقاف ({selected.length})</button>
          </>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB" }}>
              <th style={{ padding: "14px", width: 40 }}>
                <input type="checkbox" onChange={(e) => setSelected(e.target.checked ? filtered.map(u => u.id) : [])} style={{ accentColor: "#16a34a", width: 15, height: 15 }} />
              </th>
              {["المستخدم", "الدور", "رقم الترخيص", "الإعلانات", "الصفقات", "الحالة", "تاريخ الانضمام", "إجراءات"].map((h, i) => (
                <th key={i} style={{ padding: "14px 12px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                <td style={{ padding: "14px", textAlign: "center" }}>
                  <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ accentColor: "#16a34a", width: 15, height: 15 }} />
                </td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{u.full_name?.[0] || "؟"}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.full_name || "—"} {u.verified && <span style={{ fontSize: 10, color: "#16a34a" }}>✓</span>}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{u.phone || "—"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: roleColors[u.role]?.bg || "#F8F9FB", color: roleColors[u.role]?.color || "#6B7280" }}>{u.role || "—"}</span>
                </td>
                <td style={{ padding: "14px" }}>
                  {u.fal_license ? <span style={{ background: "#F0F9FF", color: "#0EA5E9", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{u.fal_license}</span> : <span style={{ color: "#9CA3AF", fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "center" }}>—</td>
                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "center" }}>—</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: u.verified ? "#DCFCE7" : "#FEF9C3", color: u.verified ? "#16a34a" : "#92400E" }}>
                    {u.verified ? "موثّق" : "معلق"}
                  </span>
                </td>
                <td style={{ padding: "14px", fontSize: 12, color: "#9CA3AF" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('ar-SA') : "—"}</td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => setShowModal(u)} style={{ background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>👁️</button>
                    {!u.verified && <button onClick={() => updateStatus(u.id, true)} style={{ background: "#DCFCE7", color: "#16a34a", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>✅</button>}
                    {u.verified && <button onClick={() => updateStatus(u.id, false)} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>🚫</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>عرض {filtered.length} من {users.length} مستخدم</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map((p) => (
              <button key={p} style={{ width: 34, height: 34, border: "1.5px solid", borderColor: p === 1 ? "#16a34a" : "#E5E7EB", borderRadius: 8, background: p === 1 ? "#16a34a" : "#fff", color: p === 1 ? "#fff" : "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "32px", width: 480, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>تفاصيل المستخدم</h3>
              <button onClick={() => setShowModal(null)} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>{showModal.full_name?.[0] || "؟"}</span>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{showModal.full_name || "—"}</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>{showModal.role || "—"} · {showModal.verified ? "موثّق" : "معلق"}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "البريد", value: showModal.email || "—" },
                { label: "الجوال", value: showModal.phone || "—" },
                { label: "الترخيص", value: showModal.fal_license || "—" },
                { label: "الانضمام", value: showModal.created_at ? new Date(showModal.created_at).toLocaleDateString('ar-SA') : "—" },
                { label: "الإعلانات", value: "—" },
                { label: "الصفقات", value: "—" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#F8F9FB", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {!showModal.verified && <button onClick={() => { updateStatus(showModal.id, true); setShowModal(null); }} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>✅ توثيق</button>}
              {showModal.verified && <button onClick={() => { updateStatus(showModal.id, false); setShowModal(null); }} style={{ flex: 1, background: "#FFF5F5", color: "#EF4444", border: "1.5px solid #FECACA", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>🚫 إيقاف</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}