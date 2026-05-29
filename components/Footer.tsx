"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    "المنصة": [
      { label: "الرئيسية", href: "/" },
      { label: "عقارات للبيع", href: "/properties?purpose=بيع" },
      { label: "عقارات للإيجار", href: "/properties?purpose=إيجار" },
      { label: "إيجار يومي", href: "/daily-rent" },
      { label: "المشاريع الكبرى", href: "/projects" },
      { label: "الخريطة العقارية", href: "/map" },
    ],
    "الخدمات": [
      { label: "المقاولون", href: "/contractors" },
      { label: "المكاتب الهندسية", href: "/engineering" },
      { label: "أضف إعلانك", href: "/add-property" },
      { label: "الباقات والأسعار", href: "/pricing" },
      { label: "التوثيق والترخيص", href: "/verify" },
    ],
    "الشركة": [
      { label: "من نحن", href: "/about" },
      { label: "تواصل معنا", href: "mailto:info@aqarbroker.com" },
      { label: "الشروط والأحكام", href: "/terms" },
      { label: "سياسة الخصوصية", href: "/privacy" },
      { label: "سياسة الاسترداد", href: "/terms#refund" },
    ],
  };

  const socials = [
    { icon: "𝕏", label: "تويتر", href: "https://twitter.com/aqarbroker" },
    { icon: "📸", label: "انستغرام", href: "https://instagram.com/aqarbroker" },
    { icon: "💬", label: "واتساب", href: "https://wa.me/966500000000" },
    { icon: "📘", label: "لينكدإن", href: "https://linkedin.com/company/aqarbroker" },
  ];

  return (
    <footer dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: "#0f172a", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .footer-link { transition: color 0.15s; }
        .footer-link:hover { color: #60a5fa !important; }
        .social-btn { transition: all 0.2s; }
        .social-btn:hover { background: rgba(255,255,255,0.15) !important; transform: translateY(-2px); }
        .newsletter-input::placeholder { color: #64748b; }
        .newsletter-input:focus { border-color: #2563EB !important; outline: none; }
      `}</style>

      {/* Main */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40 }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #1e3a5f, #2563EB)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>ع</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>عقار بروكر</div>
                <div style={{ fontSize: 10, color: "#60a5fa" }}>Aqar Broker</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.9, marginBottom: 20, maxWidth: 260 }}>
              منصة عقارية سعودية متكاملة تجمع الوسطاء والمقاولين والمهندسين والباحثين عن العقار في مكان واحد.
            </p>

            {/* Socials */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {socials.map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label} className="social-btn" style={{ width: 36, height: 36, background: "rgba(255,255,255,0.08)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, textDecoration: "none", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Trust Badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["🏛️ هيئة العقار", "🔒 ZATCA"].map((badge, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#94a3b8" }}>
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {category}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((link, j) => (
                  <li key={j}>
                    <a href={link.href} className="footer-link" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 8, color: "#334155" }}>▸</span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 16, padding: "24px 28px", marginTop: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>📬 اشترك في النشرة العقارية</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>آخر أخبار السوق وأفضل العروض أسبوعياً — بدون إزعاج</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="newsletter-input" placeholder="بريدك الإلكتروني" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#fff", width: 220 }} />
            <button style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(37,99,235,0.4)" }}>
              اشترك ←
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#475569" }}>
            © {currentYear} عقار بروكر · الرياض، المملكة العربية السعودية · جميع الحقوق محفوظة
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "الشروط", href: "/terms" },
              { label: "الخصوصية", href: "/privacy" },
              { label: "من نحن", href: "/about" },
            ].map((l, i) => (
              <a key={i} href={l.href} className="footer-link" style={{ fontSize: 12, color: "#475569", textDecoration: "none" }}>{l.label}</a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["Visa", "Mastercard", "مدى", "Apple Pay", "سداد"].map((p, i) => (
              <span key={i} style={{ fontSize: 11, color: "#475569", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
