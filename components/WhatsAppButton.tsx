"use client";
import { useState } from "react";
import Link from "next/link";

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes pulse-wa { 0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,0.4)} 50%{box-shadow:0 0 0 10px rgba(37,211,102,0)} }
        .wa-btn { animation: pulse-wa 2s infinite; }
        .wa-popup { animation: fadeUp 0.2s ease-out; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Popup */}
      {open && (
        <div className="wa-popup" style={{ position: "fixed", bottom: 90, left: 24, zIndex: 9999, background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #F0F0F0", width: 280, fontFamily: "'Cairo', sans-serif" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F0F0F0" }}>
            <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #25D366, #128C7E)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏠</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>عقار بروكر</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#16a34a" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                متاح الآن — نرد خلال دقائق
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginRight: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9CA3AF" }}>×</button>
          </div>

          {/* Message */}
          <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
            👋 مرحباً! كيف نقدر نساعدك اليوم؟
          </div>

          {/* Quick Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {[
              { label: "🏠 استفسار عن عقار", msg: "السلام عليكم، أريد الاستفسار عن عقار" },
              { label: "💼 الانضمام كوسيط", msg: "السلام عليكم، أريد الانضمام كوسيط عقاري" },
              { label: "🔧 دعم تقني", msg: "السلام عليكم، لدي مشكلة تقنية في المنصة" },
              { label: "💰 الباقات والأسعار", msg: "السلام عليكم، أريد معرفة المزيد عن الباقات" },
            ].map((opt, i) => (
              <a key={i} href={`https://wa.me/966500000000?text=${encodeURIComponent(opt.msg)}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "#F8F9FB", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", border: "1px solid #F0F0F0", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F0FDF4")}
                onMouseLeave={e => (e.currentTarget.style.background = "#F8F9FB")}>
                {opt.label}
              </a>
            ))}
          </div>

          {/* Direct Link */}
          <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "#25D366", color: "#fff", borderRadius: 12, padding: "11px", fontSize: 14, fontWeight: 800, textAlign: "center", textDecoration: "none", fontFamily: "'Cairo', sans-serif" }}>
            💬 تحدث معنا مباشرة
          </a>

          {/* Support Link */}
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <Link href="/messages" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>
              أو أرسل رسالة داخل المنصة ←
            </Link>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button onClick={() => setOpen(!open)} className="wa-btn" style={{ position: "fixed", bottom: 24, left: 24, zIndex: 9999, width: 56, height: 56, background: "#25D366", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "0 4px 16px rgba(37,211,102,0.4)" }}>
        {open ? "×" : "💬"}
      </button>
    </>
  );
}
