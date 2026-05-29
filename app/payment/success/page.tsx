"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const [count, setCount] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(timer); window.location.href = "/profile"; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; } @keyframes pop { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } } @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{ background: "#fff", borderRadius: 28, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(22,163,74,0.15)", border: "1px solid #bbf7d0" }}>

        {/* Icon */}
        <div style={{ width: 88, height: 88, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "pop 0.5s ease-out", boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}>
          <span style={{ fontSize: 40 }}>✓</span>
        </div>

        {/* Title */}
        <div style={{ animation: "fadeUp 0.5s ease-out 0.2s both" }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>تمّت عملية الدفع بنجاح! 🎉</h1>
          <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8, marginBottom: 28 }}>
            تم تفعيل باقتك بنجاح. يمكنك الآن الاستفادة من جميع مزايا الباقة المختارة.
          </p>
        </div>

        {/* Details Card */}
        <div style={{ background: "#f0fdf4", borderRadius: 16, padding: "20px", marginBottom: 28, border: "1.5px solid #bbf7d0", animation: "fadeUp 0.5s ease-out 0.3s both" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "رقم الطلب", value: "#AQ-" + Math.floor(100000 + Math.random() * 900000) },
              { label: "الباقة", value: "الباقة المتقدمة" },
              { label: "المبلغ المدفوع", value: "249 ر.س + VAT" },
              { label: "طريقة الدفع", value: "مدى ****4321" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ZATCA Note */}
        <div style={{ background: "#fffbeb", borderRadius: 12, padding: "10px 16px", marginBottom: 24, border: "1px solid #fde68a", fontSize: 12, color: "#92400e", animation: "fadeUp 0.5s ease-out 0.4s both" }}>
          📄 سيتم إرسال الفاتورة الإلكترونية المتوافقة مع ZATCA إلى بريدك الإلكتروني خلال دقائق
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.5s ease-out 0.5s both" }}>
          <Link href="/add-property" style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, display: "block", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
            🏠 أضف إعلانك الأول الآن
          </Link>
          <Link href="/profile" style={{ background: "#f8fafc", color: "#374151", textDecoration: "none", borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 700, display: "block", border: "1.5px solid #e5e7eb" }}>
            الذهاب لملفي الشخصي
          </Link>
        </div>

        {/* Countdown */}
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 16 }}>
          سيتم تحويلك تلقائياً خلال <span style={{ fontWeight: 800, color: "#16a34a" }}>{count}</span> ثوانٍ
        </p>
      </div>
    </div>
  );
}
