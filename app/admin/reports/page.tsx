"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminReports() {
  const [activeMetric, setActiveMetric] = useState<"listings" | "users" | "revenue" | "deals">("listings");
  const [period, setPeriod] = useState("آخر 7 أشهر");
  const [stats, setStats] = useState({ totalProperties: 0, totalUsers: 0, totalContractors: 0, totalEngineers: 0, totalBrokers: 0, totalOwners: 0, totalVisitors: 0, totalMessages: 0 });
  const [topProperties, setTopProperties] = useState<any[]>([]);
  const [topContractors, setTopContractors] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const [
      { count: totalProperties },
      { count: totalUsers },
      { count: totalBrokers },
      { count: totalOwners },
      { count: totalContractors },
      { count: totalEngineers },
      { count: totalVisitors },
      { data: latestProps },
      { count: totalMessages },
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'broker'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'contractor'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'engineer'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'visitor'),
      supabase.from('properties').select('id, title, type, price, city, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      totalProperties: totalProperties || 0,
      totalUsers: totalUsers || 0,
      totalBrokers: totalBrokers || 0,
      totalOwners: totalOwners || 0,
      totalContractors: totalContractors || 0,
      totalEngineers: totalEngineers || 0,
      totalVisitors: totalVisitors || 0,
      totalMessages: totalMessages || 0,
    });

    setTopProperties(latestProps || []);

    // بناء بيانات شهرية من العقارات الحقيقية
    const { data: allProps } = await supabase.from('properties').select('created_at');
    const monthCounts: Record<string, number> = {};
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    (allProps || []).forEach((p: any) => {
      const month = new Date(p.created_at).getMonth();
      monthCounts[monthNames[month]] = (monthCounts[monthNames[month]] || 0) + 1;
    });

    // جلب عدد الرسائل الشهرية
    const { data: allMessages } = await supabase.from('messages').select('created_at');
    const msgCounts: Record<string, number> = {};
    (allMessages || []).forEach((m: any) => {
      const month = new Date(m.created_at).getMonth();
      msgCounts[monthNames[month]] = (msgCounts[monthNames[month]] || 0) + 1;
    });

    const monthlyWithMessages = monthNames.slice(0, 7).map(m => ({
      month: m,
      listings: monthCounts[m] || 0,
      users: 0,
      revenue: 0,
      deals: msgCounts[m] || 0,
    }));
    setMonthlyData(monthlyWithMessages);

    // جلب أفضل المقاولين حسب عدد الرسائل المستلمة
    const { data: contractorProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'contractor');

    if (contractorProfiles && contractorProfiles.length > 0) {
      const contractorIds = contractorProfiles.map((c: any) => c.id);
      const contractorStats = await Promise.all(
        contractorIds.map(async (id: string) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', id);
          const profile = contractorProfiles.find((c: any) => c.id === id);
          return {
            id,
            name: profile?.full_name || '—',
            phone: profile?.phone || '—',
            requests: count || 0,
          };
        })
      );
      const sorted = contractorStats.sort((a, b) => b.requests - a.requests).slice(0, 3);
      setTopContractors(sorted);
    }

    // جلب أكثر العقارات تواصلاً
    const { data: allPropsWithMessages } = await supabase
      .from('properties')
      .select('id, title, type, price, city');

    if (allPropsWithMessages) {
      const propsWithCount = await Promise.all(
        allPropsWithMessages.slice(0, 20).map(async (p: any) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('property_id', p.id);
          return { ...p, messageCount: count || 0 };
        })
      );
      const sorted = propsWithCount.sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);
      setTopProperties(sorted);
    }

    setLoading(false);
  };

  const metricConfig = {
    listings: { label: "الإعلانات", color: "#16a34a", max: Math.max(...monthlyData.map(d => d.listings)) },
    users: { label: "المستخدمون", color: "#3B82F6", max: Math.max(...monthlyData.map(d => d.users)) },
    revenue: { label: "الإيرادات", color: "#F59E0B", max: Math.max(...monthlyData.map(d => d.revenue)) },
    deals: { label: "التواصلات", color: "#8B5CF6", max: Math.max(...monthlyData.map((d: any) => d.deals)) || 1 },
  };

  return (
    <div style={{ padding: "24px" }}>
      <style>{`input:focus, select:focus { border-color: #16a34a !important; outline: none; }`}</style>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { icon: "🏠", label: "إجمالي الإعلانات", value: stats.totalProperties.toLocaleString(), sub: "إعلان مسجل", color: "#16a34a", bg: "#F0FDF4" },
          { icon: "👥", label: "إجمالي المستخدمين", value: stats.totalUsers.toLocaleString(), sub: "مستخدم مسجل", color: "#3B82F6", bg: "#EFF6FF" },
          { icon: "🤝", label: "الوسطاء", value: stats.totalBrokers.toLocaleString(), sub: "وسيط عقاري", color: "#F59E0B", bg: "#FFFBEB" },
          { icon: "💬", label: "إجمالي التواصلات", value: stats.totalMessages.toLocaleString(), sub: "رسالة مرسلة", color: "#8B5CF6", bg: "#F5F3FF" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }} suppressHydrationWarning>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>📈 تقرير النمو الشهري</h3>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Metric Selector */}
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 3, gap: 2 }}>
              {(["listings", "users", "revenue", "deals"] as const).map((m) => (
                <button key={m} onClick={() => setActiveMetric(m)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Cairo'", background: activeMetric === m ? metricConfig[m].color : "transparent", color: activeMetric === m ? "#fff" : "#6B7280", transition: "all 0.2s" }}>
                  {metricConfig[m].label}
                </button>
              ))}
            </div>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontFamily: "'Cairo'", color: "#374151", background: "#fff" }}>
              <option>آخر 7 أشهر</option>
              <option>آخر سنة</option>
            </select>
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, padding: "0 8px" }}>
          {monthlyData.map((d, i) => {
            const value = d[activeMetric];
            const max = Math.max(...monthlyData.map((x: any) => x[activeMetric])) || 1;
            const height = Math.max((value / max) * 160, 4);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{value}</span>
                <div style={{ width: "100%", background: `linear-gradient(180deg, ${metricConfig[activeMetric].color}, ${metricConfig[activeMetric].color}99)`, borderRadius: "8px 8px 0 0", height: `${height}px` }} />
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{d.month.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Top Properties */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>🏠 أكثر العقارات تواصلاً</h3>
          {topProperties.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#9CA3AF" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>لا توجد بيانات بعد</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProperties.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, background: i === 0 ? "#FEF9C3" : "#F3F4F6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: i === 0 ? "#92400E" : "#6B7280", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>📍 {p.city || "—"} · 💬 {p.messageCount} تواصل</div>
                  </div>
                  <div style={{ textAlign: "left", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{Number(p.price)?.toLocaleString()} ر.س</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{p.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>💰 توزيع الإيرادات</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "إعلانات مفردة", value: 0, percent: 0, color: "#16a34a" },
              { label: "باقات الوسطاء", value: 0, percent: 0, color: "#3B82F6" },
              { label: "اشتراكات مقاولين", value: 0, percent: 0, color: "#F59E0B" },
              { label: "Boost الإعلانات", value: 0, percent: 0, color: "#8B5CF6" },
              { label: "تمييز الخريطة", value: 0, percent: 0, color: "#EF4444" },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{item.percent}%</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()} ر.س</span>
                  </div>
                </div>
                <div style={{ width: "100%", background: "#F3F4F6", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${item.percent}%`, background: item.color, height: "100%", borderRadius: 6, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Top Contractors */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>🔧 أفضل المقاولين أداءً</h3>
          {topContractors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#9CA3AF" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>لا يوجد مقاولون مسجلون بعد</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topContractors.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "#F8F9FB", borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>📞 {c.phone}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{c.requests}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>طلب</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users Distribution */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>👥 توزيع المستخدمين</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "باحثون عن عقار", count: stats.totalVisitors, percent: stats.totalUsers ? Math.round((stats.totalVisitors / stats.totalUsers) * 100) : 0, color: "#3B82F6", icon: "🔍" },
              { label: "وسطاء عقاريون", count: stats.totalBrokers, percent: stats.totalUsers ? Math.round((stats.totalBrokers / stats.totalUsers) * 100) : 0, color: "#16a34a", icon: "🤝" },
              { label: "ملاك عقارات", count: stats.totalOwners, percent: stats.totalUsers ? Math.round((stats.totalOwners / stats.totalUsers) * 100) : 0, color: "#F59E0B", icon: "🏠" },
              { label: "مقاولون", count: stats.totalContractors, percent: stats.totalUsers ? Math.round((stats.totalContractors / stats.totalUsers) * 100) : 0, color: "#8B5CF6", icon: "🔧" },
              { label: "مكاتب هندسية", count: stats.totalEngineers, percent: stats.totalUsers ? Math.round((stats.totalEngineers / stats.totalUsers) * 100) : 0, color: "#EF4444", icon: "📐" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.color }} suppressHydrationWarning>{item.count.toLocaleString()}</span>
                  </div>
                  <div style={{ width: "100%", background: "#F3F4F6", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${item.percent}%`, background: item.color, height: "100%", borderRadius: 4 }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#9CA3AF", width: 30, textAlign: "left" }} suppressHydrationWarning>{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>📥 تصدير التقارير</h3>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>حمّل التقارير بالصيغة التي تناسبك</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "📊 Excel", color: "#16a34a", bg: "#F0FDF4", border: "#BBF7D0" },
            { label: "📄 PDF", color: "#EF4444", bg: "#FFF5F5", border: "#FECACA" },
          ].map((btn, i) => (
            <button key={i} style={{ background: btn.bg, color: btn.color, border: `1.5px solid ${btn.border}`, borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              {btn.label}
            </button>
          ))}
          <button onClick={() => {
            const csv = [
              ['الإحصائية', 'القيمة'],
              ['إجمالي الإعلانات', stats.totalProperties],
              ['إجمالي المستخدمين', stats.totalUsers],
              ['الوسطاء', stats.totalBrokers],
              ['الملاك', stats.totalOwners],
              ['المقاولون', stats.totalContractors],
              ['المهندسون', stats.totalEngineers],
              ['إجمالي التواصلات', stats.totalMessages],
            ].map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'تقرير_عقار_بروكر.csv';
            a.click();
          }} style={{ background: "#EFF6FF", color: "#3B82F6", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
            📋 CSV
          </button>
        </div>
      </div>
    </div>
  );
}