"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  property: { color: "#16a34a", bg: "#F0FDF4", label: "العقارات" },
  payment: { color: "#D97706", bg: "#FFFBEB", label: "المدفوعات" },
  message: { color: "#2563EB", bg: "#EFF6FF", label: "الرسائل" },
  system: { color: "#7C3AED", bg: "#F5F3FF", label: "النظام" },
};

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "send" | "history">("templates");
  const [tmps, setTmps] = useState<any[]>([]);
  const [broadcast, setBroadcast] = useState({ title: "", body: "", target: "all", type: "system" });
  const [sent, setSent] = useState(false);
  const [notifHistory, setNotifHistory] = useState<any[]>([]);
  const [totalSentToday, setTotalSentToday] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { data: templatesData } = await supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: true });

    setTmps(templatesData || []);
    setNotifHistory(data || []);
    setTotalSentToday(count || 0);
  };

  const handleSend = async () => {
    if (!broadcast.title || !broadcast.body) return;
    setSending(true);

    // جلب المستخدمين حسب الفئة المستهدفة
    let query = supabase.from('profiles').select('id');
    if (broadcast.target === 'brokers') query = query.eq('role', 'broker');
    else if (broadcast.target === 'contractors') query = query.in('role', ['contractor', 'engineer']);
    else if (broadcast.target === 'buyers') query = query.eq('role', 'visitor');
    else if (broadcast.target === 'premium') query = query.eq('has_package', true);

    const { data: users } = await query;

    if (users && users.length > 0) {
      const notifications = users.map((u: any) => ({
        user_id: u.id,
        title: broadcast.title,
        body: broadcast.body,
        type: broadcast.type,
        read: false,
        link: '/notifications',
      }));

      await supabase.from('notifications').insert(notifications);
    }

    setSending(false);
    setSent(true);
    setBroadcast({ title: "", body: "", target: "all", type: "system" });
    setTimeout(() => setSent(false), 2500);
    fetchHistory();
  };

  const tabs = [
    { key: "templates", label: "📋 القوالب" },
    { key: "send", label: "📤 إرسال إشعار" },
    { key: "history", label: "📊 سجل الإرسال" },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; } .tab-btn { transition: all 0.15s; cursor: pointer; } input:focus, textarea:focus, select:focus { outline: none; border-color: #2563EB !important; } .toggle { transition: all 0.2s; } .row:hover { background: #F8FAFF !important; } .row { transition: background 0.15s; }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 4 }}>إدارة الإشعارات 🔔</h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>إرسال وإدارة إشعارات المستخدمين</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "إجمالي المرسَل اليوم", value: totalSentToday.toLocaleString(), color: "#2563EB" },
            { label: "معدل الفتح", value: "78%", color: "#16a34a" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "10px 16px", border: "1px solid #F0F0F0", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", marginBottom: 20, padding: "4px", display: "flex", gap: 4 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)} className="tab-btn" style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif", background: activeTab === t.key ? "#0f172a" : "transparent", color: activeTab === t.key ? "#fff" : "#6B7280" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Templates */}
      {activeTab === "templates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tmps.map((t) => (
            <div key={t.id} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid #F0F0F0", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ background: typeConfig[t.type]?.bg || "#F8F9FB", color: typeConfig[t.type]?.color || "#6B7280", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>{typeConfig[t.type]?.label || t.type}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{t.title}</span>
                </div>
                <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7, margin: 0, background: "#F8F9FB", borderRadius: 8, padding: "10px 12px" }}>{t.body}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0" }}>المتغيرات: <span style={{ color: "#2563EB", fontWeight: 600 }}>{"{name}"} {"{property}"} {"{package}"} {"{sender}"}</span></p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <button onClick={async () => {
                  await supabase.from('notification_templates').update({ active: !t.active }).eq('id', t.id);
                  setTmps(prev => prev.map(tmp => tmp.id === t.id ? { ...tmp, active: !tmp.active } : tmp));
                }} className="toggle" style={{ width: 44, height: 24, borderRadius: 12, background: t.active ? "#16a34a" : "#E5E7EB", border: "none", cursor: "pointer", position: "relative" }}>
                  <div style={{ width: 18, height: 18, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, right: t.active ? 3 : "calc(100% - 21px)", transition: "right 0.2s" }} />
                </button>
                <button style={{ background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>تعديل</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send */}
      {activeTab === "send" && (
        <div style={{ maxWidth: 640, background: "#fff", borderRadius: 16, padding: "28px", border: "1px solid #F0F0F0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>إرسال إشعار للمستخدمين</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>الفئة المستهدفة</label>
              <select value={broadcast.target} onChange={(e) => setBroadcast(b => ({ ...b, target: e.target.value }))} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", background: "#F8F9FB" }}>
                <option value="all">جميع المستخدمين</option>
                <option value="brokers">الوسطاء العقاريين فقط</option>
                <option value="contractors">المقاولون والمهندسون</option>
                <option value="buyers">الباحثون عن عقار</option>
                <option value="premium">أصحاب الباقات المدفوعة</option>
                <option value="inactive">المستخدمون غير النشطين</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>نوع الإشعار</label>
              <select value={broadcast.type} onChange={(e) => setBroadcast(b => ({ ...b, type: e.target.value }))} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", background: "#F8F9FB" }}>
                <option value="system">النظام</option>
                <option value="property">العقارات</option>
                <option value="payment">المدفوعات</option>
                <option value="message">الرسائل</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>عنوان الإشعار</label>
              <input value={broadcast.title} onChange={(e) => setBroadcast(b => ({ ...b, title: e.target.value }))} placeholder="مثال: تحديث جديد في المنصة" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", background: "#F8F9FB" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>نص الإشعار</label>
              <textarea value={broadcast.body} onChange={(e) => setBroadcast(b => ({ ...b, body: e.target.value }))} placeholder="اكتب نص الإشعار هنا..." rows={4} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", background: "#F8F9FB", resize: "none" }} />
            </div>
            <button onClick={handleSend} disabled={sending || !broadcast.title || !broadcast.body} style={{ background: sent ? "#16a34a" : sending ? "#9CA3AF" : "#0f172a", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 800, cursor: sending ? "not-allowed" : "pointer", fontFamily: "'Cairo', sans-serif", transition: "background 0.2s" }}>
              {sent ? "✓ تم الإرسال بنجاح!" : sending ? "جاري الإرسال..." : "📤 إرسال الإشعار الآن"}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8F9FB", borderBottom: "1px solid #F0F0F0" }}>
                {["العنوان", "النوع", "المُرسَل", "تم الفتح", "معدل الفتح", "الوقت"].map((h, i) => (
                  <th key={i} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notifHistory.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>لا توجد إشعارات مرسلة بعد</td></tr>
              ) : notifHistory.map((h) => (
                <tr key={h.id} className="row" style={{ borderBottom: "1px solid #F8F9FB", background: "#fff" }}>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{h.title}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: typeConfig[h.type]?.bg || "#F8F9FB", color: typeConfig[h.type]?.color || "#6B7280", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                      {typeConfig[h.type]?.label || h.type}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#374151" }}>1</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>
                    {h.read ? "1" : "0"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: h.read ? "#16a34a" : "#9CA3AF" }}>
                      {h.read ? "100%" : "0%"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#9CA3AF" }}>
                    {new Date(h.created_at).toLocaleDateString('ar-SA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}