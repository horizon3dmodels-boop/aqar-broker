"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  live:     { bg: "#DCFCE7", color: "#15803d", label: "مباشر" },
  pending: { bg: "#FEF9C3", color: "#92400e", label: "معلّق" },
  success: { bg: "#EFF6FF", color: "#1d4ed8", label: "مكتمل" },
};

const health = [
  { label: "قاعدة البيانات (Supabase)", used: 34, total: 100, unit: "GB", color: "#16a34a" },
  { label: "التخزين (Storage)", used: 18, total: 50, unit: "GB", color: "#0ea5e9" },
  { label: "استخدام API", used: 62, total: 100, unit: "%", color: "#f59e0b" },
];

export default function AdminDashboard() {
  const [realStats, setRealStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalMessages: 0,
    totalEngineering: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { count: totalProperties },
        { count: totalUsers },
        { count: totalMessages },
        { count: totalEngineering },
        { data: latestActivity },
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'engineer'),
        supabase.from('properties').select('*, profiles!properties_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(6),
      ]);
      setRealStats({
        totalProperties: totalProperties || 0,
        totalUsers: totalUsers || 0,
        totalMessages: totalMessages || 0,
        totalEngineering: totalEngineering || 0,
      });
      setRecentActivity(latestActivity || []);
    };
    fetchData();
  }, []);

  const stats = [
    { label: "إجمالي العقارات", value: realStats.totalProperties.toLocaleString(), change: "إعلان مسجل", up: true, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>) },
    { label: "المستخدمون", value: realStats.totalUsers.toLocaleString(), change: "مستخدم مسجل", up: true, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>) },
    { label: "الاستفسارات النشطة", value: realStats.totalMessages.toLocaleString(), change: "رسالة مرسلة", up: true, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>) },
    { label: "المكاتب الهندسية", value: realStats.totalEngineering.toLocaleString(), change: "مكتب مسجل", up: true, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>) },
  ];

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Cairo', sans-serif",
        padding: "32px 36px",
        background: "#f8f9fb",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .stat-card { transition: box-shadow 0.2s, transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.09) !important; }
        .activity-row:hover td { background: #f8fafc !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>لوحة التحكم</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, fontWeight: 500 }}>مرحباً، باسل — إليك ملخص اليوم</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ background: "#fff", borderRadius: 16, padding: "22px 22px 18px", border: "1px solid #f1f5f9", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: "#f8fafc", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                {s.icon}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.up ? "#f0fdf4" : "#fff1f2", color: s.up ? "#16a34a" : "#e11d48" }}>
                {s.up ? "↑" : "↓"} {s.change}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Activity + Action Card */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 24 }}>

        {/* Activity Feed */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>النشاط الأخير</h2>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0", fontWeight: 500 }}>آخر الأحداث على المنصة</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>
              <div style={{ width: 6, height: 6, background: "#16a34a", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>مباشر</span>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["المستخدم", "الإجراء", "التفاصيل", "الوقت", "الحالة"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "right", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((a, i) => (
                <tr key={i} className="activity-row" style={{ borderBottom: "1px solid #fafafa" }}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#e2e8f0,#cbd5e1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#475569", flexShrink: 0 }}>
                        {a.profiles?.full_name?.[0] || "؟"}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{a.profiles?.full_name || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>أضاف إعلان جديد</td>
                  <td style={{ padding: "13px 16px", fontSize: 11, color: "#94a3b8" }}>{a.type} · {a.district}، {a.city}</td>
                  <td style={{ padding: "13px 16px", fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{new Date(a.created_at).toLocaleDateString('ar-SA')}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ background: a.status === 'active' ? "#DCFCE7" : "#FEF9C3", color: a.status === 'active' ? "#15803d" : "#92400e", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
                      {a.status === 'active' ? "نشط" : "معلق"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue + Tasks Card */}
        <div style={{ background: "linear-gradient(160deg,#0f172a 60%,#1e3a5f)", borderRadius: 18, padding: "24px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", boxShadow: "0 4px 24px rgba(15,23,42,0.18)" }}>
          <div style={{ position: "absolute", top: -40, left: -40, width: 160, height: 160, background: "rgba(255,255,255,0.03)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -30, right: -30, width: 130, height: 130, background: "rgba(255,255,255,0.03)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, marginBottom: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "3px 10px", marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>📊 ملخص الإيرادات</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "اليوم", value: "4,200", unit: "ر.س" },
                { label: "الشهر", value: "38,400", unit: "ر.س" },
                { label: "السنة", value: "284,500", unit: "ر.س" },
              ].map((r, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, fontWeight: 500 }}>{r.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{r.value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{r.unit}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: 16, position: "relative", zIndex: 1 }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>🎯 مهام معلقة</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>تحتاج موافقتك</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "أكواد خصم منتهية", count: 3, color: "#ef4444", href: "/admin/discounts" },
              ].map((task, i) => (
                <a key={i} href={task.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "'Cairo', sans-serif" }}>{task.label}</span>
                  <span style={{ background: task.color, color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 9px", borderRadius: 20 }}>{task.count}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>صحة النظام</h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0", fontWeight: 500 }}>حالة الخوادم وقاعدة البيانات</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>جميع الأنظمة تعمل</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {health.map((h, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{h.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: h.color }}>
                  {h.used}{h.unit === "%" ? "%" : ""} / {h.total}{h.unit !== "%" ? " " + h.unit : ""}
                </span>
              </div>
              <div style={{ background: "#f1f5f9", borderRadius: 6, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${(h.used / h.total) * 100}%`, background: h.color, height: "100%", borderRadius: 6 }} />
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 5, fontWeight: 500 }}>{Math.round((h.used / h.total) * 100)}% مستخدم</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}