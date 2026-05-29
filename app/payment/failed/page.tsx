"use client";
import { useState } from "react";
import Link from "next/link";

const reasons = [
  { icon: "💳", title: "رصيد غير كافٍ", desc: "تأكد من وجود رصيد كافٍ في بطاقتك أو حسابك البنكي." },
  { icon: "🔢", title: "بيانات خاطئة", desc: "تحقق من رقم البطاقة وتاريخ الانتهاء ورمز CVV." },
  { icon: "🏦", title: "رفض البنك", desc: "قد يكون بنكك قد رفض العملية لأسباب أمنية — تواصل معه." },
  { icon: "🌐", title: "مشكلة في الاتصال", desc: "انقطع الاتصال أثناء عملية الدفع. حاول مرة أخرى." },
];

export default function PaymentFailedPage() {
  const [loading, setLoading] = useState(false);

  const handleRetry = () => {
    setLoading(true);
    setTimeout(() => { window.location.href = "/pricing"; }, 1500);
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; } @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} } @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} } .retry-btn:hover { opacity: 0.9; transform: translateY(-1px); } .retry-btn { transition: all 0.2s; }`}</style>

      <div style={{ background: "#fff", borderRadius: 28, padding: "48px 40px", maxWidth: 520, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(220,38,38,0.12)", border: "1px solid #fecaca" }}>

        {/* Icon */}
        <div style={{ width: 88, height: 88, background: "linear-gradient(135deg, #dc2626, #ef4444)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "shake 0.5s ease-out", boxShadow: "0 8px 24px rgba(220,38,38,0.25)" }}>
          <span style={{ fontSize: 40, color: "#fff" }}>✕</span>
        </div>

        {/* Title */}
        <div style={{ animation: "fadeUp 0.4s ease-out 0.1s both" }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>لم تكتمل عملية الدفع 😔</h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.8, marginBottom: 28 }}>
            لم يتم خصم أي مبلغ من حسابك. يمكنك المحاولة مرة أخرى أو اختيار طريقة دفع مختلفة.
          </p>
        </div>

        {/* Error Code */}
        <div style={{ background: "#fff1f2", borderRadius: 12, padding: "10px 16px", marginBottom: 24, border: "1px solid #fecaca", fontSize: 12, color: "#dc2626", fontWeight: 700, animation: "fadeUp 0.4s ease-out 0.2s both" }}>
          رمز الخطأ: PAYMENT_DECLINED_001 · الوقت: {new Date().toLocaleTimeString("ar-SA")}
        </div>

        {/* Reasons */}
        <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease-out 0.3s both" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14, textAlign: "right" }}>الأسباب الشائعة لفشل الدفع:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {reasons.map((r, i) => (
              <div key={i} style={{ background: "#fafafa", borderRadius: 12, padding: "14px", border: "1px solid #f0f0f0", textAlign: "right" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.4s ease-out 0.4s both" }}>
          <button onClick={handleRetry} className="retry-btn" style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 14px rgba(220,38,38,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <><span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />جاري التحويل...</>
            ) : "🔄 حاول مرة أخرى"}
          </button>
          <Link href="/pricing" style={{ background: "#f8fafc", color: "#374151", textDecoration: "none", borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 700, display: "block", border: "1.5px solid #e5e7eb" }}>
            العودة لصفحة الباقات
          </Link>
          <a href="https://wa.me/966500000000" target="_blank" style={{ background: "#f0fdf4", color: "#16a34a", textDecoration: "none", borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 700, display: "block", border: "1.5px solid #bbf7d0" }}>
            💬 تواصل مع الدعم
          </a>
        </div>

        {/* Assurance */}
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 20, lineHeight: 1.7 }}>
          🔒 لم يتم خصم أي مبلغ · جميع المدفوعات مؤمّنة عبر Moyasar
        </p>
      </div>
    </div>
  );
}
