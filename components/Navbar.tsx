"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const navLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "عقارات للبيع والإيجار", href: "/properties" },
  { label: "إيجار يومي", href: "/daily-rent" },
  { label: "المشاريع الكبرى", href: "/projects" },
  { label: "المقاولون", href: "/contractors" },
];

const navLinksRight = [
  { label: "المكاتب الهندسية", href: "/engineering" },
  { label: "الخريطة", href: "/map" },
  { label: "الأسعار", href: "/pricing" },
  { label: "الطلبات", href: "/requests" },
  { label: "المدونة", href: "/blog" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // اجلب الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // استمع لأي تغيير في الجلسة (دخول / خروج)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || (pathname.startsWith(href.split("?")[0]) && href !== "/properties");
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? "م";

  return (
    <nav dir="rtl" style={{
      background: "#fff",
      borderBottom: "1px solid #EAECF0",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 1px 10px rgba(0,0,0,0.06)",
      fontFamily: "'Cairo', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .nav-link { transition: all 0.2s; text-decoration: none; white-space: nowrap; }
        .nav-link:hover { color: #1e3a5f !important; background: #F1F5F9 !important; }
        .add-btn:hover { background: #1d4ed8 !important; transform: translateY(-1px); }
        .add-btn { transition: all 0.2s; }
        .user-menu { position: relative; }
        .user-dropdown { position: absolute; top: 48px; left: 0; background: #fff; border: 1.5px solid #E5E7EB; borderRadius: 14px; boxShadow: 0 8px 24px rgba(0,0,0,0.1); minWidth: 180px; zIndex: 200; overflow: hidden; }
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-btn { display: flex !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72, gap: 12 }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <img src="/logo.png" alt="عقار بروكر" style={{ width: 38, height: 38, objectFit: "contain" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", lineHeight: 1.1 }}>عقار بروكر</div>
              <div style={{ fontSize: 10, color: "#2563EB", fontWeight: 600 }}>Aqar Broker</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center", overflow: "hidden" }}>
            {navLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="nav-link"
                style={{
                  color: isActive(link.href) ? "#1e3a5f" : "#4B5563",
                  fontSize: 13,
                  fontWeight: isActive(link.href) ? 700 : 600,
                  padding: "7px 11px",
                  borderRadius: 8,
                  background: isActive(link.href) ? "#EFF6FF" : "transparent",
                  border: isActive(link.href) ? "1.5px solid #BFDBFE" : "1.5px solid transparent",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* زر Reels في المنتصف */}
            <Link href="/reels" style={{  display: "flex", flexDirection: "column", alignItems: "center",  gap: 2, textDecoration: "none", margin: "0 8px" }}>
              <div style={{    width: 40, height: 40, background: "#16a34a", borderRadius: "50%",    display: "flex", alignItems: "center", justifyContent: "center",    boxShadow: "0 2px 8px rgba(22,163,74,0.4)"  }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#16a34a" }}>Reels</span>
            </Link>

            {navLinksRight.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="nav-link"
                style={{
                  color: isActive(link.href) ? "#1e3a5f" : "#4B5563",
                  fontSize: 13,
                  fontWeight: isActive(link.href) ? 700 : 600,
                  padding: "7px 11px",
                  borderRadius: 8,
                  background: isActive(link.href) ? "#EFF6FF" : "transparent",
                  border: isActive(link.href) ? "1.5px solid #BFDBFE" : "1.5px solid transparent",
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              style={{ background: "#F8F9FB", border: "1.5px solid #E5E7EB", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
              🔍
            </button>

            {user ? (
              /* مسجل دخول — أيقونة المستخدم + قائمة */
              <UserMenu initials={initials} onSignOut={handleSignOut} />
            ) : (
              /* غير مسجل — زر تسجيل الدخول */
              <Link href="/auth/login" style={{ fontSize: 13, color: "#374151", textDecoration: "none", fontWeight: 600, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "7px 14px", whiteSpace: "nowrap" }}>
                تسجيل الدخول
              </Link>
            )}

            <button onClick={async () => {  const { data: { user } } = await supabase.auth.getUser();  if (!user) {    router.push("/auth/login");    return;  }  router.push("/add-property");}} className="add-btn" style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>  + أضف إعلانك</button>

            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-btn" style={{ background: "#F8F9FB", border: "1.5px solid #E5E7EB", borderRadius: 10, width: 36, height: 36, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>☰</button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div style={{ padding: "10px 0 14px" }}>
            <input
              autoFocus
              placeholder="ابحث عن عقار، حي، مدينة..."
              style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: "2px solid #2563EB", fontSize: 14, fontFamily: "'Cairo', sans-serif", outline: "none" }}
            />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ background: "#fff", borderTop: "1px solid #F3F4F6", padding: "12px 20px" }}>
          {[...navLinks, { label: "🎬 Reels", href: "/reels" }, ...navLinksRight].map((link, i) => (
            <Link key={i} href={link.href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "11px 0", fontSize: 14, fontWeight: isActive(link.href) ? 700 : 600, color: isActive(link.href) ? "#1e3a5f" : "#374151", textDecoration: "none", borderBottom: "1px solid #F8F9FB" }}>
              {link.label}
            </Link>
          ))}
          {user && (
            <button onClick={handleSignOut} style={{ marginTop: 12, width: "100%", padding: "11px", background: "#FFF5F5", border: "none", borderRadius: 10, color: "#EF4444", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              تسجيل الخروج
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

// مكون منفصل للقائمة المنسدلة
function UserMenu({ initials, onSignOut }: { initials: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('read', false);
      setUnread(count || 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ position: "relative", width: 38, height: 38, background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: "50%", border: "2px solid #2563EB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{initials}</span>
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: -4,
            left: -4,
            background: "#EF4444",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            minWidth: 18,
            height: 18,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
            lineHeight: 1,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Overlay لإغلاق القائمة عند الضغط خارجها */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 150 }} />
          <div style={{ position: "absolute", top: 46, left: 0, background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 180, zIndex: 200, overflow: "hidden", fontFamily: "'Cairo', sans-serif" }}>
            <Link href="/profile" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", textDecoration: "none", color: "#374151", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #F3F4F6" }}>
              <span>👤</span> ملفي الشخصي
            </Link>
            <Link href="/messages" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", textDecoration: "none", color: "#374151", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #F3F4F6" }}>
              <span>💬</span> الرسائل
            </Link>
            <Link href="/notifications" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", textDecoration: "none", color: "#374151", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #F3F4F6" }}>
              <span>🔔</span> الإشعارات
              {unread > 0 && (
                <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "auto" }}>
                  {unread}
                </span>
              )}
            </Link>
            <button onClick={onSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>
              <span>🚪</span> تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
}