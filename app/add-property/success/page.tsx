"use client";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: "40px 24px" }}>
        
        <div style={{ width: 100, height: 100, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 32px rgba(22,163,74,0.3)" }}>
          <span style={{ fontSize: 48 }}>✓</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>تم نشر إعلانك! 🎉</h1>
        <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 32, lineHeight: 1.8 }}>
          إعلانك الآن مرئي للجميع وسيظهر في نتائج البحث فوراً
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/properties" style={{ background: "#16a34a", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 14px rgba(22,163,74,0.3)", display: "block" }}>
            🏠 تصفح العقارات
          </Link>
          <Link href="/profile" style={{ background: "#fff", color: "#374151", textDecoration: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, border: "1.5px solid #E5E7EB", display: "block" }}>
            👤 ملفي الشخصي
          </Link>
          <Link href="/add-property" style={{ background: "#fff", color: "#2563EB", textDecoration: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, border: "1.5px solid #BFDBFE", display: "block" }}>
            ➕ إضافة إعلان آخر
          </Link>
        </div>
      </div>
    </div>
  );
}