"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PropertyDetailPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [similarProperties, setSimilarProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [viewsCount, setViewsCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchProperty = async () => {
      const { data } = await supabase
        .from("properties")
        .select("*, profiles!properties_user_id_fkey(full_name, phone, avatar_url, role)")
        .eq("id", params.id)
        .single();

      if (!data) { router.push("/properties"); return; }
      setProperty(data);

      const { data: { user } } = await supabase.auth.getUser();
      const alreadyViewed = localStorage.getItem(`viewed_${params.id}`);
      if (!alreadyViewed) {
        await supabase.rpc('increment_views', { property_id: data.id });
        localStorage.setItem(`viewed_${params.id}`, '1');
      }
      setViewsCount(data.views || 0);

      if (user) {
        const { data: fav } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('property_id', String(params.id)).single();
        if (fav) { setLiked(true); setFavoriteId(fav.id); }
      }

      const { data: similar } = await supabase.from("properties").select("*").eq("type", data.type).eq("status", "active").neq("id", data.id).limit(3);
      setSimilarProperties(similar || []);

      const { data: reviews } = await supabase.from('reviews').select('rating').eq('target_id', data.user_id).eq('target_type', 'broker');
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setTotalReviews(reviews.length);
      }

      if (user) {
        const { data: myReview } = await supabase.from('reviews').select('*').eq('reviewer_id', user.id).eq('target_id', data.user_id).eq('target_type', 'broker').maybeSingle();
        if (myReview) { setUserRating(myReview.rating); setReviewComment(myReview.comment || ""); setReviewSent(true); }
      }

      setLoading(false);
    };
    if (params.id) fetchProperty();
  }, [params.id, router]);

  useEffect(() => {
    if (activeTab !== "map" || !property || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    const lat = property.lat || property.latitude;
    const lng = property.lng || property.longitude;
    if (!lat || !lng) return;

    const loadMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

      mapboxgl.setRTLTextPlugin(
        'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
        () => {}, true
      );

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 15,
        language: "ar",
      });

      map.on('load', () => {
        const arabicLayers = ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label', 'road-label-simple'];
        arabicLayers.forEach(layer => {
          if (map.getLayer(layer)) {
            try { map.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); } catch (e) {}
          }
        });
      });

      new mapboxgl.Marker({ color: "#16a34a" })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<div style="font-family:'Cairo',sans-serif;font-size:13px;font-weight:700">${property.title}</div>`))
        .addTo(map);

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapInstanceRef.current = map;
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, property]);

  const submitReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }
    if (userRating === 0) return;
    await supabase.from('reviews').upsert({ reviewer_id: user.id, target_id: property.user_id, target_type: 'broker', rating: userRating, comment: reviewComment }, { onConflict: 'reviewer_id,target_id,target_type' });
    setReviewSent(true);
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('target_id', property.user_id).eq('target_type', 'broker');
    if (allReviews) {
      const avg = allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setTotalReviews(allReviews.length);
    }
  };

  const shareWhatsApp = () => {
    const url = window.location.href;
    const text = `🏠 ${property.title}\n📍 ${property.city}\n💰 ${Number(property.price)?.toLocaleString()} ر.س\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareTwitter = () => {
    const url = window.location.href;
    const text = `🏠 ${property.title} - ${Number(property.price)?.toLocaleString()} ر.س`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 1. إضافة دالة حفظ العقار في السلة والانتقال لصفحة العقارات العامة
  const addToCompare = () => {
    const existing = JSON.parse(localStorage.getItem("compareList") || "[]");
    const alreadyAdded = existing.find((x: any) => x.id === property.id);
    if (!alreadyAdded && existing.length < 4) {
      const newList = [...existing, property];
      localStorage.setItem("compareList", JSON.stringify(newList));
    }
    router.push("/properties?compare=true");
  };

  if (loading) return <div style={{ textAlign: "center", padding: "100px", fontFamily: "Cairo", fontSize: "18px", fontWeight: 600 }}>جاري التحميل...</div>;
  if (!property) return null;

  const hasCoords = !!(property.lat || property.latitude) && !!(property.lng || property.longitude);

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .thumb:hover { opacity: 0.8; }
        .thumb { transition: opacity 0.2s; cursor: pointer; }
        .feature-tag { transition: all 0.2s; }
        .feature-tag:hover { background: #f0fdf4 !important; border-color: #16a34a !important; color: #16a34a !important; }
        .tab-btn { transition: all 0.2s; }
        .similar-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.1) !important; }
        .similar-card { transition: all 0.25s; }
        .contact-btn:hover { background: #15803d !important; }
        .contact-btn { transition: all 0.2s; }
        .star-btn { transition: color 0.15s; }
        .share-btn-card { transition: all 0.2s; }
        .share-btn-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
        .mapboxgl-map { border-radius: 16px; }
      `}</style>

      {/* ✅ Breadcrumb — يتغير حسب purpose */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0", padding: "12px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", fontSize: 13, color: "#9CA3AF", display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/" style={{ color: "#16a34a", textDecoration: "none" }}>الرئيسية</a>
          <span>←</span>
          <a href={property.purpose === "إيجار يومي" ? "/daily-rent" : "/properties"} style={{ color: "#16a34a", textDecoration: "none" }}>
            {property.purpose === "إيجار يومي" ? "الإيجار اليومي" : "العقارات"}
          </a>
          <span>←</span>
          <span style={{ color: "#374151", fontWeight: 600 }}>{property.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px", display: "flex", gap: 24 }}>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Image Gallery */}
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
            <div style={{ position: "relative", height: 420 }}>
              <img src={property.images?.[activeImage]} alt={property.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 12, padding: "5px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                👁️ {viewsCount} مشاهدة
              </div>
              <button
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) { router.push("/auth/login"); return; }
                  if (liked && favoriteId) {
                    await supabase.from('favorites').delete().eq('id', favoriteId);
                    setLiked(false); setFavoriteId(null);
                  } else {
                    const { data } = await supabase.from('favorites').insert({ user_id: user.id, property_id: String(property.id) }).select('id').single();
                    setLiked(true); setFavoriteId(data?.id || null);
                  }
                }}
                style={{ position: "absolute", top: 16, left: 16, width: 40, height: 40, background: "rgba(255,255,255,0.95)", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                {liked ? "❤️" : "🤍"}
              </button>
              <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 12, padding: "4px 12px", borderRadius: 20 }}>
                {activeImage + 1} / {property.images?.length || 0}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: 12, overflowX: "auto" }}>
              {property.images?.map((img: string, i: number) => (
                <div key={i} className="thumb" onClick={() => setActiveImage(i)} style={{ width: 80, height: 56, borderRadius: 10, overflow: "hidden", border: activeImage === i ? "2.5px solid #16a34a" : "2px solid transparent", flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Title & Price */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{property.title}</h1>
                <p style={{ fontSize: 14, color: "#6B7280" }}>📍 {property.address || (property.district ? `${property.district}، ` : "") + property.city}</p>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#16a34a" }}>{Number(property.price)?.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
                  {property.purpose === "إيجار يومي" ? "ر.س / ليلة" : "ريال سعودي"}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
              {[
                { icon: "🛏", label: "غرف النوم", value: property.rooms || "—" },
                { icon: "🚿", label: "الحمامات", value: property.baths || "—" },
                { icon: "📐", label: "المساحة", value: property.area ? `${property.area} م²` : "—" },
                { icon: "🏗", label: "الأدوار", value: property.floor || "—" },
                { icon: "📅", label: "عمر العقار", value: property.age ? `${property.age} سنوات` : "—" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#F8F9FB", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F3F4F6", padding: 4, borderRadius: 12, width: "fit-content" }}>
              {(["details", "map", "similar"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className="tab-btn" style={{
                  padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif",
                  background: activeTab === tab ? "#16a34a" : "transparent",
                  color: activeTab === tab ? "#fff" : "#6B7280",
                  boxShadow: activeTab === tab ? "0 2px 8px rgba(22,163,74,0.3)" : "none",
                }}>
                  {tab === "details" ? "📋 التفاصيل" : tab === "map" ? "🗺️ الموقع" : "🏠 عقارات مشابهة"}
                </button>
              ))}
            </div>

            {activeTab === "details" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>وصف العقار</h3>
                <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 2, marginBottom: 24 }}>{property.description || "لا يوجد وصف."}</p>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>المميزات والمرافق</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {property.features?.map((f: string, i: number) => (
                    <span key={i} className="feature-tag" style={{ background: "#F8F9FB", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>✓ {f}</span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "map" && (
              <div>
                {hasCoords ? (
                  <div ref={mapRef} style={{ width: "100%", height: 380, borderRadius: 16, overflow: "hidden" }} />
                ) : (
                  <div style={{ background: "#F3F4F6", borderRadius: 16, height: 320, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 48 }}>🗺️</div>
                    <p style={{ fontSize: 14, color: "#6B7280", fontWeight: 600 }}>الموقع غير محدد لهذا العقار</p>
                    <div style={{ background: "#fff", borderRadius: 12, padding: "10px 20px", fontSize: 13, color: "#374151", fontWeight: 600, border: "1.5px solid #E5E7EB" }}>
                      📍 {property.address || property.city}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "similar" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {similarProperties.map((p) => (
                  <div key={p.id} className="similar-card" onClick={() => router.push(`/properties/${p.id}`)} style={{ background: "#F8F9FB", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer", border: "1px solid #F0F0F0" }}>
                    <div style={{ height: 130, overflow: "hidden" }}>
                      <img src={p.images?.[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>🛏 {p.rooms} غرف · 📐 {p.area} م²</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>{Number(p.price)?.toLocaleString()} <span style={{ fontSize: 11, color: "#9CA3AF" }}>ر.س</span></div>
                    </div>
                  </div>
                ))}
                {similarProperties.length === 0 && (
                  <p style={{ fontSize: 13, color: "#6B7280", gridColumn: "span 3", textAlign: "center", padding: "20px" }}>لا توجد عقارات مشابهة.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Broker Card */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>تواصل مع الوسيط</h3>
              <div onClick={() => router.push(`/profile/${property.user_id}`)}
                style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "16px", background: "#F8F9FB", borderRadius: 16, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F0FDF4")}
                onMouseLeave={e => (e.currentTarget.style.background = "#F8F9FB")}>
                <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {property.profiles?.avatar_url ? (
                    <img src={property.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>{property.profiles?.full_name?.[0] || "و"}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{property.profiles?.full_name || "وسيط عقاري"}</span>
                    <span style={{ background: "#DCFCE7", color: "#16a34a", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>موثّق ✓</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                    {totalReviews > 0 ? <span>⭐ {avgRating} · ({totalReviews} تقييم)</span> : <span>⭐ لا يوجد تقييم بعد</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 4 }}>
                    زيارة الملف الشخصي ←
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="contact-btn"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { router.push("/auth/login"); return; }
                    window.location.href = `tel:${property.profiles?.phone || ""}`;
                  }}
                  style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
                  📞 اتصل بالوسيط
                </button>
                <button
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { router.push("/auth/login"); return; }
                    window.open(`https://wa.me/${property.profiles?.phone || ""}`, "_blank");
                  }}
                  style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  💬 تواصل عبر واتساب
                </button>
                <button
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { router.push("/auth/login"); return; }
                    setShowContact(!showContact);
                  }}
                  style={{ background: "#F8F9FB", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  ✉️ أرسل رسالة
                </button>
              </div>

              {showContact && (
                <div style={{ marginTop: 16 }}>
                  {sent && (
                    <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                      ✅ تم إرسال رسالتك بنجاح!
                    </div>
                  )}
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder={`بخصوص إعلانك رقم ${property.property_code || property.id}...\nاكتب رسالتك هنا`}
                    rows={4}
                    style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", resize: "none", outline: "none" }}
                  />
                  <button
                    onClick={async () => {
                      if (!message.trim()) return;
                      const { data: { session } } = await supabase.auth.getSession();
                      const { data: senderProfile } = await supabase.from('profiles').select('full_name').eq('id', session?.user?.id).single();
                      const fullMessage = `بخصوص إعلانك رقم ${property.property_code || property.id}\n${message.trim()}`;
                      const { error } = await supabase.from('messages').insert({ sender_id: session?.user?.id || null, receiver_id: property.user_id, content: fullMessage, sender_name: senderProfile?.full_name || session?.user?.email || 'زائر', property_id: String(property.id), project_name: property.title });
                      if (!error) {
                        const { data: existingNotif } = await supabase.from('notifications').select('id').eq('user_id', property.user_id).eq('type', 'message').eq('read', false).eq('link', `/messages?user=${session?.user?.id}&property=${property.id}`).maybeSingle();
                        if (existingNotif) { await supabase.from('notifications').update({ body: `رسالة جديدة بخصوص إعلانك: ${property.title}`, created_at: new Date().toISOString() }).eq('id', existingNotif.id); }
                        else { await supabase.from('notifications').insert({ user_id: property.user_id, title: 'رسالة جديدة', body: `رسالة جديدة بخصوص إعلانك: ${property.title}`, type: 'message', read: false, link: `/messages?user=${session?.user?.id}&property=${property.id}` }); }
                        setMessage(''); setSent(true);
                        setTimeout(() => { setSent(false); setShowContact(false); }, 3000);
                      }
                    }}
                    style={{ width: "100%", marginTop: 10, background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                    إرسال الرسالة ←
                  </button>
                </div>
              )}

              <div style={{ marginTop: 16, padding: "16px", background: "#FFFBEB", borderRadius: 14, border: "1.5px solid #FDE68A" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span>🤖</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>تحليل AI للسعر</span>
                </div>
                <p style={{ fontSize: 12, color: "#78350F", lineHeight: 1.8 }}>السعر المطلوب متوافق مع متوسط الأسعار الحالية في المنطقة لهذا النوع من العقارات.</p>
              </div>
            </div>

            {/* 2. زر المقارنة مضاف هنا مباشرة قبل كارد مشاركة العقار */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
              <button onClick={addToCompare}
                style={{ width: "100%", background: "#0f172a", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                ⚖️ أضف للمقارنة
              </button>
              <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 8, fontFamily: "'Cairo', sans-serif" }}>
                سيتم نقلك لصفحة العقارات لاختيار عقارات أخرى
              </p>
            </div>

            {/* مشاركة العقار */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>مشاركة العقار</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={copyLink} className="share-btn-card" style={{ flex: 1, background: copiedLink ? "#F0FDF4" : "#F8F9FB", border: `1.5px solid ${copiedLink ? "#BBF7D0" : "#E5E7EB"}`, borderRadius: 12, padding: "12px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={copiedLink ? "#16a34a" : "#6B7280"} strokeWidth="2" strokeLinecap="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <span style={{ fontSize: 10, color: copiedLink ? "#16a34a" : "#6B7280", fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>{copiedLink ? "تم النسخ!" : "نسخ الرابط"}</span>
                </button>
                <button onClick={shareWhatsApp} className="share-btn-card" style={{ flex: 1, background: "#F0FFF4", border: "1.5px solid #BBF7D0", borderRadius: 12, padding: "12px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.535 5.849L.057 23.985l6.284-1.648A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 01-5.031-1.371l-.361-.214-3.732.979 1.001-3.648-.235-.374A9.86 9.86 0 012.1 12c0-5.464 4.436-9.9 9.9-9.9s9.9 4.436 9.9 9.9-4.436 9.9-9.9 9.9z"/>
                  </svg>
                  <span style={{ fontSize: 10, color: "#25D366", fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>واتساب</span>
                </button>
                <button onClick={shareTwitter} className="share-btn-card" style={{ flex: 1, background: "#F8F9FB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span style={{ fontSize: 10, color: "#374151", fontFamily: "'Cairo', sans-serif", fontWeight: 700 }}>تويتر</span>
                </button>
              </div>
            </div>

            {/* التقييم */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>⭐ تقييم الوسيط</h3>
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
                  <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 10, textAlign: "center" }}>كيف تقيّم هذا الوسيط؟</p>
                  <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className="star-btn"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setUserRating(star)}
                        style={{ fontSize: 30, cursor: "pointer", color: star <= (hoverRating || userRating) ? "#F59E0B" : "#E5E7EB" }}>★</span>
                    ))}
                  </div>
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="أضف تعليقاً (اختياري)..." rows={3}
                    style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "10px 12px", fontSize: 12, fontFamily: "'Cairo', sans-serif", color: "#374151", resize: "none", outline: "none", marginBottom: 10 }}
                  />
                  <button onClick={submitReview} disabled={userRating === 0}
                    style={{ width: "100%", background: userRating === 0 ? "#E5E7EB" : "#16a34a", color: userRating === 0 ? "#9CA3AF" : "#fff", border: "none", borderRadius: 12, padding: "11px", fontSize: 13, fontWeight: 700, cursor: userRating === 0 ? "not-allowed" : "pointer", fontFamily: "'Cairo', sans-serif" }}>
                    إرسال التقييم ⭐
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}