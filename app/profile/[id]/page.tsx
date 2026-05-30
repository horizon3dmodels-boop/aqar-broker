"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const purposeFilters = ["الكل", "بيع", "إيجار", "إيجار يومي"];

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "projects" | "reels">("listings");
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [followed, setFollowed] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avgRating, setAvgRating] = useState<number | string>("---");
  const [totalReviews, setTotalReviews] = useState(0);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isContractorOrEngineer = profile?.role === "contractor" || profile?.role === "engineer";

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: prof } = await supabase
        .from("profiles").select("*").eq("id", params.id).single();

      if (!prof) { router.push("/"); return; }
      setProfile(prof);

      const isContEng = prof.role === "contractor" || prof.role === "engineer";

      const queries: any[] = [
        supabase.from("reels").select("id, title, thumbnail_url, likes_count, category, views_count").eq("user_id", params.id).eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("reviews").select("rating").eq("target_id", params.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", params.id),
      ];

      if (isContEng) {
        queries.push(supabase.from("projects").select("*").eq("user_id", params.id).order("created_at", { ascending: false }));
      } else {
        queries.push(supabase.from("properties").select("*").eq("user_id", params.id).eq("status", "active").order("created_at", { ascending: false }));
      }

      const [
        { data: reelsData },
        { data: reviews },
        { count: followers },
        { data: contentData },
      ] = await Promise.all(queries);

      setReels(reelsData || []);
      setFollowersCount(followers || 0);

      if (isContEng) {
        setProjects(contentData || []);
        setActiveTab("projects");
      } else {
        setListings(contentData || []);
        setActiveTab("listings");
      }

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setTotalReviews(reviews.length);
      }

      if (user) {
        const { data: followData } = await supabase
          .from("follows").select("id")
          .eq("follower_id", user.id).eq("following_id", params.id).maybeSingle();
        setFollowed(!!followData);
      }

      setLoading(false);
    };
    if (params.id) load();
  }, [params.id]);

  const toggleFollow = async () => {
    if (!currentUser) { router.push("/auth/login"); return; }
    if (currentUser.id === params.id) return;
    if (followed) {
      await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", params.id);
      setFollowed(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: params.id });
      setFollowed(true);
      setFollowersCount(prev => prev + 1);
      const { data: follower } = await supabase.from("profiles").select("full_name").eq("id", currentUser.id).single();
      await supabase.from("notifications").insert({
        user_id: params.id, title: "متابع جديد",
        body: `${follower?.full_name || "أحدهم"} بدأ بمتابعتك`,
        type: "follow", read: false, link: `/profile/${currentUser.id}`
      });
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const filteredListings = listings.filter(p => activeFilter === "الكل" ? true : p.purpose === activeFilter);

  const roleLabel = (role: string) => {
    if (role === "broker") return "وسيط عقاري";
    if (role === "contractor") return "مقاول";
    if (role === "engineer") return "مكتب هندسي";
    return "مالك عقار";
  };

  const formatPrice = (price: number, purpose: string) => {
    const formatted = Number(price)?.toLocaleString("ar-SA");
    if (purpose === "إيجار يومي") return `${formatted} ر.س/ليلة`;
    if (purpose === "إيجار") return `${formatted} ر.س/سنة`;
    return `${formatted} ر.س`;
  };

  // جمع كل صور المشاريع في مصفوفة واحدة للـ lightbox
  const allProjectImages = projects.flatMap((p: any) => p.images || []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "100px", fontFamily: "'Cairo', sans-serif", fontSize: 18, fontWeight: 600, color: "#9CA3AF" }}>
      جاري التحميل...
    </div>
  );

  if (!profile) return null;

  const contentCount = isContractorOrEngineer ? projects.length : listings.length;
  const contentLabel = isContractorOrEngineer ? "مشروع" : "إعلان";
  const contentIcon = isContractorOrEngineer ? "🔨" : "🏠";

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card-hover { transition: all 0.2s; cursor: pointer; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.12) !important; }
        .reel-card:hover { opacity: 0.85; }
        .filter-btn { transition: all 0.2s; cursor: pointer; }
        .proj-img:hover { transform: scale(1.03); }
        .proj-img { transition: transform 0.2s; cursor: zoom-in; }
      `}</style>

      {/* Lightbox */}
      {lightboxOpen && (
        <div onClick={() => setLightboxOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => Math.max(0, i - 1)); }}
            style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 48, height: 48, color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          <img src={lightboxImages[lightboxIndex]} alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => Math.min(lightboxImages.length - 1, i + 1)); }}
            style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 48, height: 48, color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={() => setLightboxOpen(false)}
            style={{ position: "absolute", top: 20, left: 20, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: 20, cursor: "pointer" }}>×</button>
          <div style={{ position: "absolute", bottom: 20, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", padding: "40px 24px 80px", position: "relative" }}>
        <button onClick={() => router.back()}
          style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", zIndex: 10 }}>
          ← رجوع
        </button>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ color: "#fff", fontSize: 36, fontWeight: 900 }}>{profile.full_name?.[0] || "؟"}</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{profile.full_name}</h1>
              <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 700 }}>موثّق ✓</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>
              {roleLabel(profile.role)} · {profile.city || "المملكة العربية السعودية"}
            </p>
            {profile.bio && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{profile.bio}</p>}
          </div>
          {currentUser?.id !== params.id && (
            <button onClick={toggleFollow}
              style={{
                background: followed ? "rgba(255,255,255,0.15)" : "#fff",
                color: followed ? "#fff" : "#1e3a5f",
                border: followed ? "1.5px solid rgba(255,255,255,0.4)" : "none",
                borderRadius: 12, padding: "10px 24px",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Cairo', sans-serif", flexShrink: 0
              }}>
              {followed ? "✓ متابَع" : "+ تابع"}
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ maxWidth: 900, margin: "-40px auto 0", padding: "0 24px", position: "relative", zIndex: 10 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px 28px", boxShadow: "0 8px 30px rgba(0,0,0,0.10)", border: "1px solid #F0F0F0", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            { icon: contentIcon, value: contentCount, label: contentLabel },
            { icon: "👥", value: followersCount, label: "متابع" },
            { icon: "⭐", value: avgRating === "---" ? "---" : `${avgRating}`, label: `تقييم (${totalReviews})` },
            { icon: "🎬", value: reels.length, label: "Reel" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 24px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#F3F4F6", padding: 4, borderRadius: 12, width: "fit-content", marginBottom: 20 }}>
          {(isContractorOrEngineer ? [
            { key: "projects", label: `🔨 المشاريع (${projects.length})` },
            { key: "reels", label: `🎬 Reels (${reels.length})` },
          ] : [
            { key: "listings", label: `🏠 الإعلانات (${listings.length})` },
            { key: "reels", label: `🎬 Reels (${reels.length})` },
          ] as { key: string; label: string }[]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: "9px 20px", borderRadius: 9, border: "none",
                fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif",
                background: activeTab === tab.key ? "#2563EB" : "transparent",
                color: activeTab === tab.key ? "#fff" : "#6B7280",
                cursor: "pointer"
              }}> {tab.label} </button>
          ))}
        </div>

        {/* Listings Tab — للمسوق/المالك */}
        {activeTab === "listings" && !isContractorOrEngineer && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {purposeFilters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} className="filter-btn"
                  style={{
                    padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                    borderColor: activeFilter === f ? "#2563EB" : "#E5E7EB",
                    background: activeFilter === f ? "#2563EB" : "#fff",
                    color: activeFilter === f ? "#fff" : "#6B7280",
                    fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif"
                  }}>{f}</button>
              ))}
              <span style={{ fontSize: 12, color: "#9CA3AF", alignSelf: "center", marginRight: 8 }}>{filteredListings.length} إعلان</span>
            </div>
            {filteredListings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>لا توجد إعلانات في هذه الفئة</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 40 }}>
                {filteredListings.map(p => (
                  <div key={p.id} className="card-hover" onClick={() => router.push(`/properties/${p.id}`)}
                    style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
                    <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #DBEAFE, #EFF6FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🏠</div>
                      )}
                      <span style={{ position: "absolute", top: 10, right: 10, background: p.purpose === "بيع" ? "#16a34a" : p.purpose === "إيجار يومي" ? "#7C3AED" : "#2563EB", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{p.purpose}</span>
                    </div>
                    <div style={{ padding: "14px" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</h3>
                      <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>📍 {p.district ? `${p.district}، ` : ""}{p.city}</p>
                      <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
                        {p.rooms > 0 && <span>🛏 {p.rooms}</span>}
                        {p.baths > 0 && <span>🚿 {p.baths}</span>}
                        {p.area && <span>📐 {p.area} م²</span>}
                      </div>
                      <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#2563EB" }}>{formatPrice(p.price, p.purpose)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects Tab — للمقاول/المهندس */}
        {activeTab === "projects" && isContractorOrEngineer && (
          <div style={{ marginBottom: 40 }}>
            {projects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔨</div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>لا توجد مشاريع بعد</p>
              </div>
            ) : (
              <div>
                {projects.map((proj: any) => (
                  <div key={proj.id} style={{ background: "#fff", borderRadius: 20, padding: "20px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
                    <div style={{ marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{proj.title || proj.name}</h3>
                      {proj.description && <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>{proj.description}</p>}
                      {proj.city && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>📍 {proj.city}</p>}
                    </div>
                    {/* صور المشروع — grid قابل للتكبير */}
                    {proj.images?.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
                        {proj.images.map((img: string, idx: number) => (
                          <div key={idx} className="proj-img"
                            onClick={() => openLightbox(proj.images, idx)}
                            style={{ aspectRatio: "1", overflow: "hidden", borderRadius: 10, background: "#F3F4F6" }}>
                            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reels Tab */}
        {activeTab === "reels" && (
          <div style={{ marginBottom: 40 }}>
            {reels.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>لم ينشر أي Reels بعد</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
                {reels.map(reel => (
                  <div key={reel.id} className="reel-card" onClick={() => router.push(`/reels/${reel.id}`)}
                    style={{ position: "relative", aspectRatio: "9/16", background: "#0f172a", borderRadius: 8, overflow: "hidden", cursor: "pointer", transition: "opacity 0.2s" }}>
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
                    <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10 }}>👁️</span>
                      <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{reel.views_count || 0}</span>
                    </div>
                    {reel.category && (
                      <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(37,99,235,0.85)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>
                        {reel.category}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}