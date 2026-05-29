"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const typeColors: Record<string, string> = {
  "عقار": "#16a34a", "مقاول": "#F59E0B", "مكتب هندسي": "#7C3AED"
};
const typeBg: Record<string, string> = {
  "عقار": "#F0FDF4", "مقاول": "#FFFBEB", "مكتب هندسي": "#F5F3FF"
};
const typeIcons: Record<string, string> = {
  "عقار": "🏠", "مقاول": "🔧", "مكتب هندسي": "📐"
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);

      const { data } = await supabase
        .from("requests")
        .select("*, profiles!requests_user_id_fkey(full_name, phone, avatar_url, role, city)")
        .eq("id", params.id)
        .single();

      if (!data) { router.push("/requests"); return; }
      setRequest(data);
      setLoading(false);
    };
    if (params.id) load();
  }, [params.id, router]);

  if (loading) return (
    <div style={{ fontFamily: "Cairo", textAlign: "center", padding: "100px", color: "#9CA3AF" }}>
      جاري التحميل...
    </div>
  );
  if (!request) return null;

  const color = typeColors[request.type] || "#6B7280";
  const bg = typeBg[request.type] || "#F8F9FB";

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0", padding: "12px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", fontSize: 13, color: "#9CA3AF", display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/requests" style={{ color: color, textDecoration: "none", fontWeight: 700 }}>← الطلبات</a>
          <span>·</span>
          <span style={{ color: "#374151" }}>{request.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1.5px solid ${color}22`, marginBottom: 20 }}>
          <div style={{ background: bg, padding: "20px 24px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ background: color, color: "#fff", fontSize: 13, fontWeight: 700, padding: "5px 14px", borderRadius: 20 }}>
              {typeIcons[request.type]} {request.type}
            </span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>
              {new Date(request.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          <div style={{ padding: "24px" }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>{request.title}</h1>

            {request.description && (
              <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.9, marginBottom: 20 }}>{request.description}</p>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {request.budget && (
                <div style={{ background: bg, border: `1.5px solid ${color}33`, borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>💰</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>الميزانية</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: color }}>{Number(request.budget).toLocaleString("ar-SA")} ر.س</div>
                  </div>
                </div>
              )}
              {request.city && (
                <div style={{ background: "#F8F9FB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>المدينة</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#374151" }}>{request.city}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* بطاقة صاحب الطلب */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>صاحب الطلب</h3>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "16px", background: "#F8F9FB", borderRadius: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${color}99)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {request.profiles?.avatar_url ? (
                <img src={request.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>{request.profiles?.full_name?.[0] || "م"}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{request.profiles?.full_name || "مستخدم"}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>📍 {request.profiles?.city || request.city || "غير محدد"}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {request.phone && (
              <button
                onClick={() => window.open(`https://wa.me/${request.phone}`, "_blank")}
                style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.535 5.849L.057 23.985l6.284-1.648A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 01-5.031-1.371l-.361-.214-3.732.979 1.001-3.648-.235-.374A9.86 9.86 0 012.1 12c0-5.464 4.436-9.9 9.9-9.9s9.9 4.436 9.9 9.9-4.436 9.9-9.9 9.9z"/>
                </svg>
                تواصل عبر واتساب
              </button>
            )}
            {request.phone && (
              <button
                onClick={() => window.location.href = `tel:${request.phone}`}
                style={{ width: "100%", background: "#0284c7", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                📞 اتصال مباشر
              </button>
            )}
            <button
              onClick={() => currentUser ? router.push(`/messages?user=${request.user_id}`) : router.push("/auth/login")}
              style={{ width: "100%", background: "#2563EB", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              💬 إرسال رسالة
            </button>
            {!request.phone && (
              <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>صاحب الطلب لم يضف رقم تواصل</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
