"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  link?: string;
  icon: string;
  color: string;
  created_at: string;
};

const filters = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروء" },
  { key: "message", label: "الرسائل" },
  { key: "property", label: "العقارات" },
  { key: "payment", label: "المدفوعات" },
  { key: "system", label: "النظام" },
];

function getIconAndColor(type: string) {
  switch (type) {
    case "message":     return { icon: "💬", color: "#2563EB" };
    case "property":    return { icon: "✅", color: "#16a34a" };
    case "payment":     return { icon: "💳", color: "#7C3AED" };
    case "verification":return { icon: "🔒", color: "#F59E0B" };
    case "system":      return { icon: "🏠", color: "#16a34a" };
    case "expired":     return { icon: "⏰", color: "#EF4444" };
    case "invoice":     return { icon: "📄", color: "#7C3AED" };
    default:            return { icon: "🔔", color: "#6B7280" };
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60)         return "الآن";
  if (diff < 3600)       return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400)      return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 172800)     return "أمس";
  if (diff < 604800)     return `منذ ${Math.floor(diff / 86400)} أيام`;
  return `منذ أسبوع`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
  setLoading(true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { 
    setLoading(false); 
    return; 
  }
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    const mapped: Notification[] = (data || []).map((n: any) => {
      const { icon, color } = getIconAndColor(n.type);
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        time: timeAgo(n.created_at),
        read: n.read,
        link: n.link,
        icon,
        color,
        created_at: n.created_at,
      };
    });

    setNotifications(mapped);
    setLoading(false);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.read;
    return n.type === activeFilter;
  });

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function deleteNotification(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function deleteAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
  }

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .notif-item { transition: background 0.15s; }
        .notif-item:hover { background: #F8FAFF !important; }
        .filter-btn { transition: all 0.15s; cursor: pointer; }
        .delete-btn { opacity: 0; transition: opacity 0.15s; }
        .notif-item:hover .delete-btn { opacity: 1; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 56px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 4 }}>
              الإشعارات
              {unreadCount > 0 && (
                <span style={{ background: "#2563EB", color: "#fff", fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 20, marginRight: 10 }}>
                  {unreadCount} جديد
                </span>
              )}
            </h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>كل تنبيهاتك في مكان واحد</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: "#EFF6FF", color: "#2563EB", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              تحديد الكل كمقروء ✓
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)} className="filter-btn" style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid", fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap", background: activeFilter === f.key ? "#2563EB" : "#fff", color: activeFilter === f.key ? "#fff" : "#374151", borderColor: activeFilter === f.key ? "#2563EB" : "#E5E7EB" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: 14 }}>
            جاري التحميل...
          </div>
        )}

        {/* Notifications List */}
        {!loading && filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: 20, border: "1px solid #F0F0F0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>لا توجد إشعارات</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>ستظهر هنا جميع تنبيهاتك</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((notif) => (
              <div key={notif.id} className="notif-item" onClick={() => {
                markRead(notif.id);
                if (notif.link) router.push(notif.link);
              }} style={{ background: notif.read ? "#fff" : "#F0F6FF", borderRadius: 16, border: `1.5px solid ${notif.read ? "#F0F0F0" : "#BFDBFE"}`, padding: "16px 20px", cursor: "pointer", position: "relative" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

                  {/* Icon */}
                  <div style={{ width: 44, height: 44, background: notif.color + "18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {notif.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: notif.read ? 600 : 800, color: "#0f172a", lineHeight: 1.4 }}>
                        {notif.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>{notif.time}</span>
                        {!notif.read && (
                          <div style={{ width: 8, height: 8, background: "#2563EB", borderRadius: "50%", flexShrink: 0 }} />
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#4B5563", margin: "4px 0 8px", lineHeight: 1.7 }}>
                      {notif.body}
                    </p>
                    {notif.link && (
                      <button onClick={(e) => {
                        e.stopPropagation();
                        markRead(notif.id);
                        router.push(notif.link!);
                      }} style={{ fontSize: 12, color: notif.color, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "'Cairo', sans-serif", padding: 0 }}>
                        عرض التفاصيل ←
                      </button>
                    )}
                  </div>

                  {/* Delete */}
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} style={{ width: 28, height: 28, background: "#FEE2E2", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#EF4444", flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear All */}
        {!loading && filtered.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={deleteAll} style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              حذف كل الإشعارات
            </button>
          </div>
        )}
      </div>
    </div>
  );
}