"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: "", phone: "", email: "", city: "", bio: "",
    fal_license: "", commercial_register: "", rega_license: "",
    national_id: "", tourism_license: "", role: "owner"
  });
  const [myListings, setMyListings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"listings" | "favorites" | "messages" | "settings" | "stats" | "reels">("listings");
  const [totalViews, setTotalViews] = useState<number | string>("---");
  const [avgRating, setAvgRating] = useState<number | string>("---");
  const [totalReviews, setTotalReviews] = useState(0);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [reelsCount, setReelsCount] = useState(0);
  const [myReels, setMyReels] = useState<any[]>([]);
  const [reelsLoading, setReelsLoading] = useState(false);

  // رفع الصورة الشخصية
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ✅ الإحصائيات
  const [statsData, setStatsData] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUser(session.user);

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (prof) {
        setProfile({
          full_name: prof.full_name || "", phone: prof.phone || "",
          email: session.user.email || "", city: prof.city || "", bio: prof.bio || "",
          fal_license: prof.fal_license || "", commercial_register: prof.commercial_register || "",
          rega_license: prof.rega_license || "", national_id: prof.national_id || "",
          tourism_license: prof.tourism_license || "", role: prof.role || "owner"
        });
        setAvatarUrl(prof.avatar_url || "");
      }

      const { data: listings } = await supabase.from("properties").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
      setMyListings(listings || []);

      if (listings && listings.length > 0) {
        const totalV = listings.reduce((s: number, l: any) => s + (l.views || 0), 0);
        setTotalViews(totalV);
      } else {
        setTotalViews(0);
      }

      const { data: myReviews } = await supabase.from('reviews').select('rating').eq('target_id', session.user.id);
      if (myReviews && myReviews.length > 0) {
        const avg = myReviews.reduce((s: number, r: any) => s + r.rating, 0) / myReviews.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setTotalReviews(myReviews.length);
      } else {
        setAvgRating("---");
        setTotalReviews(0);
      }

      const { data: favs } = await supabase.from('favorites').select('property_id').eq('user_id', session.user.id);
      if (favs && favs.length > 0) {
        const ids = favs.map((f: any) => f.property_id);
        const { data: favProps } = await supabase.from('properties').select('*').in('id', ids);
        setFavorites(favProps || []);
      }

      const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', session.user.id).eq('read', false);
      setHasUnreadMessages((count || 0) > 0);

      const [{ count: followers }, { count: following }, { count: reels }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", session.user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", session.user.id),
        supabase.from("reels").select("*", { count: "exact", head: true }).eq("user_id", session.user.id).eq("status", "active"),
      ]);
      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);
      setReelsCount(reels || 0);
    };
    load();
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file, { upsert: true });
    if (uploadError) { alert("فشل رفع الصورة"); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
    setSaveMsg("تم تحديث الصورة ✓");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  // ✅ جلب الإحصائيات عبر الـ session مباشرة
  const loadStats = async () => {
    setStatsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setStatsLoading(false); return; }
    
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, views, price, status, created_at, images, type, city")
      .eq("user_id", session.user.id)
      .order("views", { ascending: false });
    
    setStatsData(data || []);
    setStatsLoading(false);
  };

  const loadReels = async () => {
    setReelsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setReelsLoading(false); return; }
    const { data } = await supabase
      .from("reels")
      .select("id, title, thumbnail_url, likes_count, views_count, category")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setMyReels(data || []);
    setReelsLoading(false);
  };

  useEffect(() => {
    if (activeTab === "stats") loadStats();
    if (activeTab === "reels") loadReels();
  }, [activeTab]);

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone, city: profile.city,
      bio: profile.bio, fal_license: (profile as any).fal_license || null,
      commercial_register: (profile as any).commercial_register || null,
      rega_license: (profile as any).rega_license || null,
      national_id: (profile as any).national_id || null,
      tourism_license: (profile as any).tourism_license || null,
      role: (profile as any).role || "owner",
      updated_at: new Date().toISOString(),
    }).eq("id", session.user.id);
    if (error) { alert("خطأ: " + error.message); }
    else { setSaveMsg("تم الحفظ ✓"); setTimeout(() => setSaveMsg(""), 3000); }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const tabs = [
    { key: "listings", label: "إعلاناتي", icon: "🏠", count: myListings.length },
    { key: "reels", label: "Reels", icon: "🎬", count: reelsCount },
    { key: "favorites", label: "المفضلة", icon: "❤️", count: 0 },
    { key: "messages", label: "الرسائل", icon: "💬", count: 0, unread: hasUnreadMessages },
    { key: "stats", label: "الإحصائيات", icon: "📊", count: 0 },
    { key: "settings", label: "الإعدادات", icon: "⚙️", count: 0 },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card-hover { transition: all 0.2s; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.1) !important; }
        input:focus, select:focus, textarea:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; outline: none; }
        .tab-btn { transition: all 0.2s; }
        .avatar-overlay { opacity: 0; transition: opacity 0.2s; }
        .avatar-wrap:hover .avatar-overlay { opacity: 1; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Profile Header */}
      <div style={{ background: "linear-gradient(135deg, #052e16, #16a34a)", padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 24 }}>
          <div className="avatar-wrap" style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 88, height: 88, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(255,255,255,0.4)", overflow: "hidden" }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 36 }}>{profile.full_name ? profile.full_name[0] : "ب"}</span>
              )}
            </div>
            <div className="avatar-overlay" onClick={() => avatarInputRef.current?.click()}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {uploadingAvatar ? (
                <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <span style={{ color: "#fff", fontSize: 20 }}>📷</span>
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{profile.full_name || "جاري التحميل..."}</h1>
              <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>موثّق ✓</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 4 }}>
              {profile.role === "broker" ? "وسيط عقاري / مسوق عقاري" : profile.role === "contractor" ? "مقاول" : profile.role === "engineer" ? "مكتب هندسي" : "مالك عقار"} · {profile.city || "المملكة العربية السعودية"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{profile.bio || "لا توجد نبذة شخصية مكتوبة حالياً."}</p>
          </div>
          <button onClick={() => setActiveTab("settings")} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
            ✏️ تعديل الملف
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ maxWidth: 1280, margin: "-40px auto 0", padding: "0 24px", position: "relative", zIndex: 10 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px 28px", boxShadow: "0 8px 30px rgba(0,0,0,0.10)", border: "1px solid #F0F0F0", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
          {[
            { icon: "🏠", value: myListings.length, label: "إعلان نشط" },
            { icon: "👁️", value: totalViews, label: "مشاهدة" },
            {
              icon: "⭐",
              value: avgRating === "---" ? "---" : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span>{avgRating}</span>
                  {totalReviews > 0 && <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>({totalReviews} تقييم)</span>}
                </div>
              ),
              label: "التقييم"
            },
            { icon: "👥", value: followersCount, label: "متابع" },
            { icon: "🎬", value: reelsCount, label: "Reels" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "24px auto", padding: "0 24px", display: "flex", gap: 24 }}>

        {/* Sidebar */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => {
                if (tab.key === "messages") { router.push("/messages"); return; }
                if (tab.key === "stats") { 
                  setActiveTab("stats"); 
                  setTimeout(() => loadStats(), 100);
                  return; 
                }
                setActiveTab(tab.key as typeof activeTab);
              }} className="tab-btn" style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 4,
                background: activeTab === tab.key ? "#f0fdf4" : "transparent",
                color: activeTab === tab.key ? "#16a34a" : "#374151",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{tab.icon}</span><span>{tab.label}</span>
                </div>
                {((tab as any).count > 0 || (tab as any).unread) && (
                  <span style={{ background: (tab as any).unread ? "#EF4444" : activeTab === tab.key ? "#16a34a" : "#E5E7EB", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                    {(tab as any).unread ? "●" : (tab as any).count}
                  </span>
                )}
              </button>
            ))}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 10, padding: "0 8px" }}>مركز التنبيهات</p>
              <p style={{ fontSize: 11, color: "#9CA3AF", padding: "0 8px" }}>لا توجد إشعارات جديدة حالياً.</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>

          {/* Listings */}
          {activeTab === "listings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>إعلاناتي ({myListings.length})</h2>
                <a href="/add-property" style={{ background: "#16a34a", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700 }}>+ إضافة إعلان</a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {myListings.map((p) => (
                  <div key={p.id} className="card-hover" style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", display: "flex" }}>
                    <div style={{ width: 160, height: 120, flexShrink: 0, overflow: "hidden" }}>
                      <img src={p.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80"} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "16px", flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>📍 {p.district}، {p.city}</div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{Number(p.price)?.toLocaleString()} ر.س</span>
                          <span style={{ fontSize: 11, background: p.status === "active" ? "#DCFCE7" : "#FEF9C3", color: p.status === "active" ? "#16a34a" : "#92400E", padding: "2px 10px", borderRadius: 20, fontWeight: 700 }}>{p.status === "active" ? "نشط" : p.status}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => router.push(`/edit-property/${p.id}`)} style={{ padding: "8px 14px", background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#16a34a", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>تعديل</button>
                        <button style={{ padding: "8px 14px", background: "#FFF5F5", border: "1.5px solid #FECACA", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#EF4444", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>حذف</button>
                      </div>
                    </div>
                  </div>
                ))}
                {myListings.length === 0 && <p style={{ textAlign: "center", color: "#9CA3AF", padding: "40px", fontSize: 14 }}>لم تقم بإضافة أي إعلانات عقارية بعد.</p>}
              </div>
            </div>
          )}

          {/* Favorites */}
          {activeTab === "favorites" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>المفضلة ({favorites.length})</h2>
              {favorites.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9CA3AF", padding: "40px", fontSize: 14 }}>قائمة المفضلة فارغة حالياً.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {favorites.map((p) => (
                    <div key={p.id} className="card-hover" onClick={() => router.push(`/properties/${p.id}`)} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", display: "flex", cursor: "pointer" }}>
                      <div style={{ width: 160, height: 120, flexShrink: 0, overflow: "hidden" }}>
                        <img src={p.images?.[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ padding: "16px", flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>📍 {p.district}، {p.city}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{Number(p.price)?.toLocaleString()} ر.س</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {activeTab === "messages" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>صندوق الرسائل</h2>
              <div style={{ background: "#fff", borderRadius: 20, padding: "40px", textAlign: "center", border: "1px solid #F0F0F0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>اذهب لصندوق الرسائل لعرض محادثاتك</p>
                <button onClick={() => router.push('/messages')} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  فتح صندوق الرسائل ←
                </button>
              </div>
            </div>
          )}

          {/* ✅ الإحصائيات */}
          {activeTab === "stats" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>📊 إحصائيات إعلاناتي</h2>

              {/* بطاقات الملخص */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { icon: "👁️", label: "إجمالي المشاهدات", value: statsData.reduce((s, p) => s + (p.views || 0), 0).toLocaleString("en-US"), color: "#0284c7", bg: "#F0F9FF" },
                  { icon: "🏠", label: "إجمالي الإعلانات", value: statsData.length, color: "#16a34a", bg: "#F0FDF4" },
                  { icon: "⭐", label: "متوسط التقييم", value: avgRating === "---" ? "---" : `${avgRating} (${totalReviews})`, color: "#F59E0B", bg: "#FFFBEB" },
                ].map((card, i) => (
                  <div key={i} style={{ background: card.bg, borderRadius: 16, padding: "20px", border: `1.5px solid ${card.color}33`, textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* جدول الإعلانات */}
              <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>تفاصيل كل إعلان — مرتبة حسب المشاهدات</h3>
                </div>

                {statsLoading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>جاري التحميل...</div>
                ) : statsData.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                    <p>لا توجد إعلانات بعد.</p>
                  </div>
                ) : (
                  <div>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 60px", gap: 12, padding: "10px 20px", background: "#F8F9FB", fontSize: 11, fontWeight: 700, color: "#9CA3AF" }}>
                      <span>الإعلان</span>
                      <span style={{ textAlign: "center" }}>السعر</span>
                      <span style={{ textAlign: "center" }}>المشاهدات</span>
                      <span style={{ textAlign: "center" }}>الحالة</span>
                    </div>
                    {statsData.map((p, i) => (
                      <div key={p.id} style={{
                        display: "grid", gridTemplateColumns: "1fr 80px 80px 60px", gap: 12,
                        alignItems: "center", padding: "12px 20px",
                        borderTop: "1px solid #F3F4F6",
                        background: i % 2 === 0 ? "#fff" : "#FAFAFA",
                      }}>
                        {/* العنوان */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 48, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏠</div>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>📍 {p.city} · {p.type}</div>
                          </div>
                        </div>

                        {/* السعر */}
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#16a34a" }}>{Number(p.price)?.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF" }}>ر.س</div>
                        </div>

                        {/* المشاهدات */}
                        <div style={{ textAlign: "center", minWidth: 80 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: "#0284c7", marginBottom: 4 }}>{p.views || 0}</div>
                          <div style={{ 
                            height: 6, 
                            background: "#E0F2FE", 
                            borderRadius: 10, 
                            overflow: "hidden",
                            width: "100%"
                          }}>
                            <div style={{ 
                              height: "100%", 
                              borderRadius: 10,
                              background: "linear-gradient(90deg, #0284c7, #38bdf8)",
                              width: `${Math.min(((p.views || 0) / Math.max(...statsData.map((x: any) => x.views || 0), 1)) * 100, 100)}%`,
                              transition: "width 0.5s ease"
                            }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, marginTop: 2 }}>مشاهدة</div>
                        </div>

                        {/* الحالة */}
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 20, background: p.status === "active" ? "#DCFCE7" : "#FEF9C3", color: p.status === "active" ? "#16a34a" : "#92400E" }}>
                            {p.status === "active" ? "نشط" : p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reels */}
          {activeTab === "reels" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Reels ({reelsCount})</h2>
                <button onClick={() => router.push("/reels/upload")}
                  style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  + نشر Reel
                </button>
              </div>

              {reelsLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</div>
              ) : myReels.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
                  <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>لم تنشر أي Reels بعد</p>
                  <button onClick={() => router.push("/reels/upload")}
                    style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                    ابدأ الآن
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
                  {myReels.map((reel) => (
                    <div key={reel.id} onClick={() => router.push(`/reels/${reel.id}`)}
                      style={{ position: "relative", aspectRatio: "9/16", background: "#0f172a", borderRadius: 8, overflow: "hidden", cursor: "pointer" }}>
                      {reel.thumbnail_url ? (
                        <img src={reel.thumbnail_url} alt={reel.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0c4a6e, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎬</div>
                      )}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
                      <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 12 }}>❤️</span>
                        <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{reel.likes_count || 0}</span>
                      </div>
                      {reel.category && (
                        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(22,163,74,0.85)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>
                          {reel.category}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>إعدادات الحساب</h2>

              {/* تغيير الصورة الشخصية */}
              <div style={{ background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>📷 الصورة الشخصية</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg, #16a34a, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "#fff", fontWeight: 900, fontSize: 28 }}>{profile.full_name?.[0] || "ب"}</span>
                    )}
                  </div>
                  <div>
                    <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                      style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", marginBottom: 6, display: "block" }}>
                      {uploadingAvatar ? "جاري الرفع..." : "📷 تغيير الصورة"}
                    </button>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>JPG أو PNG — الحد الأقصى 5MB</p>
                  </div>
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "الاسم الكامل", name: "full_name" },
                    { label: "رقم الجوال", name: "phone" },
                    { label: "المدينة", name: "city" },
                    ...((profile as any).role === "broker" ? [
                      { label: "رخصة فال", name: "fal_license" },
                      { label: "رخصة إعلان REGA", name: "rega_license" },
                    ] : (profile as any).role === "owner" || (profile as any).role === "buyer" ? [
                      { label: "رقم الهوية الوطنية", name: "national_id" },
                      { label: "رخصة إعلان REGA", name: "rega_license" },
                    ] : (profile as any).role === "contractor" || (profile as any).role === "engineer" ? [
                      { label: "السجل التجاري", name: "commercial_register" },
                    ] : [])
                  ].map((field, i) => (
                    <div key={i}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>{field.label}</label>
                      <input value={(profile as any)[field.name] || ""} onChange={(e) => setProfile({ ...profile, [field.name]: e.target.value })}
                        style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }} />
                    </div>
                  ))}

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>نوع الحساب</label>
                    <select value={(profile as any).role || "owner"} onChange={(e) => setProfile({ ...profile, role: e.target.value } as any)}
                      style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }}>
                      <option value="owner">🏠 مالك عقار</option>
                      <option value="broker">🤝 وسيط عقاري / مسوق عقاري</option>
                      <option value="contractor">🔧 مقاول</option>
                      <option value="engineer">📐 مكتب هندسي</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>البريد الإلكتروني</label>
                    <input value={profile.email || ""} readOnly disabled
                      style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#9CA3AF", background: "#E5E7EB", cursor: "not-allowed" }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>نبذة شخصية</label>
                    <textarea value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3}
                      style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA", resize: "vertical" }} />
                  </div>

                  <button onClick={handleSave} disabled={saving}
                    style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
                    {saving ? "جاري الحفظ..." : saveMsg || "حفظ التغييرات ✓"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 20, background: "#FFF5F5", borderRadius: 20, padding: "24px", border: "1.5px solid #FECACA" }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#EF4444", marginBottom: 16 }}>⚠️ منطقة الخطر</h3>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleSignOut} style={{ padding: "10px 20px", background: "#fff", border: "1.5px solid #FECACA", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#EF4444", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>تسجيل الخروج</button>
                  <button style={{ padding: "10px 20px", background: "#EF4444", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>حذف الحساب</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}