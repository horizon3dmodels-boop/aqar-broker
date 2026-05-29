"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    subject: "",
    message: "",
    type: "technical",
    priority: "medium",
    channel: "platform",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.subject || !form.message) {
      setError("يرجى تعبئة العنوان والرسالة");
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/auth/login"); return; }

    const { error: insertError } = await supabase.from('support_tickets').insert({
      user_id: session.user.id,
      subject: form.subject,
      message: form.message,
      type: form.type,
      priority: form.priority,
      channel: form.channel,
      status: 'open',
    });

    if (insertError) {
      setError("حدث خطأ أثناء الإرسال");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const inputStyle = {
    width: "100%",
    border: "1.5px solid #E5E7EB",
    borderRadius: 12,
    padding: "13px 14px",
    fontSize: 13,
    fontFamily: "'Cairo', sans-serif",
    color: "#374151",
    background: "#FAFAFA",
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; outline: none; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎧</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>الدعم والمساعدة</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>فريقنا جاهز للمساعدة — سنرد خلال 24 ساعة</p>
        </div>

        {submitted ? (
          <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 20, padding: "40px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", marginBottom: 8 }}>تم إرسال طلبك بنجاح!</h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>سيتواصل معك فريق الدعم خلال 24 ساعة</p>
            <button onClick={() => { setSubmitted(false); setForm({ subject: "", message: "", type: "technical", priority: "medium", channel: "platform" }); }} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              إرسال طلب آخر
            </button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 24, padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #F0F0F0" }}>

            {error && (
              <div style={{ background: "#FFF5F5", border: "1.5px solid #FECACA", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#EF4444", fontSize: 13, fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* نوع المشكلة */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>نوع الطلب</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[
                    { value: "technical", label: "🔧 تقني" },
                    { value: "payment", label: "💳 مدفوعات" },
                    { value: "property", label: "🏠 عقاري" },
                    { value: "broker", label: "🤝 وسيط" },
                    { value: "suggestion", label: "💡 اقتراح" },
                    { value: "other", label: "📋 أخرى" },
                  ].map((t) => (
                    <button key={t.value} onClick={() => setForm({ ...form, type: t.value })} style={{
                      padding: "10px", border: "1.5px solid", borderColor: form.type === t.value ? "#16a34a" : "#E5E7EB",
                      borderRadius: 12, background: form.type === t.value ? "#F0FDF4" : "#fff",
                      color: form.type === t.value ? "#16a34a" : "#374151", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "'Cairo', sans-serif",
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* الأولوية */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>الأولوية</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "low", label: "منخفضة", color: "#16a34a" },
                    { value: "medium", label: "متوسطة", color: "#F59E0B" },
                    { value: "high", label: "عالية", color: "#EF4444" },
                  ].map((p) => (
                    <button key={p.value} onClick={() => setForm({ ...form, priority: p.value })} style={{
                      flex: 1, padding: "10px", border: "1.5px solid",
                      borderColor: form.priority === p.value ? p.color : "#E5E7EB",
                      borderRadius: 12, background: form.priority === p.value ? p.color + "11" : "#fff",
                      color: form.priority === p.value ? p.color : "#374151", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "'Cairo', sans-serif",
                    }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* العنوان */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>عنوان الطلب <span style={{ color: "#EF4444" }}>*</span></label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="مثال: لا أستطيع نشر إعلاني" style={inputStyle} />
              </div>

              {/* الرسالة */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>تفاصيل المشكلة <span style={{ color: "#EF4444" }}>*</span></label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="اشرح مشكلتك بالتفصيل..." rows={5} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* طريقة التواصل */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>طريقة التواصل المفضلة</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "platform", label: "🏠 المنصة" },
                    { value: "whatsapp", label: "💬 واتساب" },
                    { value: "email", label: "📧 البريد" },
                  ].map((c) => (
                    <button key={c.value} onClick={() => setForm({ ...form, channel: c.value })} style={{
                      flex: 1, padding: "10px", border: "1.5px solid",
                      borderColor: form.channel === c.value ? "#16a34a" : "#E5E7EB",
                      borderRadius: 12, background: form.channel === c.value ? "#F0FDF4" : "#fff",
                      color: form.channel === c.value ? "#16a34a" : "#374151", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "'Cairo', sans-serif",
                    }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* زر الإرسال */}
              <button onClick={handleSubmit} disabled={submitting} style={{
                background: submitting ? "#86efac" : "#16a34a", color: "#fff", border: "none",
                borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800,
                cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Cairo', sans-serif",
                boxShadow: "0 4px 14px rgba(22,163,74,0.3)", marginTop: 4,
              }}>
                {submitting ? "جاري الإرسال..." : "إرسال الطلب 🎧"}
              </button>

            </div>
          </div>
        )}

        {/* معلومات الدعم */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
          {[
            { icon: "⚡", title: "رد سريع", desc: "خلال 24 ساعة" },
            { icon: "🔒", title: "آمن وخاص", desc: "بياناتك محمية" },
            { icon: "🌟", title: "دعم متخصص", desc: "فريق عقاري محترف" },
          ].map((item, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "16px", textAlign: "center", border: "1px solid #F0F0F0" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>{item.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}