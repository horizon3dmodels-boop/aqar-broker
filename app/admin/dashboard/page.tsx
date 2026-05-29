"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";


export default function AdminDashboard() {
  const [properties, setProperties] = useState([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const [realStats, setRealStats] = useState({  
    totalProperties: 0,  
    totalUsers: 0,  
    totalContractors: 0,  
    pendingProperties: 0,
  });
  const [recentProps, setRecentProps] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {  
    const fetchStats = async () => {    
      const [
  { count: totalProperties },
  { count: totalUsers },
  { count: totalContractors },
  { count: pendingProperties },
  { count: messages },
  { data: latestProps },
  { data: allProps },
] = await Promise.all([
  supabase.from('properties').select('*', { count: 'exact', head: true }),
  supabase.from('profiles').select('*', { count: 'exact', head: true }),
  supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'contractor'),
  supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  supabase.from('messages').select('*', { count: 'exact', head: true }),
  supabase.from('properties').select('*, profiles!properties_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
  supabase.from('properties').select('created_at'),
]);

setRealStats({
  totalProperties: totalProperties || 0,
  totalUsers: totalUsers || 0,
  totalContractors: totalContractors || 0,
  pendingProperties: pendingProperties || 0,
});
setPendingCount(pendingProperties || 0);
setTotalMessages(messages || 0);
setRecentProps(latestProps || []);

const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const monthCounts: Record<string, number> = {};
(allProps || []).forEach((p: any) => {
  const month = monthNames[new Date(p.created_at).getMonth()];
  monthCounts[month] = (monthCounts[month] || 0) + 1;
});
const chart = monthNames.slice(0, 7).map(m => ({ month: m, value: monthCounts[m] || 0 }));
setChartData(chart); 
    };  
    fetchStats();
  }, []);

  const stats = [
  { icon: "🏠", label: "إجمالي العقارات", value: realStats.totalProperties.toLocaleString(), change: "+12%", up: true, color: "#16a34a", bg: "#F0FDF4" },
  { icon: "👥", label: "المستخدمون", value: realStats.totalUsers.toLocaleString(), change: "+8%", up: true, color: "#3B82F6", bg: "#EFF6FF" },
  { icon: "🔧", label: "المقاولون", value: realStats.totalContractors.toLocaleString(), change: "+5%", up: true, color: "#F59E0B", bg: "#FFFBEB" },
  { icon: "💬", label: "إجمالي التواصلات", value: totalMessages.toLocaleString(), change: "+18%", up: true, color: "#8B5CF6", bg: "#F5F3FF" },
  { icon: "📋", label: "طلبات معلقة", value: pendingCount.toLocaleString(), change: "-4%", up: false, color: "#EF4444", bg: "#FFF5F5" },
  { icon: "⭐", label: "متوسط التقييم", value: "—", change: "+0.2", up: true, color: "#F59E0B", bg: "#FFFBEB" },
];


  return (
    <div style={{ padding: "24px" }}>

      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>مرحباً باسل 👋</h2>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>الاثنين 12 مايو 2026 — نظرة عامة على المنصة</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ width: 46, height: 46, background: s.bg, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.up ? "#16a34a" : "#EF4444", background: s.up ? "#F0FDF4" : "#FFF5F5", padding: "3px 10px", borderRadius: 20 }}>
                {s.up ? "↑" : "↓"} {s.change}
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }} suppressHydrationWarning>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* Chart */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>📈 نمو الإعلانات</h3>
            <select style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "'Cairo', sans-serif", color: "#374151" }}>
              <option>آخر 7 أشهر</option>
              <option>آخر سنة</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
{chartData.map((d, i) => (
  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{d.value}</span>
    <div style={{ width: "100%", background: "linear-gradient(180deg, #16a34a, #22c55e)", borderRadius: "6px 6px 0 0", height: `${(d.value / (Math.max(...chartData.map(x => x.value)) || 1)) * 110}px` }} />
    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{d.month.slice(0, 3)}</span>
  </div>
))}          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>⚡ إجراءات سريعة</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: "✅", label: "قبول الإعلانات المعلقة", color: "#16a34a", bg: "#F0FDF4", count: pendingCount.toString(), href: "/admin/properties" },
{ icon: "👤", label: "توثيق المستخدمين", color: "#3B82F6", bg: "#EFF6FF", count: realStats.totalUsers.toString(), href: "/admin/users" },
{ icon: "🔧", label: "توثيق المقاولين", color: "#F59E0B", bg: "#FFFBEB", count: realStats.totalContractors.toString(), href: "/admin/contractors" },
{ icon: "💳", label: "طلبات الاشتراك", color: "#EF4444", bg: "#FFF5F5", count: "—", href: "/admin/pricing" },
{ icon: "🪪", label: "رخص الإعلانات", color: "#0EA5E9", bg: "#F0F9FF", count: "—", href: "/admin/licenses" },
{ icon: "🎟️", label: "أكواد الخصم", color: "#EC4899", bg: "#FDF2F8", count: "—", href: "/admin/discounts" },
            ].map((a, i) => (
              <a key={i} href={a.href} style={{ background: a.bg, borderRadius: 14, padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.label}</span>
                </div>
                <span style={{ background: a.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>{a.count}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Properties Table */}
      <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>🏠 أحدث الإعلانات</h3>
          <a href="/admin/properties" style={{ fontSize: 13, color: "#16a34a", textDecoration: "none", fontWeight: 700 }}>عرض الكل ←</a>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB" }}>
              {["العقار", "المستخدم", "النوع", "السعر", "الحالة", "التاريخ", "إجراء"].map((h, i) => (
                <th key={i} style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentProps.map((p, index) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      <img src={p.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&q=80"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.title}</span>
                  </div>
                </td>
                <td style={{ padding: "14px", fontSize: 13, color: "#6B7280" }}>{p.profiles?.full_name || "—"}</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ background: "#F3F4F6", color: "#374151", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{p.type}</span>
                </td>
                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{Number(p.price)?.toLocaleString()} ر.س</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: p.status === "active" ? "#DCFCE7" : p.status === "pending" ? "#FEF9C3" : "#FFF5F5", color: p.status === "active" ? "#16a34a" : p.status === "pending" ? "#92400E" : "#EF4444" }}>
                    {p.status === "active" ? "نشط" : p.status === "pending" ? "معلق" : "مرفوض"}
                  </span>
                </td>
                <td style={{ padding: "14px", fontSize: 12, color: "#9CA3AF" }}>{new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
                <td style={{ padding: "14px" }}>
                  <button style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>👁️ عرض</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* System Status */}
      <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>🤖 حالة النظام والـ AI</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Claude AI", status: "يعمل", color: "#16a34a", bg: "#DCFCE7", icon: "🤖" },
            { label: "قائمة البيانات", status: "يعمل", color: "#16a34a", bg: "#DCFCE7", icon: "🗄️" },
            { label: "Mapbox الخرائط", status: "يعمل", color: "#16a34a", bg: "#DCFCE7", icon: "🗺️" },
            { label: "بوابة Moyasar", status: "يعمل", color: "#16a34a", bg: "#DCFCE7", icon: "💳" },
            { label: "API الهيئة العقارية", status: "غير مفعّل", color: "#F59E0B", bg: "#FEF9C3", icon: "🪪" },
            { label: "النفاذ الوطني", status: "غير مفعّل", color: "#F59E0B", bg: "#FEF9C3", icon: "🪪" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#F8F9FB", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}