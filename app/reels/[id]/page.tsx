"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ReelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reel, setReel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data } = await supabase
        .from("reels")
        .select("*, profiles!reels_user_id_fkey(id, full_name, avatar_url, role)")
        .eq("id", params.id)
        .single();

      if (!data) { router.push("/reels"); return; }
      setReel(data);

      // تحديث المشاهدات
      const key = `viewed_reel_${data.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        await supabase.from("reels").update({ views_count: (data.views_count || 0) + 1 }).eq("id", data.id);
      }

      if (user) {
        const [{ data: like }, { data: save }, { data: follow }] = await Promise.all([
          supabase.from("reel_likes").select("id").eq("user_id", user.id).eq("reel_id", data.id).maybeSingle(),
          supabase.from("reel_saves").select("id").eq("user_id", user.id).eq("reel_id", data.id).maybeSingle(),
          supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", data.user_id).maybeSingle(),
        ]);
        setLiked(!!like);
        setSaved(!!save);
        setFollowed(!!follow);
      }

      const { data: commentsData } = await supabase
        .from("reel_comments")
        .select("*, profiles!reel_comments_user_id_fkey(full_name, avatar_url)")
        .eq("reel_id", data.id)
        .order("created_at", { ascending: true });
      setComments(commentsData || []);
      setLoading(false);
    };
    if (params.id) load();
  }, [params.id]);

  const toggleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    if (liked) {
      await supabase.from("reel_likes").delete().eq("user_id", user.id).eq("reel_id", reel.id);
      await supabase.from("reels").update({ likes_count: Math.max(0, reel.likes_count - 1) }).eq("id", reel.id);
      setLiked(false);
      setReel((prev: any) => ({ ...prev, likes_count: Math.max(0, prev.likes_count - 1) }));
    } else {
      await supabase.from("reel_likes").insert({ user_id: user.id, reel_id: reel.id });
      await supabase.from("reels").update({ likes_count: (reel.likes_count || 0) + 1 }).eq("id", reel.id);
      setLiked(true);
      setReel((prev: any) => ({ ...prev, likes_count: (prev.likes_count || 0) + 1 }));
      if (reel.user_id !== user.id) {
        const { data: liker } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        await supabase.from("notifications").insert({
          user_id: reel.user_id, title: "إعجاب جديد بـ Reel",
          body: `${liker?.full_name || "أحدهم"} أعجبه Reel الخاص بك`,
          type: "like", read: false, link: `/reels/${reel.id}`
        });
      }
    }
  };

  const toggleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    if (saved) {
      await supabase.from("reel_saves").delete().eq("user_id", user.id).eq("reel_id", reel.id);
      setSaved(false);
    } else {
      await supabase.from("reel_saves").insert({ user_id: user.id, reel_id: reel.id });
      setSaved(true);
    }
  };

  const toggleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    if (user.id === reel.user_id) return;
    if (followed) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", reel.user_id);
      setFollowed(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: reel.user_id });
      setFollowed(true);
      const { data: follower } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      await supabase.from("notifications").insert({
        user_id: reel.user_id, title: "متابع جديد",
        body: `${follower?.full_name || "أحدهم"} بدأ بمتابعتك`,
        type: "follow", read: false, link: `/profile/${user.id}`
      });
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    await supabase.from("reel_comments").insert({ user_id: user.id, reel_id: reel.id, content: newComment.trim() });
    await supabase.from("reels").update({ comments_count: (reel.comments_count || 0) + 1 }).eq("id", reel.id);
    setReel((prev: any) => ({ ...prev, comments_count: (prev.comments_count || 0) + 1 }));
    if (reel.user_id !== user.id) {
      const { data: commenter } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      await supabase.from("notifications").insert({
        user_id: reel.user_id, title: "تعليق جديد على Reel",
        body: `${commenter?.full_name || "أحدهم"} علّق: ${newComment.trim().slice(0, 50)}`,
        type: "comment", read: false, link: `/reels/${reel.id}`
      });
    }
    setNewComment("");
    const { data } = await supabase
      .from("reel_comments")
      .select("*, profiles!reel_comments_user_id_fkey(full_name, avatar_url)")
      .eq("reel_id", reel.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/reels/${reel.id}`;
    const text = `🎬 ${reel.title || "شاهد هذا الريلز"}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) return (
    <div style={{ background: "#000", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Cairo', sans-serif", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>🎬</div>
      <p style={{ fontSize: 16, fontWeight: 700 }}>جاري التحميل...</p>
    </div>
  );

  if (!reel) return null;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#000", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .action-btn { transition: transform 0.15s; cursor: pointer; }
        .action-btn:hover { transform: scale(1.15); }
        .comments-drawer { animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480, position: "relative", height: "100vh", overflow: "hidden" }}>

        {/* زر الرجوع */}
        <button onClick={() => router.back()}
          style={{ position: "absolute", top: 16, right: 16, zIndex: 100, width: 36, height: 36, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ←
        </button>

        {/* الفيديو */}
        {reel.video_url ? (
          <video ref={videoRef} src={reel.video_url} poster={reel.thumbnail_url}
            autoPlay loop muted={muted} playsInline
            onClick={() => setMuted(!muted)}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0c4a6e, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>🏠</div>
        )}

        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 50%, rgba(0,0,0,0.85) 100%)" }} />

        {/* زر الصوت */}
        <button onClick={() => setMuted(!muted)}
          style={{ position: "absolute", top: 16, left: 16, zIndex: 100, width: 36, height: 36, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            {muted
              ? <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
              : <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            }
          </svg>
        </button>

        {/* تاغ الفئة */}
        {reel.category && (
          <div style={{ position: "absolute", top: 60, right: 16, background: "rgba(22,163,74,0.85)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, zIndex: 10 }}>
            {reel.category}
          </div>
        )}

        {/* أزرار الجانب */}
        <div style={{ position: "absolute", bottom: 120, right: 12, display: "flex", flexDirection: "column", gap: 18, zIndex: 10, alignItems: "center" }}>

          <div className="action-btn" onClick={toggleLike} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "white"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{reel.likes_count || 0}</span>
          </div>

          <div className="action-btn" onClick={() => setShowComments(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{reel.comments_count || 0}</span>
          </div>

          <div className="action-btn" onClick={toggleSave} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>حفظ</span>
          </div>

          <div className="action-btn" onClick={shareWhatsApp} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </div>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>واتساب</span>
          </div>

          <div className="action-btn" onClick={copyLink} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 40, height: 40, background: copiedLink ? "rgba(22,163,74,0.6)" : "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <span style={{ color: copiedLink ? "#4ade80" : "#fff", fontSize: 11, fontWeight: 700 }}>{copiedLink ? "تم!" : "رابط"}</span>
          </div>

          {reel.property_id && (
            <div className="action-btn" onClick={() => router.push(`/properties/${reel.property_id}`)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>العقار</span>
            </div>
          )}
        </div>

        {/* معلومات أسفل */}
        <div style={{ position: "absolute", bottom: 24, right: 70, left: 16, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div onClick={() => router.push(`/profile/${reel.profiles?.id}`)}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700, border: "2px solid #fff", flexShrink: 0, cursor: "pointer", overflow: "hidden" }}>
              {reel.profiles?.avatar_url
                ? <img src={reel.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : reel.profiles?.full_name?.[0] || "؟"
              }
            </div>
            <div style={{ flex: 1 }}>
              <div onClick={() => router.push(`/profile/${reel.profiles?.id}`)}
                style={{ color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {reel.profiles?.full_name || "مستخدم"}
                <span style={{ fontSize: 11, color: "#4ade80" }}>✓</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{reel.profiles?.role || "وسيط"}</div>
            </div>
            {currentUser?.id !== reel.user_id && (
              <button onClick={toggleFollow}
                style={{ background: followed ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", flexShrink: 0 }}>
                {followed ? "متابَع" : "+ تابع"}
              </button>
            )}
          </div>
          {reel.title && <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{reel.title}</div>}
          {reel.description && <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.6 }}>{reel.description}</div>}
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            <span>👁️ {reel.views_count || 0} مشاهدة</span>
            <span>❤️ {reel.likes_count || 0} إعجاب</span>
          </div>
        </div>

      </div>

      {/* درج التعليقات */}
      {showComments && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div onClick={() => setShowComments(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div className="comments-drawer" style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1a1a1a", borderRadius: "20px 20px 0 0", padding: "20px", maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "'Cairo', sans-serif" }}>التعليقات ({reel.comments_count || 0})</h3>
              <button onClick={() => setShowComments(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
              {comments.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px", fontFamily: "'Cairo', sans-serif" }}>لا توجد تعليقات بعد</p>
              ) : comments.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                    {c.profiles?.full_name?.[0] || "؟"}
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 2, fontFamily: "'Cairo', sans-serif" }}>{c.profiles?.full_name}</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "'Cairo', sans-serif" }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                placeholder="اكتب تعليقاً..."
                style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: "none" }} />
              <button onClick={submitComment}
                style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
