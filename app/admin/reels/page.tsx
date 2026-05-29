"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("الكل");
  const [searchText, setSearchText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filters = ["الكل", "عقار", "تصميم وتنفيذ", "محظور"];

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/admin/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (prof?.role !== "admin") { router.push("/admin/login"); return; }
      fetchReels();
    };
    checkAdmin();
  }, []);

  const fetchReels = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reels")
      .select("*, profiles!reels_user_id_fkey(full_name, phone, city)")
      .order("created_at", { ascending: false });
    setReels(data || []);
    setLoading(false);
  };

  const toggleStatus = async (reel: any) => {
    const newStatus = reel.status === "active" ? "blocked" : "active";
    await supabase.from("reels").update({ status: newStatus }).eq("id", reel.id);
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, status: newStatus } : r));
  };

  const deleteReel = async (id: string) => {
    if (!confirm("هل تريد حذف هذا الـ Reel نهائياً؟")) return;
    setDeletingId(id);
    await supabase.from("reels").delete().eq("id", id);
    setReels(prev => prev.filter(r => r.id !== id));
    setDeletingId(null);
  };

  const filtered = reels.filter(r => {
    const matchFilter =
      filter === "الكل" ? true :
      filter === "محظور" ? r.status === "blocked" :
      filter === "تصميم وتنفيذ" ? ["مقاولات", "ديكور", "هندسة", "تشطيب", "تصميم وتنفيذ"].includes(r.category) :
      r.category === filter;
    const matchSearch = !searchText || r.title?.includes(searchText) || r.profiles?.full_name?.includes(searchText);
    return matchFilter && matchSearch;
  });

  const stats = {
    total: reels.length,
    active: reels.filter(r => r.status === "active").length,
    blocked: reels.filter(r => r.status === "blocked").length,
    totalLikes: reels.reduce((s, r) => s + (r.likes_count || 0), 0),
    totalViews: reels.reduce((s, r) => s + (r.views_count || 0), 0),
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: #7C3AED !important; outline: none; box-shadow: 0 0 0 3px rgba(124,58,237,0.1) !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b, #7C3AED)", padding: "28px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4 }}>🎬 إدارة Reels</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>مراقبة وإدارة جميع الريلز المنشورة</p>
          </div>
          <button onClick={() => router.push("/admin/dashboard")}
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
            ← لوحة التحكم
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 32px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { icon: "🎬", label: "إجمالي Reels", value: stats.total, color: "#7C3AED", bg: "#F5F3FF" },
            { icon: "✅", label: "نشط", value: stats.active, color: "#16a34a", bg: "#F0FDF4" },
            { icon: "🚫", label: "محظور", value: stats.blocked, color: "#EF4444", bg: "#FFF5F5" },
            { icon: "❤️", label: "إجمالي اللايكات", value: stats.totalLikes.toLocaleString(), color: "#E11D48", bg: "#FFF1F2" },
            { icon: "👁️", label: "إجمالي المشاهدات", value: stats.totalViews.toLocaleString(), color: "#0284c7", bg: "#F0F9FF" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 16, padding: "18px", border: `1.5px solid ${s.color}22`, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* فلاتر + بحث */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder="🔍 ابحث باسم الريلز أو صاحبه..."
            style={{ flex: 1, minWidth: 200, border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151" }} />
          <div style={{ display: "flex", gap: 8 }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "8px 16px", borderRadius: 20, border: "1.5px solid", borderColor: filter === f ? "#7C3AED" : "#E5E7EB", background: filter === f ? "#7C3AED" : "#fff", color: filter === f ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 600, marginBottom: 16 }}>
          {loading ? "جاري التحميل..." : `${filtered.length} Reel`}
        </p>

        {/* الجدول */}
        <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 80px 80px 80px 120px", gap: 12, padding: "12px 20px", background: "#F8F9FB", fontSize: 11, fontWeight: 700, color: "#9CA3AF" }}>
            <span>thumbnail</span>
            <span>الريلز / صاحبه</span>
            <span style={{ textAlign: "center" }}>الفئة</span>
            <span style={{ textAlign: "center" }}>مشاهدات</span>
            <span style={{ textAlign: "center" }}>لايكات</span>
            <span style={{ textAlign: "center" }}>الحالة</span>
            <span style={{ textAlign: "center" }}>إجراءات</span>
          </div>

          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF" }}>جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
              <p>لا توجد نتائج</p>
            </div>
          ) : filtered.map((reel, i) => (
            <div key={reel.id} style={{
              display: "grid", gridTemplateColumns: "60px 1fr 120px 80px 80px 80px 120px", gap: 12,
              alignItems: "center", padding: "14px 20px",
              borderTop: "1px solid #F3F4F6",
              background: i % 2 === 0 ? "#fff" : "#FAFAFA",
            }}>
              {/* thumbnail */}
              <div style={{ width: 48, height: 64, borderRadius: 8, overflow: "hidden", background: "#0f172a", flexShrink: 0 }}>
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎬</div>
                )}
              </div>

              {/* العنوان + صاحبه */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{reel.title || "بدون عنوان"}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>👤 {reel.profiles?.full_name || "---"} · 📍 {reel.profiles?.city || "---"}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{new Date(reel.created_at).toLocaleDateString("ar-SA")}</div>
              </div>

              {/* الفئة */}
              <div style={{ textAlign: "center" }}>
                <span style={{ background: "#F5F3FF", color: "#7C3AED", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                  {reel.category || "---"}
                </span>
              </div>

              {/* مشاهدات */}
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#0284c7" }}>
                {(reel.views_count || 0).toLocaleString()}
              </div>

              {/* لايكات */}
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#E11D48" }}>
                {(reel.likes_count || 0).toLocaleString()}
              </div>

              {/* الحالة */}
              <div style={{ textAlign: "center" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                  background: reel.status === "active" ? "#DCFCE7" : "#FEE2E2",
                  color: reel.status === "active" ? "#16a34a" : "#EF4444"
                }}>
                  {reel.status === "active" ? "نشط" : "محظور"}
                </span>
              </div>

              {/* إجراءات */}
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                <button onClick={() => router.push(`/reels/${reel.id}`)}
                  style={{ padding: "5px 10px", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#0284c7", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  عرض
                </button>
                <button onClick={() => toggleStatus(reel)}
                  style={{ padding: "5px 10px", background: reel.status === "active" ? "#FEF9C3" : "#F0FDF4", border: `1px solid ${reel.status === "active" ? "#FDE68A" : "#BBF7D0"}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: reel.status === "active" ? "#92400E" : "#16a34a", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  {reel.status === "active" ? "حظر" : "تفعيل"}
                </button>
                <button onClick={() => deleteReel(reel.id)} disabled={deletingId === reel.id}
                  style={{ padding: "5px 10px", background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#EF4444", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  {deletingId === reel.id ? "..." : "حذف"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
