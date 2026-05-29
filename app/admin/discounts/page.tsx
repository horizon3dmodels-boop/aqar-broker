"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDiscounts() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [copied, setCopied] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({
    code: "", discount: "", type: "نسبة %", usageLimit: "", expiry: "", assignedTo: "الجميع", description: "",
  });

  // جلب البيانات من الخادم
  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'inactive' : 'active';
    await supabase.from('discount_codes').update({ status: newStatus }).eq('id', id);
    setCodes(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const deleteCode = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;
    await supabase.from('discount_codes').delete().eq('id', id);
    setCodes(prev => prev.filter(c => c.id !== id));
  };

  const addCode = async () => {
    if (!newCode.code || !newCode.discount) return;
    const { data } = await supabase.from('discount_codes').insert({
      code: newCode.code,
      discount: Number(newCode.discount),
      type: newCode.type,
      usage_limit: Number(newCode.usageLimit) || 100,
      used_count: 0,
      expiry: newCode.expiry || '2026-12-31',
      status: 'active',
      assigned_to: newCode.assignedTo,
      description: newCode.description,
    }).select().single();
    
    if (data) setCodes(prev => [data, ...prev]);
    setShowModal(false);
    setNewCode({ code: "", discount: "", type: "نسبة %", usageLimit: "", expiry: "", assignedTo: "الجميع", description: "" });
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setNewCode({ ...newCode, code });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = codes.filter(c => {
    const currentStatusMapped = c.status === "active" ? "نشط" : "موقوف";
    if (statusFilter !== "الكل" && statusFilter !== "منتهي" && currentStatusMapped !== statusFilter) return false;
    
    // فلترة دقيقة للأكواد المنتهية صلاحيتها
    const isExpired = new Date(c.expiry) < new Date() || (c.used_count >= c.usage_limit);
    if (statusFilter === "منتهي" && !isExpired) return false;
    if (statusFilter === "نشط" && isExpired) return false;

    if (searchText && !c.code.includes(searchText.toUpperCase()) && !c.description?.includes(searchText)) return false;
    return true;
  });

  const inputStyle = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 6 } as React.CSSProperties;

  return (
    <div style={{ padding: "24px" }}>
      <style>{`input:focus, select:focus { border-color: #16a34a !important; outline: none; } .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; } tr:hover td { background: #F8F9FB; }`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "🎟️", label: "إجمالي الأكواد", value: codes.length, color: "#3B82F6", bg: "#EFF6FF" },
          { icon: "✅", label: "أكواد نشطة", value: codes.filter(c => c.status === "active" && new Date(c.expiry) >= new Date() && c.used_count < c.usage_limit).length, color: "#16a34a", bg: "#F0FDF4" },
          { icon: "📊", label: "إجمالي الاستخدام", value: codes.reduce((a, c) => a + (c.used_count || 0), 0), color: "#F59E0B", bg: "#FFFBEB" },
          { icon: "⏰", label: "أكواد منتهية", value: codes.filter(c => new Date(c.expiry) < new Date() || c.used_count >= c.usage_limit).length, color: "#EF4444", bg: "#FFF5F5" },
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

      {/* Filters + Add Button */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", gap: 12, alignItems: "center" }}>
        <input type="text" placeholder="🔍 بحث بالكود أو الوصف..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ flex: 1, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff" }}>
          {["الكل", "نشط", "موقوف", "منتهي"].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowModal(true)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
          + إنشاء كود جديد
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB" }}>
              {["الكود", "الخصم", "الاستخدام", "مخصص لـ", "انتهاء الصلاحية", "الحالة", "إجراءات"].map((h, i) => (
                <th key={i} style={{ padding: "14px 12px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ background: "#F0FDF4", border: "1.5px dashed #BBF7D0", borderRadius: 8, padding: "6px 14px", fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: "#16a34a", letterSpacing: 2 }}>
                      {c.code}
                    </div>
                    <button onClick={() => copyCode(c.code)} style={{ background: copied === c.code ? "#DCFCE7" : "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: copied === c.code ? "#16a34a" : "#374151", fontFamily: "'Cairo', sans-serif" }}>
                      {copied === c.code ? "✅ تم النسخ" : "📋 نسخ"}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{c.description}</div>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#16a34a" }}>
                    {c.discount}{c.type === "نسبة %" ? "%" : " ر.س"}
                  </span>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{c.type}</div>
                </td>
                <td style={{ padding: "14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{c.used_count} / {c.usage_limit}</div>
                  <div style={{ width: "100%", background: "#F3F4F6", borderRadius: 4, height: 6, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(((c.used_count || 0) / (c.usage_limit || 1)) * 100, 100)}%`, background: c.used_count >= c.usage_limit ? "#EF4444" : "#16a34a", height: "100%", borderRadius: 4 }} />
                  </div>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ background: "#EFF6FF", color: "#3B82F6", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{c.assigned_to}</span>
                </td>
                <td style={{ padding: "14px", fontSize: 13, color: "#374151", fontWeight: 600 }}>{c.expiry}</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: c.status === "active" ? "#DCFCE7" : "#F3F4F6", color: c.status === "active" ? "#16a34a" : "#6B7280" }}>
                    {c.status === "active" ? "نشط" : "موقوف"}
                  </span>
                </td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleStatus(c.id, c.status)} style={{ background: c.status === "active" ? "#FEF9C3" : "#DCFCE7", color: c.status === "active" ? "#92400E" : "#16a34a", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                      {c.status === "active" ? "⏸ إيقاف" : "▶ تفعيل"}
                    </button>
                    <button onClick={() => deleteCode(c.id)} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎟️</div>
            <p style={{ fontSize: 15, fontWeight: 700 }}>لا توجد أكواد خصم</p>
          </div>
        )}
      </div>

      {/* Create Code Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "32px", width: 520, maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>🎟️ إنشاء كود خصم جديد</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Code + Generate */}
              <div>
                <label style={labelStyle}>كود الخصم</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={newCode.code} onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })} placeholder="مثال: SUMMER50" style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 800, letterSpacing: 2, flex: 1 }} />
                  <button onClick={generateCode} style={{ background: "#F0FDF4", color: "#16a34a", border: "1.5px solid #BBF7D0", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", whiteSpace: "nowrap" }}>
                    🎲 توليد تلقائي
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>قيمة الخصم</label>
                  <input value={newCode.discount} onChange={(e) => setNewCode({ ...newCode, discount: e.target.value })} placeholder="مثال: 50" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>نوع الخصم</label>
                  <select value={newCode.type} onChange={(e) => setNewCode({ ...newCode, type: e.target.value })} style={inputStyle}>
                    <option>نسبة %</option>
                    <option>مبلغ ثابت</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>الحد الأقصى للاستخدام</label>
                  <input value={newCode.usageLimit} onChange={(e) => setNewCode({ ...newCode, usageLimit: e.target.value })} placeholder="مثال: 100" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>تاريخ الانتهاء</label>
                  <input type="date" value={newCode.expiry} onChange={(e) => setNewCode({ ...newCode, expiry: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>مخصص لـ</label>
                <select value={newCode.assignedTo} onChange={(e) => setNewCode({ ...newCode, assignedTo: e.target.value })} style={inputStyle}>
                  {["الجميع", "وسطاء", "ملاك", "مقاولون", "مكاتب هندسية", "مستخدمين جدد", "عملاء VIP"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>وصف الكود</label>
                <input value={newCode.description} onChange={(e) => setNewCode({ ...newCode, description: e.target.value })} placeholder="مثال: خصم الإطلاق الرسمي" style={inputStyle} />
              </div>

              {/* Preview */}
              {newCode.code && newCode.discount && (
                <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "16px", border: "1.5px solid #BBF7D0" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 10 }}>معاينة الكود:</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #E5E7EB" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 900, color: "#16a34a", letterSpacing: 3 }}>{newCode.code}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>
                      {newCode.discount}{newCode.type === "نسبة %" ? "%" : " ر.س"} خصم
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={addCode} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
                  ✅ إنشاء الكود
                </button>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: "#F8F9FB", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}