"use client";
import Navbar from "@/components/Navbar";

const stats = [
  { value: "+12,000", label: "إعلان عقاري" },
  { value: "+850", label: "وسيط موثق" },
  { value: "+320", label: "مكتب هندسي" },
  { value: "4.8 ⭐", label: "متوسط التقييم" },
];

const team = [
  { name: "باسل محمد", role: "المؤسس والرئيس التنفيذي", avatar: "ب", bio: "خبرة +10 سنوات في السوق العقاري السعودي" },
  { name: "أحمد العمري", role: "مدير التقنية", avatar: "أ", bio: "متخصص في بناء منصات التقنية العقارية" },
  { name: "سارة الغامدي", role: "مديرة تجربة المستخدم", avatar: "س", bio: "خبيرة في تصميم منتجات رقمية موجهة للسوق السعودي" },
];

const values = [
  { icon: "🔒", title: "الشفافية", desc: "نؤمن بالوضوح الكامل في التسعير والمعلومات — لا رسوم خفية ولا مفاجآت." },
  { icon: "✅", title: "الموثوقية", desc: "كل وسيط وكل إعلان يمر بمراجعة دقيقة لضمان أعلى معايير الجودة." },
  { icon: "🚀", title: "الابتكار", desc: "نستخدم أحدث تقنيات الذكاء الاصطناعي لتحسين تجربة البحث والتوصية." },
  { icon: "🤝", title: "الشراكة", desc: "نجاحك هو نجاحنا — نبني علاقات طويلة الأمد مع مجتمعنا العقاري." },
];

export default function AboutPage() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>
      <Navbar />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", padding: "64px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#fff", marginBottom: 14 }}>من نحن</h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", maxWidth: 560, margin: "0 auto", lineHeight: 1.9 }}>
          عقار بروكر — منصة عقارية سعودية متكاملة تجمع بين الوسطاء العقاريين والمقاولين والمهندسين والباحثين عن العقارات في مكان واحد.
        </p>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 900, margin: "-28px auto 0", padding: "0 24px", position: "relative", zIndex: 10 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px 32px", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, textAlign: "center" }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#1e3a5f" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 24px" }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "40px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EFF6FF", color: "#1e3a5f", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 16 }}>🎯 مهمتنا</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 14, lineHeight: 1.4 }}>
              نبني مستقبل السوق العقاري السعودي
            </h2>
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 2 }}>
              انطلقنا من الرياض بهدف واحد: تبسيط رحلة العقار في المملكة العربية السعودية. نربط الباحثين عن العقار بالوسطاء الموثوقين، ونوفر منصة شاملة تشمل المقاولين والمكاتب الهندسية لتقديم حلول متكاملة من البناء حتى التسليم.
            </p>
          </div>
          <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 20, padding: "32px", color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>رؤية 2030</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
              نساهم في تحقيق أهداف رؤية المملكة 2030 لرفع نسبة تملّك المساكن وتطوير قطاع الإسكان الوطني.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div style={{ maxWidth: 900, margin: "0 auto 40px", padding: "0 24px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", textAlign: "center", marginBottom: 24 }}>قيمنا</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
          {values.map((v, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #F0F0F0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{v.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{v.title}</div>
              <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.8 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{ maxWidth: 900, margin: "0 auto 56px", padding: "0 24px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", textAlign: "center", marginBottom: 24 }}>فريقنا</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {team.map((m, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 20, padding: "28px 20px", border: "1px solid #F0F0F0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#1e3a5f,#2563EB)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24, fontWeight: 900, color: "#fff" }}>{m.avatar}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "#1e3a5f", fontWeight: 700, marginBottom: 8 }}>{m.role}</div>
              <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>{m.bio}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 900, margin: "0 auto 56px", padding: "0 24px" }}>
        <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius: 24, padding: "40px", textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 10 }}>انضم إلى مجتمع عقار بروكر</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 24 }}>سواء كنت وسيطاً أو مقاولاً أو باحثاً عن عقار — مكانك هنا.</p>
          <a href="/auth/register" style={{ background: "#fff", color: "#1e3a5f", textDecoration: "none", borderRadius: 14, padding: "13px 28px", fontSize: 14, fontWeight: 800, fontFamily: "'Cairo', sans-serif" }}>ابدأ الآن مجاناً ←</a>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px", borderTop: "1px solid #F0F0F0", fontSize: 12, color: "#9CA3AF" }}>
        © 2025 عقار بروكر — الرياض، المملكة العربية السعودية
      </div>
    </div>
  );
}
