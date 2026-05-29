"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { key: "home", icon: "🏠", label: "الرئيسية", href: "/admin" },
  { key: "dashboard", icon: "📊", label: "لوحة التحكم", href: "/admin/dashboard" },
  { key: "properties", icon: "🏡", label: "العقارات", href: "/admin/properties" },
  { key: "daily-rent", icon: "🌴", label: "الإيجار اليومي", href: "/admin/daily-rent" },
  { key: "projects", icon: "🏗️", label: "المشاريع الكبرى", href: "/admin/projects" },
  { key: "users", icon: "👥", label: "المستخدمون", href: "/admin/users" },
  { key: "contractors", icon: "🔧", label: "المقاولون", href: "/admin/contractors" },
  { key: "engineering", icon: "📐", label: "المكاتب الهندسية", href: "/admin/engineering" },
  { key: "pricing", icon: "💰", label: "التسعير والباقات", href: "/admin/pricing" },
  { key: "discounts", icon: "🎟️", label: "أكواد الخصم", href: "/admin/discounts" },
  { key: "reports", icon: "📈", label: "التقارير", href: "/admin/reports" },
  { key: "licenses", icon: "🪪", label: "رخص الإعلانات", href: "/admin/licenses" },
  { key: "blog", icon: "📰", label: "المدونة", href: "/admin/blog" },
  { key: "ai", icon: "🤖", label: "إعدادات AI", href: "/admin/ai" },
  { key: "notifications", icon: "🔔", label: "الإشعارات", href: "/admin/notifications" },
  { key: "support", icon: "🎧", label: "الدعم والمساعدة", href: "/admin/support" },
  { key: "settings", icon: "⚙️", label: "إعدادات الموقع", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [expiredDiscounts, setExpiredDiscounts] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      const [
        { count: pending },
        { count: unreadNotifs },
        { count: tickets },
        { count: expired },
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('discount_codes').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
      ]);
      setPendingCount(pending || 0);
      setUnreadNotifications(unreadNotifs || 0);
      setOpenTickets(tickets || 0);
      setExpiredDiscounts(expired || 0);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  // عند فتح صفحة العقارات — صفّر العداد
  useEffect(() => {
    if (pathname.startsWith('/admin/properties')) {
      setPendingCount(0);
    }
  }, [pathname]);

  const getActiveKey = () => {
    if (pathname === "/admin") return "home";
    const match = navItems.find((item) => item.href !== "/admin" && pathname.startsWith(item.href));
    return match?.key || "home";
  };

  const activeKey = getActiveKey();

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F1F5F9", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-item { transition: all 0.2s; cursor: pointer; }
        .nav-item:hover { background: rgba(255,255,255,0.12) !important; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 255 : 68,
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
        minHeight: "100vh",
        position: "fixed",
        top: 0,
        right: 0,
        zIndex: 100,
        transition: "width 0.3s ease",
        overflow: "hidden",
        boxShadow: "-2px 0 20px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backdropFilter: "blur(10px)" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>ع</span>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>عقار بروكر</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 }}>لوحة الإدارة</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div className="sidebar-scroll" style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                borderRadius: 12,
                marginBottom: 3,
                textDecoration: "none",
                background: activeKey === item.key ? "rgba(255,255,255,0.18)" : "transparent",
                border: activeKey === item.key ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span style={{
                    color: activeKey === item.key ? "#fff" : "rgba(255,255,255,0.75)",
                    fontSize: 13,
                    fontWeight: activeKey === item.key ? 700 : 500,
                    flex: 1,
                    whiteSpace: "nowrap",
                  }}>
                    {item.label}
                  </span>
                  {item.key === "properties" && pendingCount > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>
                      {pendingCount}
                    </span>
                  )}
                  {item.key === "notifications" && unreadNotifications > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>
                      {unreadNotifications}
                    </span>
                  )}
                  {item.key === "support" && openTickets > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>
                      {openTickets}
                    </span>
                  )}
                  {item.key === "discounts" && expiredDiscounts > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>
                      {expiredDiscounts}
                    </span>
                  )}
                </>
              )}
            </a>
          ))}
        </div>

        {/* Toggle + Footer */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
          {sidebarOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>ب</span>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>باسل</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>مدير النظام</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "9px", cursor: "pointer", color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "'Cairo', sans-serif", fontWeight: 600, transition: "all 0.2s" }}
          >
            {sidebarOpen ? "◀ طي القائمة" : "▶"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginRight: sidebarOpen ? 255 : 68, flex: 1, transition: "margin 0.3s ease", minWidth: 0 }}>

        {/* Top Bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
              {navItems.find(n => n.key === activeKey)?.icon} {navItems.find(n => n.key === activeKey)?.label || "الرئيسية"}
            </h1>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Aqar Broker — نظام الإدارة</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" target="_blank" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none", fontWeight: 600, border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 12px" }}>
              👁️ عرض الموقع
            </a>
            <button style={{ position: "relative", background: "#F8F9FB", border: "1.5px solid #E5E7EB", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              🔔
              <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, background: "#EF4444", borderRadius: "50%", border: "1.5px solid #fff" }} />
            </button>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>ب</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ minHeight: "calc(100vh - 64px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}