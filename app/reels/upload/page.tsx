"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const categories = [
  { value: "عقار", label: "عقار", desc: "عقارات للبيع والإيجار السنوي واليومي" },
  { value: "تصميم وتنفيذ", label: "تصميم وتنفيذ", desc: "مقاولات وتشطيب — تصميم هندسي وديكور داخلي" },
];

export default function ReelsUploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [reelsLimit, setReelsLimit] = useState<number>(3);
  const [reelsCount, setReelsCount] = useState<number>(0);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setUserProfile(profile);
      const { data: props } = await supabase.from("properties").select("id, title").eq("user_id", user.id).eq("status", "active");
      setProperties(props || []);

      // فحص حد الريلز
      const { count: userReelsCount } = await supabase
        .from("reels")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

      const { data: settings } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["free_reels", "pkg1_reels", "pkg2_reels", "pkg3_reels", "pkg4_reels"]);

      const s: Record<string, string> = {};
      settings?.forEach((r: any) => { s[r.key] = r.value; });

      const userPlan = profile?.plan || "مجاني";
      let limit = parseInt(s["free_reels"] || "3");
      if (userPlan === "الأساسية") limit = parseInt(s["pkg1_reels"] || "10");
      else if (userPlan === "المتوسطة") limit = parseInt(s["pkg2_reels"] || "25");
      else if (userPlan === "المتقدمة") limit = parseInt(s["pkg3_reels"] || "50");
      else if (userPlan === "البريميم") limit = parseInt(s["pkg4_reels"] || "999");

      const count = userReelsCount || 0;
      setReelsLimit(limit);
      setReelsCount(count);
      setLimitReached(count >= limit);
    };
    init();
  }, []);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError("حجم الفيديو يجب أن يكون أقل من 100MB"); return; }
    
    // التحقق البرمجي من مدة الفيديو (أقل من 90 ثانية)
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.src = URL.createObjectURL(file);
    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(videoEl.src);
      if (videoEl.duration > 90) { setError("مدة الفيديو يجب أن تكون أقل من 90 ثانية"); return; }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError("");
    };
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!videoFile) { setError("يرجى اختيار فيديو"); return; }
    if (!category) { setError("يرجى اختيار الفئة"); return; }
    if (!title.trim()) { setError("يرجى إدخال عنوان"); return; }
    setUploading(true);
    setError("");

    try {
      // رفع الفيديو
      const videoExt = videoFile.name.split(".").pop();
      const videoPath = `${user.id}/${Date.now()}.${videoExt}`;
      setUploadProgress(20);
      const { error: videoError } = await supabase.storage.from("reels").upload(videoPath, videoFile);
      if (videoError) throw videoError;
      setUploadProgress(60);
      const { data: videoData } = supabase.storage.from("reels").getPublicUrl(videoPath);

      // رفع الصورة المصغرة (اختياري)
      let thumbnailUrl = null;
      if (thumbnail) {
        const thumbExt = thumbnail.name.split(".").pop();
        const thumbPath = `thumbnails/${user.id}/${Date.now()}.${thumbExt}`;
        await supabase.storage.from("reels").upload(thumbPath, thumbnail);
        const { data: thumbData } = supabase.storage.from("reels").getPublicUrl(thumbPath);
        thumbnailUrl = thumbData.publicUrl;
      }
      setUploadProgress(80);

      // حفظ في قاعدة البيانات بعد تنظيف الهاشتاقات القديمة
      const { error: dbError } = await supabase.from("reels").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        video_url: videoData.publicUrl,
        thumbnail_url: thumbnailUrl,
        category,
        property_id: selectedProperty || null,
        city: city.trim() || null,
        status: "active",
      });
      if (dbError) throw dbError;
      setUploadProgress(100);
      router.push("/reels");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الرفع");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; outline: none; }
        .upload-zone { transition: all 0.2s; }
        .upload-zone:hover { border-color: #16a34a !important; background: #f0fdf4 !important; }
        .tag-btn { transition: all 0.2s; cursor: pointer; }
        .tag-btn:hover { background: #f0fdf4 !important; border-color: #16a34a !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#374151" }}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>نشر Reel جديد</h1>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px" }}>

        {/* تحذير الحد */}
        {limitReached && (
          <div style={{ background: "#FFF5F5", border: "1.5px solid #FECACA", borderRadius: 16, padding: "20px 24px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🚫</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#EF4444", marginBottom: 6 }}>وصلت للحد الأقصى من Reels</h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              باقتك الحالية تسمح بـ <strong>{reelsLimit}</strong> Reel فقط — لديك <strong>{reelsCount}</strong> Reel منشور
            </p>
            <button onClick={() => router.push("/pricing")}
              style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              ترقية الباقة 🚀
            </button>
          </div>
        )}

        {/* خطأ */}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* رفع الفيديو */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>🎬 الفيديو</h2>

          {!videoPreview ? (
            <div className="upload-zone" onClick={() => !limitReached && videoInputRef.current?.click()}
              style={{ border: "2px dashed #E5E7EB", borderRadius: 16, padding: "48px 24px", textAlign: "center", cursor: limitReached ? "not-allowed" : "pointer", background: "#FAFAFA", opacity: limitReached ? 0.6 : 1 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📹</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>اضغط لاختيار فيديو</p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>MP4, MOV · الحد الأقصى 50MB · مدة أقصاها 90 ثانية</p>
            </div>
          ) : (
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000" }}>
              <video src={videoPreview} controls style={{ width: "100%", maxHeight: 400, objectFit: "contain" }} />
              <button onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                style={{ position: "absolute", top: 10, left: 10, width: 32, height: 32, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          )}
          <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} style={{ display: "none" }} disabled={limitReached} />

          {videoPreview && !limitReached && (
            <button onClick={() => videoInputRef.current?.click()}
              style={{ marginTop: 12, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              تغيير الفيديو
            </button>
          )}
        </div>

        {/* الصورة المصغرة */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>🖼️ صورة مصغرة <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>(اختياري)</span></h2>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>إذا لم تختر صورة سيتم استخدام أول إطار من الفيديو</p>

          {!thumbnailPreview ? (
            <div className="upload-zone" onClick={() => !limitReached && thumbInputRef.current?.click()}
              style={{ border: "2px dashed #E5E7EB", borderRadius: 12, padding: "24px", textAlign: "center", cursor: limitReached ? "not-allowed" : "pointer", background: "#FAFAFA", display: "flex", alignItems: "center", gap: 12, opacity: limitReached ? 0.6 : 1 }}>
              <div style={{ fontSize: 32 }}>🖼️</div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>اختر صورة مصغرة</p>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>JPG, PNG</p>
              </div>
            </div>
          ) : (
            <div style={{ position: "relative", width: 120, height: 200, borderRadius: 12, overflow: "hidden" }}>
              <img src={thumbnailPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => { setThumbnail(null); setThumbnailPreview(null); }}
                style={{ position: "absolute", top: 6, left: 6, width: 24, height: 24, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: 12 }}>×</button>
            </div>
          )}
          <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} style={{ display: "none" }} disabled={limitReached} />
        </div>

        {/* تفاصيل الريلز */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>📝 التفاصيل</h2>

          {/* العنوان */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>العنوان *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان مميز للـ Reel..." maxLength={100} disabled={limitReached}
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: "'Cairo', sans-serif", color: "#374151" }} />
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, textAlign: "left" }}>{title.length}/100</div>
          </div>

          {/* الوصف */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اكتب وصفاً للـ Reel..." maxLength={500} rows={3} disabled={limitReached}
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", resize: "none" }} />
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, textAlign: "left" }}>{description.length}/500</div>
          </div>

          {/* الفئة المحدثة */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>الفئة *</label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {categories.map((c) => (
                <button key={c.value} onClick={() => !limitReached && setCategory(c.value)} className="tag-btn" disabled={limitReached}
                  style={{
                    padding: "12px 20px", borderRadius: 14, border: "1.5px solid",
                    borderColor: category === c.value ? "#16a34a" : "#E5E7EB",
                    background: category === c.value ? "#16a34a" : "#fff",
                    color: category === c.value ? "#fff" : "#374151",
                    fontFamily: "'Cairo', sans-serif", textAlign: "right", cursor: limitReached ? "not-allowed" : "pointer",
                    opacity: limitReached && category !== c.value ? 0.6 : 1
                  }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* المدينة */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>المدينة <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>(اختياري)</span></label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="الرياض، جدة، الدمام..." disabled={limitReached}
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151" }} />
          </div>

          {/* ربط بعقار */}
          {properties.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>ربط بعقار <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>(اختياري)</span></label>
              <select value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} disabled={limitReached}
                style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#fff" }}>
                <option value="">لا يوجد ربط بعقار</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* شريط التقدم */}
        {uploading && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>جاري الرفع...</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{uploadProgress}%</span>
            </div>
            <div style={{ background: "#F3F4F6", borderRadius: 100, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#16a34a", borderRadius: 100, transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* أزرار */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => router.back()} disabled={uploading}
            style={{ flex: 1, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 14, padding: "16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
            إلغاء
          </button>
          <button onClick={handleSubmit} disabled={uploading || !videoFile || !category || !title.trim() || limitReached}
            style={{
              flex: 2, background: uploading || !videoFile || !category || !title.trim() || limitReached ? "#E5E7EB" : "#16a34a",
              color: uploading || !videoFile || !category || !title.trim() || limitReached ? "#9CA3AF" : "#fff",
              border: "none", borderRadius: 14, padding: "16px", fontSize: 14, fontWeight: 800,
              cursor: uploading || !videoFile || !category || !title.trim() || limitReached ? "not-allowed" : "pointer",
              fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}>
            {uploading ? "جاري النشر..." : "🎬 نشر الـ Reel"}
          </button>
        </div>

      </div>
    </div>
  );
}