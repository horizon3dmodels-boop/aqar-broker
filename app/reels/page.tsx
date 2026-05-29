"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const tabs = ["الكل", "عقار", "تصميم وتنفيذ"];

export default function ReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("الكل");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<string[]>([]);
  const [savedReels, setSavedReels] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [activeReel, setActiveReel] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [muted, setMuted] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRestart, setShowRestart] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReels(activeTab);
    fetchUserData();
  }, [activeTab]);

  useEffect(() => {
    const border = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute("data-index") || "0");
          if (entry.isIntersecting) {
            setCurrentIndex(index);
            videoRefs.current[index]?.play().catch(() => {});
            videoRefs.current.forEach((v, i) => {
              if (i !== index) v?.pause();
            });
            if (index === filtered.length - 1 && filtered.length > 0) {
              setShowRestart(true);
              setTimeout(() => {
                setShowRestart(false);
                containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }, 2500);
            }
            incrementViews(filtered[index]);
          }
        });
      },
      { threshold: 0.7 }
    );
    document.querySelectorAll(".reel-item").forEach((el) => border.observe(el));
    return () => border.disconnect();
  }, [reels]);

  const fetchReels = async (tab: string) => {
    setLoading(true);
    let query = supabase
      .from("reels")
      .select("*, profiles!reels_user_id_fkey(id, full_name, avatar_url, role)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (tab === "عقار") query = query.eq("category", "عقار");
    else if (tab === "تصميم وتنفيذ")
      query = query.in("category", ["مقاولات", "ديكور", "هندسة", "تشطيب"]);

    const { data } = await query;
    setReels(data || []);
    setLoading(false);
  };

  const incrementViews = async (reel: any) => {
    const key = `viewed_reel_${reel.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    await supabase.from("reels").update({ views_count: (reel.views_count || 0) + 1 }).eq("id", reel.id);
    setReels((prev) => prev.map((r) => r.id === reel.id ? { ...r, views_count: (r.views_count || 0) + 1 } : r));
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: likes }, { data: saves }, { data: follows }] = await Promise.all([
      supabase.from("reel_likes").select("reel_id").eq("user_id", user.id),
      supabase.from("reel_saves").select("reel_id").eq("user_id", user.id),
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
    ]);
    setLikedReels(likes?.map((l) => l.reel_id) || []);
    setSavedReels(saves?.map((s) => s.reel_id) || []);
    setFollowedUsers(follows?.map((f) => f.following_id) || []);
  };

  const toggleLike = async (e: React.MouseEvent, reel: any) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    const isLiked = likedReels.includes(reel.id);
    if (isLiked) {
      await supabase.from("reel_likes").delete().eq("user_id", user.id).eq("reel_id", reel.id);
      await supabase.from("reels").update({ likes_count: Math.max(0, reel.likes_count - 1) }).eq("id", reel.id);
      setLikedReels((prev) => prev.filter((id) => id !== reel.id));
      setReels((prev) => prev.map((r) => r.id === reel.id ? { ...r, likes_count: Math.max(0, r.likes_count - 1) } : r));
    } else {
      await supabase.from("reel_likes").insert({ user_id: user.id, reel_id: reel.id });
      await supabase.from("reels").update({ likes_count: reel.likes_count + 1 }).eq("id", reel.id);
      setLikedReels((prev) => [...prev, reel.id]);
      setReels((prev) => prev.map((r) => r.id === reel.id ? { ...r, likes_count: r.likes_count + 1 } : r));
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

  const toggleSave = async (e: React.MouseEvent, reel: any) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    const isSaved = savedReels.includes(reel.id);
    if (isSaved) {
      await supabase.from("reel_saves").delete().eq("user_id", user.id).eq("reel_id", reel.id);
      setSavedReels((prev) => prev.filter((id) => id !== reel.id));
    } else {
      await supabase.from("reel_saves").insert({ user_id: user.id, reel_id: reel.id });
      setSavedReels((prev) => [...prev, reel.id]);
    }
  };

  const toggleFollow = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    if (user.id === userId) return;
    const isFollowed = followedUsers.includes(userId);
    if (isFollowed) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
      setFollowedUsers((prev) => prev.filter((id) => id !== userId));
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
      setFollowedUsers((prev) => [...prev, userId]);
      const { data: follower } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      await supabase.from("notifications").insert({
        user_id: userId, title: "متابع جديد",
        body: `${follower?.full_name || "أحدهم"} بدأ بمتابعتك`,
        type: "follow", read: false, link: `/profile/${user.id}`
      });
    }
  };

  const openComments = async (e: React.MouseEvent, reel: any) => {
    e.stopPropagation();
    setActiveReel(reel);
    const { data } = await supabase
      .from("reel_comments")
      .select("*, profiles!reel_comments_user_id_fkey(full_name, avatar_url)")
      .eq("reel_id", reel.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setShowComments(true);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activeReel) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    await supabase.from("reel_comments").insert({ user_id: user.id, reel_id: activeReel.id, content: newComment.trim() });
    if (activeReel.user_id !== user.id) {
      const { data: commenter } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      await supabase.from("notifications").insert({
        user_id: activeReel.user_id, title: "تعليق جديد على Reel",
        body: `${commenter?.full_name || "أحدهم"} علّق: ${newComment.trim().slice(0, 50)}`,
        type: "comment", read: false, link: `/reels/${activeReel.id}`
      });
    }
    await supabase.from("reels").update({ comments_count: activeReel.comments_count + 1 }).eq("id", activeReel.id);
    setNewComment("");
    const { data } = await supabase
      .from("reel_comments")
      .select("*, profiles!reel_comments_user_id_fkey(full_name, avatar_url)")
      .eq("reel_id", activeReel.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const shareReel = (e: React.MouseEvent, reel: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/reels/${reel.id}`;
    const text = `🎬 ${reel.title || "شاهد هذا الريلز"}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyReelLink = (e: React.MouseEvent, reel: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/reels/${reel.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(reel.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = reels.filter((r) => {
    if (!searchText) return true;
    return r.title?.includes(searchText) || r.description?.includes(searchText);
  });

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#000", minHeight: "100vh", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .reel-item { height: 100vh; width: 100%; scroll-snap-align: start; position: relative; overflow: hidden; }
        .reels-container { height: 100vh; overflow-y: scroll; scroll-snap-type: y mandatory; scrollbar-width: none; }
        .reels-container::-webkit-scrollbar { display: none; }
        .action-btn { transition: transform 0.15s; cursor: pointer; }
        .action-btn:hover { transform: scale(1.15); }
        .tab-pill { transition: all 0.2s; cursor: pointer; }
        .comments-drawer { animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .search-bar { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 16px 0" }}>
        {/* تابات */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: showSearch ? 10 : 0 }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="tab-pill"
              style={{
                background: activeTab === tab ? "#fff" : "rgba(255,255,255,0.2)",
                color: activeTab === tab ? "#0f172a" : "#fff",
                border: "none", borderRadius: 20,
                padding: "6px 16px", fontSize: 12, fontWeight: 700,
                fontFamily: "'Cairo', sans-serif", cursor: "pointer"
              }}>
              {tab}
            </button>
          ))}
          <button onClick={() => setShowSearch(!showSearch)} className="action-btn"
            style={{ width: 34, height: 34, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>

        {/* شريط البحث */}
        {showSearch && (
          <div className="search-bar" style={{ margin: "10px 0", background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(10px)" }}>
            <input
              type="text"
              placeholder="ابحث في Reels..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "'Cairo', sans-serif" }}
              autoFocus
            />
            {searchText && (
              <button onClick={() => setSearchText("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 16 }}>×</button>
            )}
          </div>
        )}
      </div>

      {/* زر رفع Reel */}
      <button onClick={() => router.push("/reels/upload")}
        style={{
          position: "fixed", bottom: 100, left: 20, zIndex: 100,
          width: 52, height: 52, background: "#16a34a",
          border: "none", borderRadius: "50%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(22,163,74,0.5)"
        }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {/* Reels */}
      {loading ? (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 48 }}>🎬</div>
          <p style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>جاري تحميل Reels...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64 }}>🎬</div>
          <p style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Cairo', sans-serif" }}>لا توجد Reels بعد</p>
          <button onClick={() => router.push("/reels/upload")}
            style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
            كن أول من ينشر
          </button>
        </div>
      ) : (
        <div className="reels-container" ref={containerRef}>
          {filtered.map((reel, index) => (
            <div key={reel.id} className="reel-item" data-index={index}>

              {/* الفيديو */}
              {reel.video_url ? (
                <video
                  ref={(el) => { videoRefs.current[index] = el; }}
                  src={reel.video_url}
                  poster={reel.thumbnail_url}
                  loop muted={muted} playsInline
                  onClick={() => setMuted(!muted)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0c4a6e, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>
                  🏠
                </div>
              )}

              {/* Overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 50%, rgba(0,0,0,0.85) 100%)" }} />

              {/* كتم/تشغيل الصوت */}
              <button onClick={() => setMuted(!muted)}
                style={{ position: "absolute", top: 80, left: 16, width: 36, height: 36, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  {muted
                    ? <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
                    : <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  }
                </svg>
              </button>

              {/* تاغ الفئة */}
              {reel.category && (
                <div style={{ position: "absolute", top: 80, right: 16, background: "rgba(22,163,74,0.85)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, zIndex: 10, fontFamily: "'Cairo', sans-serif" }}>
                  {reel.category}
                </div>
              )}

              {/* أزرار الجانب الأيمن */}
              <div style={{ position: "absolute", bottom: 120, right: 12, display: "flex", flexDirection: "column", gap: 18, zIndex: 10, alignItems: "center" }}>

                {/* لايك */}
                <div className="action-btn" onClick={(e) => toggleLike(e, reel)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={likedReels.includes(reel.id) ? "#ef4444" : "none"} stroke={likedReels.includes(reel.id) ? "#ef4444" : "white"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>{reel.likes_count || 0}</span>
                </div>

                {/* تعليق */}
                <div className="action-btn" onClick={(e) => openComments(e, reel)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>{reel.comments_count || 0}</span>
                </div>

                {/* حفظ */}
                <div className="action-btn" onClick={(e) => toggleSave(e, reel)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={savedReels.includes(reel.id) ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>حفظ</span>
                </div>

                {/* واتساب */}
                <div className="action-btn" onClick={(e) => shareReel(e, reel)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>واتساب</span>
                </div>

                {/* نسخ الرابط */}
                <div className="action-btn" onClick={(e) => copyReelLink(e, reel)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 40, height: 40, background: copiedId === reel.id ? "rgba(22,163,74,0.6)" : "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </div>
                  <span style={{ color: copiedId === reel.id ? "#4ade80" : "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>
                    {copiedId === reel.id ? "تم!" : "رابط"}
                  </span>
                </div>

                {/* رابط العقار */}
                {reel.property_id && (
                  <div className="action-btn" onClick={(e) => { e.stopPropagation(); router.push(`/properties/${reel.property_id}`); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>العقار</span>
                  </div>
                )}
              </div>

              {/* معلومات أسفل اليسار */}
              <div style={{ position: "absolute", bottom: 24, right: 70, left: 16, zIndex: 10 }}>

                {/* بروفايل + تابع */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); router.push(`/profile/${reel.profiles?.id}`); }}
                    style={{ width: 38, height: 38, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700, border: "2px solid #fff", flexShrink: 0, cursor: "pointer", overflow: "hidden" }}>
                    {reel.profiles?.avatar_url
                      ? <img src={reel.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : reel.profiles?.full_name?.[0] || "؟"
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); router.push(`/profile/${reel.profiles?.id}`); }}
                      style={{ color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      {reel.profiles?.full_name || "مستخدم"}
                      <span style={{ fontSize: 11, color: "#4ade80" }}>✓</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{reel.profiles?.role || "وسيط"}</div>
                  </div>
                  <button
                    onClick={(e) => toggleFollow(e, reel.profiles?.id)}
                    style={{
                      background: followedUsers.includes(reel.profiles?.id) ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.2)",
                      color: "#fff", border: "1px solid rgba(255,255,255,0.5)",
                      borderRadius: 20, padding: "4px 14px",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      fontFamily: "'Cairo', sans-serif", flexShrink: 0
                    }}>
                    {followedUsers.includes(reel.profiles?.id) ? "متابَع" : "+ تابع"}
                  </button>
                </div>

                {/* العنوان والوصف */}
                {reel.title && (
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{reel.title}</div>
                )}
                {reel.description && (
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>
                    {reel.description.length > 80 ? reel.description.slice(0, 80) + "..." : reel.description}
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>
      )}

      {showRestart && (
        <div style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.85)", color: "#fff",
          borderRadius: 16, padding: "16px 28px",
          fontSize: 14, fontWeight: 700,
          fontFamily: "'Cairo', sans-serif",
          zIndex: 300, textAlign: "center",
          border: "1px solid rgba(255,255,255,0.15)"
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
          أعدنا التشغيل — اكتشف المزيد
        </div>
      )}

      {/* درج التعليقات */}
      {showComments && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div onClick={() => setShowComments(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div className="comments-drawer" style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "#1a1a1a", borderRadius: "20px 20px 0 0",
            padding: "20px", maxHeight: "70vh", display: "flex", flexDirection: "column"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "'Cairo', sans-serif" }}>
                التعليقات ({activeReel?.comments_count || 0})
              </h3>
              <button onClick={() => setShowComments(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
              {comments.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px", fontFamily: "'Cairo', sans-serif" }}>لا توجد تعليقات بعد</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                      {c.profiles?.full_name?.[0] || "؟"}
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 2, fontFamily: "'Cairo', sans-serif" }}>{c.profiles?.full_name}</div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "'Cairo', sans-serif" }}>{c.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                placeholder="اكتب تعليقاً..."
                style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: "none" }}
              />
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