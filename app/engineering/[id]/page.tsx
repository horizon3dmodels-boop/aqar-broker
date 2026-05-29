"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EngineeringDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [office, setOffice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [allReviewsList, setAllReviewsList] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);

  const [followed, setFollowed] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .eq("role", "engineer")
        .single();

      if (!data) { router.push("/engineering"); return; }
      setOffice(data);

      const { data: reviews } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)")
        .eq("target_id", params.id)
        .eq("target_type", "engineer")
        .order("created_at", { ascending: false });

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setTotalReviews(reviews.length);
        setAllReviewsList(reviews);
      }

      const { data: reelsData } = await supabase
        .from("reels")
        .select("id, title, thumbnail_url, likes_count, category")
        .eq("user_id", params.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setReels(reelsData || []);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: myReview } = await supabase
          .from("reviews")
          .select("*")
          .eq("reviewer_id", user.id)
          .eq("target_id", String(params.id))
          .eq("target_type", "engineer")
          .maybeSingle();
        if (myReview) {
          setUserRating(myReview.rating);
          setReviewComment(myReview.comment || "");
          setReviewSent(true);
        }
        const { data: followData } = await supabase
          .from("follows").select("id")
          .eq("follower_id", user.id)
          .eq("following_id", params.id)
          .maybeSingle();
        setFollowed(!!followData);
      }
      const { count: followers } = await supabase
        .from("follows").select("*", { count: "exact", head: true })
        .eq("following_id", params.id);
      setFollowersCount(followers || 0);

      setLoading(false);
    };
    if (params.id) load();
  }, [params.id, router]);

  const toggleFollow = async () => {
    if (!currentUser) { router.push("/auth/login"); return; }
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
        user_id: params.id,
        title: "متابع جديد",
        body: `${follower?.full_name || "أحدهم"} بدأ بمتابعتك`,
        type: "follow",
        read: false,
        link: `/profile/${currentUser.id}`
      });
    }
  };

  const submitReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    if (userRating === 0) return;

    await supabase.from("reviews").upsert({
      reviewer_id: user.id,
      target_id: String(params.id),
      target_type: "engineer",
      rating: userRating,
      comment: reviewComment,
    }, { onConflict: "reviewer_id,target_id,target_type" });

    setReviewSent(true);

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)")
      .eq("target_id", String(params.id))
      .eq("target_type", "engineer")
      .order("created_at", { ascending: false });
    if (reviews) {
      const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setTotalReviews(reviews.length);
      setAllReviewsList(reviews);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "100px", fontFamily: "Cairo", fontSize: 18, fontWeight: 600 }}>جاري التحميل...</div>;
  if (!office) return null;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tab-btn { transition: all 0.2s; cursor: pointer; }
        .star-btn { transition: color 0.15s; cursor: pointer; }
        .reel-card:hover { opacity: 0.85; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0", padding: "12px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", fontSize: 13, color: "#9CA3AF", display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/" style={{ color: "#0284c7", textDecoration: "none" }}>الرئيسية</a>
          <span>←</span>
          <a href="/engineering" style={{ color: "#0284c7", textDecoration: "none" }}>المكاتب الهندسية</a>
          <span>←</span>
          <span style={{ color: "#374151", fontWeight: 600 }}>{office.full_name}</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0c4a6e, #0284c7)", padding: "40px 24px 60px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {office.avatar_url ? (
              <img src={office.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ color: "#fff", fontSize: 32, fontWeight: 900 }}>{office.full_name?.[0] || "م"}</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{office.full_name}</h1>
              {office.verified && (
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>موثّق ✓</span>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 4 }}>
              📐 مكتب هندسي · 📍 {office.city || "غير محدد"} · 👥 {followersCount} متابع
            </p>
            {totalReviews > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <span style={{ color: "#FDE68A", fontSize: 16 }}>{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</span>
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700 }}>{avgRating} ({totalReviews} تقييم)</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {currentUser?.id !== params.id && (
              <button onClick={toggleFollow}
                style={{ background: followed ? "rgba(255,255,255,0.15)" : "#fff", color: followed ? "#fff" : "#0c4a6e", border: followed ? "1.5px solid rgba(255,255,255,0.4)" : "none", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                {followed ? "✓ متابَع" : "+ تابع"}
              </button>
            )}
            <button onClick={() => window.open(`https://wa.me/${office.phone}`, "_blank")}
              style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              💬 واتساب
            </button>
            <button onClick={() => window.location.href = `tel:${office.phone}`}
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              📞 اتصال
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "-20px auto 0", padding: "0 24px 40px", display: "flex", gap: 24 }}>

        {/* Main */}
        <div style={{ flex: 1 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: "#F3F4F6", padding: 4, borderRadius: 12, width: "fit-content", marginBottom: 20 }}>
              {[
                { id: "about", label: "📋 نبذة عن المكتب" },
                { id: "reels", label: `🎬 Reels (${reels.length})` },
                { id: "reviews", label: `⭐ التقييمات (${totalReviews})` },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="tab-btn" style={{
                  padding: "9px 20px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif",
                  background: activeTab === tab.id ? "#0284c7" : "transparent",
                  color: activeTab === tab.id ? "#fff" : "#6B7280",
                  boxShadow: activeTab === tab.id ? "0 2px 8px rgba(2,132,199,0.3)" : "none",
                }}>{tab.label}</button>
              ))}
            </div>

            {/* نبذة */}
            {activeTab === "about" && (
              <div>
                {office.bio ? (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>عن المكتب</h3>
                    <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 2 }}>{office.bio}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", padding: "20px" }}>لم يضف المكتب نبذة بعد.</p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {office.commercial_register && (
                    <div style={{ background: "#F0F9FF", borderRadius: 14, padding: "16px", border: "1px solid #BAE6FD" }}>
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>السجل التجاري</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📋 {office.commercial_register}</div>
                    </div>
                  )}
                  {office.phone && (
                    <div style={{ background: "#F0FDF4", borderRadius: 14, padding: "16px", border: "1px solid #BBF7D0" }}>
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>رقم التواصل</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📞 {office.phone}</div>
                    </div>
                  )}
                  {office.city && (
                    <div style={{ background: "#FFFBEB", borderRadius: 14, padding: "16px", border: "1px solid #FDE68A" }}>
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>المدينة</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📍 {office.city}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reels */}
            {activeTab === "reels" && (
              <div>
                {reels.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>لم ينشر المكتب أي Reels بعد</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
                    {reels.map((reel) => (
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
                        {reel.category && (
                          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(2,132,199,0.85)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>
                            {reel.category}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* التقييمات */}
            {activeTab === "reviews" && (
              <div>
                {allReviewsList.length === 0 ? (
                  <p style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", padding: "30px" }}>لا توجد تقييمات بعد. كن أول من يقيّم!</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {allReviewsList.map((r: any) => (
                      <div key={r.id} style={{ background: "#F8F9FB", borderRadius: 14, padding: "16px", border: "1px solid #F0F0F0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                              {r.profiles?.avatar_url ? (
                                <img src={r.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{r.profiles?.full_name?.[0] || "م"}</span>
                              )}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{r.profiles?.full_name || "مستخدم"}</span>
                          </div>
                          <div style={{ color: "#F59E0B", fontSize: 16 }}>
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          </div>
                        </div>
                        {r.comment && <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7 }}>{r.comment}</p>}
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>{new Date(r.created_at).toLocaleDateString("ar-SA")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>تواصل مع المكتب</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => window.open(`https://wa.me/${office.phone}`, "_blank")}
                style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                💬 تواصل عبر واتساب
              </button>
              <button onClick={() => window.location.href = `tel:${office.phone}`}
                style={{ width: "100%", background: "#0284c7", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                📞 اتصل الآن
              </button>
            </div>
          </div>

          {/* التقييم */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>⭐ قيّم المكتب</h3>
            {totalReviews > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: "#FFFBEB", borderRadius: 12, padding: "10px 14px" }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#92400E" }}>{avgRating}</span>
                <span style={{ color: "#F59E0B", fontSize: 16 }}>{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>({totalReviews} تقييم)</span>
              </div>
            )}
            {reviewSent ? (
              <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>شكراً على تقييمك!</p>
                <div style={{ color: "#F59E0B", fontSize: 20, marginTop: 6 }}>{"★".repeat(userRating)}{"☆".repeat(5 - userRating)}</div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 10, textAlign: "center" }}>كيف تقيّم هذا المكتب؟</p>
                <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className="star-btn"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(star)}
                      style={{ fontSize: 30, color: star <= (hoverRating || userRating) ? "#F59E0B" : "#E5E7EB" }}>★</span>
                  ))}
                </div>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="أضف تعليقاً (اختياري)..." rows={3}
                  style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "10px 12px", fontSize: 12, fontFamily: "'Cairo', sans-serif", color: "#374151", resize: "none", outline: "none", marginBottom: 10 }} />
                <button onClick={submitReview} disabled={userRating === 0}
                  style={{ width: "100%", background: userRating === 0 ? "#E5E7EB" : "#0284c7", color: userRating === 0 ? "#9CA3AF" : "#fff", border: "none", borderRadius: 12, padding: "11px", fontSize: 13, fontWeight: 700, cursor: userRating === 0 ? "not-allowed" : "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  إرسال التقييم ⭐
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
