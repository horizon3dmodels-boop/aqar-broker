"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const cities = ["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "تبوك", "أبها", "القصيم", "حائل"];

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    type: "عقار",
    title: "",
    description: "",
    budget: "",
    city: "الرياض",
    phone: "",
  });

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/auth/login");
    };
    check();
  }, [router]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/auth/login"); return; }

    // إضافة الطلب
    const { data: newRequest, error } = await supabase.from("requests").insert({
      user_id: session.user.id,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      budget: form.budget ? Number(form.budget.replace(/,/g, "")) : null,
      city: form.city,
      phone: form.phone.trim() || null,
      status: "active",
    }).select().single();

    if (error) { alert("خطأ: " + error.message); setLoading(false); return; }

    // ✅ إرسال إشعارات للمختصين حسب نوع الطلب
    const roleMap: Record<string, string> = {
      "عقار": "broker",
      "مقاول": "contractor",
      "مكتب هندسي": "engineer",
    };
    const targetRole = roleMap[form.type];

    if (targetRole) {
      const { data: targets } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", targetRole)
        .neq("id", session.user.id);

      if (targets && targets.length > 0) {
        const notifications = targets.map((t: any) => ({
          user_id: t.id,
          title: `طلب جديد — ${form.type}`,
          body: form.title.trim(),
          type: "request",
          read: false,
          link: `/requests/${newRequest.id}`,
        }));
        await supabase.from("notifications").insert(notifications);
      }
    }

    setLoading(false);
    setSubmitted(true);
    setTimeout(() => router.push("/requests"), 2000);
  };

  const typeOptions = [
    { value: "عقار", icon: "🏠", label: "عقار", desc: "أبحث عن شقة، فيلا، أرض...", color: "#16a34a" },
    { value: "مقاول", icon: "🔧", label: "مقاول", desc: "أحتاج مقاول للبناء أو التشطيب", color: "#F59E0B" },
    { value: "مكتب هندسي", icon: "📐", label: "مكتب هندسي", desc: "أحتاج تصميم أو رخصة بناء", color: "#7C3AED" },
  ];

  if (submitted) return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>تم إرسال طلبك!</h2>
        <p style={{ fontSize: 14, color: "#6B7280" }}>سيتم إشعار المختصين بطلبك فوراً</p>
      </div>
    </div>
  );

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #0f172a !important; box-shadow: 0 0 0 3px rgba(15,23,42,0.08) !important; outline: none; }
        .type-card { transition: all 0.2s; cursor: pointer; }
        .type-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0", padding: "12px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", fontSize: 13, color: "#9CA3AF", display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/requests" style={{ color: "#0f172a", textDecoration: "none", fontWeight: 700 }}>← الطلبات</a>
          <span>·</span>
          <span>طلب جديد</span>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>📋 أضف طلبك</h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>صف ما تحتاجه وسيصلك رد من المختصين</p>

        {/* نوع الطلب */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", display: "block", marginBottom: 12 }}>نوع الطلب *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {typeOptions.map(t => (
              <div key={t.value} className="type-card"
                onClick={() => setForm({ ...form, type: t.value })}
                style={{
                  padding: "18px 14px", borderRadius: 16, textAlign: "center", cursor: "pointer",
                  border: `2px solid ${form.type === t.value ? t.color : "#E5E7EB"}`,
                  background: form.type === t.value ? t.color + "11" : "#fff",
                  boxShadow: form.type === t.value ? `0 4px 14px ${t.color}22` : "none",
                }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: form.type === t.value ? t.color : "#0f172a", marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* العنوان */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>عنوان الطلب *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={form.type === "عقار" ? "مثال: أبحث عن شقة 3 غرف في حي النرجس" : form.type === "مقاول" ? "مثال: تشطيب فيلا مساحة 400 متر" : "مثال: تصميم فيلا دورين مع استخراج رخصة"}
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 14, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }}
            />
          </div>

          {/* الوصف */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>تفاصيل إضافية</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="اكتب تفاصيل أكثر عن طلبك..."
              rows={4}
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* الميزانية */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>الميزانية (ر.س)</label>
              <input
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="مثال: 500000"
                type="number"
                style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }}
              />
            </div>

            {/* المدينة */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>المدينة</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }}>
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* رقم التواصل */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              رقم التواصل <span style={{ color: "#9CA3AF", fontWeight: 500 }}>(واتساب / اتصال مباشر)</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="مثال: 0501234567"
              type="tel"
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }}
            />
          </div>

          {/* زر الإرسال */}
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title.trim()}
            style={{
              background: form.title.trim() ? "#0f172a" : "#E5E7EB",
              color: form.title.trim() ? "#fff" : "#9CA3AF",
              border: "none", borderRadius: 14, padding: "15px", fontSize: 15,
              fontWeight: 800, cursor: form.title.trim() ? "pointer" : "not-allowed",
              fontFamily: "'Cairo', sans-serif",
              boxShadow: form.title.trim() ? "0 4px 14px rgba(15,23,42,0.3)" : "none",
            }}>
            {loading ? "جاري الإرسال..." : "📤 إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}
