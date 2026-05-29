"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const statusConfig = {
  open: { label: "مفتوح", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  inprogress: { label: "جاري المعالجة", bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  resolved: { label: "تم الحل", bg: "#F0FDF4", color: "#16a34a", border: "#BBF7D0" },
  closed: { label: "مغلق", bg: "#F8F9FB", color: "#6B7280", border: "#E5E7EB" },
};

const priorityConfig = {
  high: { label: "عالية", color: "#DC2626" },
  medium: { label: "متوسطة", color: "#D97706" },
  low: { label: "منخفضة", color: "#16a34a" },
};

const typeConfig = {
  property: { label: "عقاري", color: "#16a34a", bg: "#F0FDF4" },
  technical: { label: "تقني", color: "#2563EB", bg: "#EFF6FF" },
  payment: { label: "مدفوعات", color: "#7C3AED", bg: "#F5F3FF" },
  broker: { label: "وسيط", color: "#D97706", bg: "#FFFBEB" },
  suggestion: { label: "اقتراح", color: "#0891B2", bg: "#ECFEFF" },
};

const channelIcons = { whatsapp: "💬", email: "📧", platform: "🏠" };

export default function AdminSupportPage() {
  const [tickets_state, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, profiles!support_tickets_user_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    setTickets(data || []);
    if (data && data.length > 0) setSelected(data[0]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('support_tickets').update({ status }).eq('id', id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected((prev: any) => prev ? { ...prev, status } : prev);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    await supabase.from('support_replies').insert({
      ticket_id: selected.id,
      body: reply,
      is_admin: true,
    });
    await updateStatus(selected.id, 'resolved');
    setSent(true);
    setTimeout(() => { setSent(false); setReply(""); }, 2000);
  };

  const filtered = tickets_state.filter((t) => {
    if (filter === "all") return true;
    if (filter === "open") return t.status === "open";
    if (filter === "inprogress") return t.status === "inprogress";
    if (filter === "resolved") return t.status === "resolved";
    return true;
  });

  const stats = [
    { label: "مفتوح", value: tickets_state.filter(t => t.status === "open").length, color: "#DC2626", bg: "#FEF2F2", icon: "🔴" },
    { label: "جاري المعالجة", value: tickets_state.filter(t => t.status === "inprogress").length, color: "#D97706", bg: "#FFFBEB", icon: "🟡" },
    { label: "تم الحل", value: tickets_state.filter(t => t.status === "resolved").length, color: "#16a34a", bg: "#F0FDF4", icon: "🟢" },
    { label: "إجمالي الطلبات", value: tickets_state.length, color: "#2563EB", bg: "#EFF6FF", icon: "🎧" },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; } .ticket-item { transition: background 0.15s; cursor: pointer; } .ticket-item:hover { background: #F0F6FF !important; } textarea:focus { outline: none; border-color: #2563EB !important; }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 4 }}>الدعم والمساعدة 🎧</h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>إدارة استفسارات وطلبات دعم المستخدمين</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["الكل", "مفتوح", "جاري المعالجة", "تم الحل"].map((f) => (
            <button key={f} onClick={() => setFilter(f === "الكل" ? "all" : f === "مفتوح" ? "open" : f === "جاري المعالجة" ? "inprogress" : "resolved")} style={{ padding: "7px 14px", borderRadius: 20, border: "1.5px solid", fontSize: 12, fontWeight: 700, fontFamily: "'Cairo', sans-serif", cursor: "pointer", background: (filter === "all" && f === "الكل") || (filter === "open" && f === "مفتوح") || (filter === "inprogress" && f === "جاري المعالجة") || (filter === "resolved" && f === "تم الحل") ? "#0f172a" : "#fff", color: (filter === "all" && f === "الكل") || (filter === "open" && f === "مفتوح") || (filter === "inprogress" && f === "جاري المعالجة") || (filter === "resolved" && f === "تم الحل") ? "#fff" : "#374151", borderColor: (filter === "all" && f === "الكل") || (filter === "open" && f === "مفتوح") || (filter === "inprogress" && f === "جاري المعالجة") || (filter === "resolved" && f === "تم الحل") ? "#0f172a" : "#E5E7EB" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, height: "calc(100vh - 280px)", minHeight: 400 }}>

        {/* Tickets List */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0F0F0", fontSize: 13, fontWeight: 700, color: "#374151" }}>
            {filtered.length} طلب
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>
                <div style={{ fontSize: 32 }}>🎧</div>
                <p style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>لا توجد طلبات دعم</p>
              </div>
            ) : filtered.map((t) => (
              <div key={t.id} className="ticket-item" onClick={() => setSelected(t)} style={{ padding: "14px 16px", borderBottom: "1px solid #F8F9FB", background: selected?.id === t.id ? "#EFF6FF" : "#fff", borderRight: `3px solid ${selected?.id === t.id ? "#2563EB" : "transparent"}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, background: "#EFF6FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#2563EB", flexShrink: 0 }}>
                    {t.profiles?.full_name?.[0] || "؟"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{t.profiles?.full_name || "—"}</span>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{channelIcons[t.channel as keyof typeof channelIcons] || "🏠"}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ background: statusConfig[t.status as keyof typeof statusConfig]?.bg || "#F8F9FB", color: statusConfig[t.status as keyof typeof statusConfig]?.color || "#6B7280", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                        {statusConfig[t.status as keyof typeof statusConfig]?.label || t.status}
                      </span>
                      <span style={{ fontSize: 10, color: priorityConfig[t.priority as keyof typeof priorityConfig]?.color || "#6B7280", fontWeight: 700 }}>
                        ● {priorityConfig[t.priority as keyof typeof priorityConfig]?.label || t.priority}
                      </span>
                      <span style={{ fontSize: 10, color: "#9CA3AF", marginRight: "auto" }}>
                        {new Date(t.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Detail */}
        {selected ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Ticket Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0F0F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, marginBottom: 6 }}>{selected.subject}</h2>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: typeConfig[selected.type as keyof typeof typeConfig]?.bg || "#F8F9FB", color: typeConfig[selected.type as keyof typeof typeConfig]?.color || "#6B7280", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>{typeConfig[selected.type as keyof typeof typeConfig]?.label || selected.type}</span>
                    <span style={{ background: statusConfig[selected.status as keyof typeof statusConfig]?.bg || "#F8F9FB", color: statusConfig[selected.status as keyof typeof statusConfig]?.color || "#6B7280", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, border: `1px solid ${statusConfig[selected.status as keyof typeof statusConfig]?.border || "#E5E7EB"}` }}>{statusConfig[selected.status as keyof typeof statusConfig]?.label || selected.status}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{new Date(selected.created_at).toLocaleDateString('ar-SA')} · {channelIcons[selected.channel as keyof typeof channelIcons] || "🏠"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {selected.status !== "inprogress" && (
                    <button onClick={() => updateStatus(selected.id, "inprogress")} style={{ background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>جاري المعالجة</button>
                  )}
                  {selected.status !== "resolved" && (
                    <button onClick={() => updateStatus(selected.id, "resolved")} style={{ background: "#F0FDF4", color: "#16a34a", border: "1px solid #BBF7D0", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>تم الحل ✓</button>
                  )}
                </div>
              </div>
            </div>

            {/* Message */}
            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, background: "#EFF6FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#2563EB", flexShrink: 0 }}>
                  {selected.profiles?.full_name?.[0] || "؟"}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{selected.profiles?.full_name || "—"}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{new Date(selected.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div style={{ background: "#F8F9FB", borderRadius: "4px 16px 16px 16px", padding: "14px 16px", fontSize: 14, color: "#374151", lineHeight: 1.7, border: "1px solid #F0F0F0" }}>
                    {selected.message}
                  </div>
                </div>
              </div>

              {selected.status === "resolved" && (
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>الآن</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>الدعم</span>
                    </div>
                    <div style={{ background: "#EFF6FF", borderRadius: "16px 4px 16px 16px", padding: "14px 16px", fontSize: 14, color: "#1E40AF", lineHeight: 1.7, maxWidth: 400 }}>
                      شكراً للتواصل! تم حل المشكلة. لا تتردد في التواصل معنا إذا احتجت أي مساعدة. 🙌
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #1e3a5f, #2563EB)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0 }}>ع</div>
                </div>
              )}
            </div>

            {/* Reply */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #F0F0F0" }}>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="اكتب ردك هنا..." rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", resize: "none", background: "#F8F9FB", marginBottom: 10 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {["شكراً للتواصل!", "سيتم المعالجة خلال 24 ساعة", "تم الحل بنجاح ✓"].map((q, i) => (
                    <button key={i} onClick={() => setReply(q)} style={{ background: "#F8F9FB", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>{q}</button>
                  ))}
                </div>
                <button onClick={handleReply} style={{ background: sent ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", transition: "background 0.2s" }}>
                  {sent ? "✓ تم الإرسال" : "إرسال الرد ←"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 48 }}>🎧</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>اختر طلباً للرد عليه</div>
          </div>
        )}
      </div>
    </div>
  );
}