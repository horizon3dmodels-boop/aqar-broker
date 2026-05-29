"use client";
import Link from "next/link";

export default function VerifyPage() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>

      <div style={{ background: "#fff", borderRadius: 24, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.10)", border: "1px solid #F0F0F0" }}>

        <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36 }}>
          📧
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
          تحقق من بريدك الإلكتروني
        </h1>

        <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.9, marginBottom: 28 }}>
          أرسلنا لك رابط التأكيد على بريدك الإلكتروني.
          <br />
          افتح الرسالة واضغط على الرابط لتفعيل حسابك.
        </p>

        {/* Steps */}
        <div style={{ background: "#F8F9FB", borderRadius: 16, padding: "20px", marginBottom: 28, textAlign: "right" }}>
          {[
            { step: "1", text: "افتح بريدك الإلكتروني" },
            { step: "2", text: 'ابحث عن رسالة من "عقار بروكر"' },
            { step: "3", text: 'اضغط على "Confirm email address"' },
            { step: "4", text: "سجّل دخولك واستمتع بالمنصة 🎉" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 3 ? "1px solid #F0F0F0" : "none" }}>
              <div style={{ width: 28, height: 28, background: "#2563EB", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                {s.step}
              </div>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{s.text}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 12, color: "#92400E", border: "1px solid #FDE68A" }}>
          ⚠️ لم تجد الرسالة؟ تحقق من مجلد Spam أو Junk
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/auth/login" style={{ background: "#2563EB", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800, display: "block", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
            الذهاب لتسجيل الدخول ←
          </Link>
          <Link href="/" style={{ background: "#F8F9FB", color: "#374151", textDecoration: "none", borderRadius: 14, padding: "11px", fontSize: 13, fontWeight: 700, display: "block", border: "1.5px solid #E5E7EB" }}>
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
