"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Tab = "broker" | "contractor";
type Billing = "monthly" | "yearly";

const faqs = [
  { q: "هل يمكنني تغيير الباقة لاحقاً؟", a: "نعم، يمكنك الترقية أو التخفيض في أي وقت. يتم احتساب الفرق بالتناسب." },
  { q: "ما طرق الدفع المتاحة؟", a: "مدى، Visa، Mastercard، Apple Pay، وسداد — جميعها عبر منصة Moyasar الآمنة." },
  { q: "هل يوجد عقد طويل الأمد؟", a: "لا. الاشتراك شهري أو سنوي وتستطيع الإلغاء في أي وقت." },
  { q: "كيف تعمل التجربة المجانية؟", a: "أيام مجانية كاملة بدون إدخال بيانات الدفع. تلقائياً تتحول للباقة المجانية بعدها." },
  { q: "هل رخصة الإعلان مشمولة؟", a: "نعم. جميع الباقات تشمل رخصة إعلان عقاري معتمدة من الهيئة العامة للعقار." },
  { q: "ما الفرق بين الإعلان المفرد والاشتراك؟", a: "الإعلان المفرد لنشر إعلان واحد فقط. الاشتراك يعطيك عدة إعلانات ومزايا إضافية شهرياً." },
];

const ctaColors: Record<string, { bg: string; color: string; border: string }> = {
  outline: { bg: "#fff", color: "#374151", border: "1.5px solid #E5E7EB" },
  blue:    { bg: "#0EA5E9", color: "#fff", border: "none" },
  green:   { bg: "#16a34a", color: "#fff", border: "none" },
  purple:  { bg: "#7C3AED", color: "#fff", border: "none" },
  amber:   { bg: "#F59E0B", color: "#fff", border: "none" },
};

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("broker");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [s, setS] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("site_settings").select("key, value").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.key] = r.value; });
        setS(map);
      }
      setLoading(false);
    });
  }, []);

  const val = (key: string, fallback = "") => s[key] ?? fallback;
  const num = (key: string, fallback = 0) => Number(s[key]) || fallback;
  const isEnabled = (key: string) => s[key] !== "false";
  const yearlyDiscount = num("yearly_discount", 20);
  const yearly = (monthly: number) => Math.round(monthly * (1 - yearlyDiscount / 100));

  // ✅ باقات الوسطاء من site_settings
  const brokerPlans = [
    {
      name: "مجاني",
      price: { monthly: 0, yearly: 0 },
      color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB",
      badge: null, ctaStyle: "outline", cta: "ابدأ مجاناً",
      enabled: true,
      features: [
        { text: "إعلان واحد نشط", ok: true },
        { text: `${val("trial_days", "7")} أيام تجريبية مجانية`, ok: true },
        { text: "ظهور عادي في النتائج", ok: true },
        { text: "دبوس مميز على الخريطة", ok: false },
        { text: "Boost رفع الإعلان", ok: false },
        { text: "إحصائيات متقدمة", ok: false },
      ],
    },
    {
      name: val("pkg1_name", "أساسي"),
      price: { monthly: num("pkg1_price", 199), yearly: yearly(num("pkg1_price", 199)) },
      color: "#0EA5E9", bg: "#F0F9FF", border: "#BAE6FD",
      badge: null, ctaStyle: "blue", cta: "اشترك الآن",
      enabled: isEnabled("pkg1_enabled"),
      features: [
        { text: `${val("pkg1_ads", "10")} إعلانات نشطة`, ok: true },
        { text: `${val("pkg1_duration", "30")} يوم لكل إعلان`, ok: true },
        { text: "ظهور مميز في النتائج", ok: true },
        { text: "دبوس مميز على الخريطة", ok: false },
        { text: "Boost رفع الإعلان", ok: false },
        { text: "إحصائيات متقدمة", ok: false },
      ],
    },
    {
      name: val("pkg2_name", "متقدم"),
      price: { monthly: num("pkg2_price", 399), yearly: yearly(num("pkg2_price", 399)) },
      color: "#16a34a", bg: "#F0FDF4", border: "#BBF7D0",
      badge: "الأكثر طلباً", ctaStyle: "green", cta: "اشترك الآن",
      enabled: isEnabled("pkg2_enabled"),
      features: [
        { text: `${val("pkg2_ads", "25")} إعلاناً نشطاً`, ok: true },
        { text: `${val("pkg2_duration", "60")} يوم لكل إعلان`, ok: true },
        { text: "أعلى النتائج دائماً", ok: true },
        { text: "دبوس ذهبي على الخريطة", ok: true },
        { text: "Boost x2 شهرياً", ok: true },
        { text: "إحصائيات متقدمة", ok: true },
      ],
    },
    {
      name: val("pkg3_name", "بريميم"),
      price: { monthly: num("pkg3_price", 699), yearly: yearly(num("pkg3_price", 699)) },
      color: "#7C3AED", bg: "#F5F3FF", border: "#C4B5FD",
      badge: "الأفضل للمكاتب", ctaStyle: "purple", cta: "اشترك الآن",
      enabled: isEnabled("pkg3_enabled"),
      features: [
        { text: `${val("pkg3_ads", "50")} إعلاناً نشطاً`, ok: true },
        { text: `${val("pkg3_duration", "90")} يوم لكل إعلان`, ok: true },
        { text: "أعلى النتائج دائماً", ok: true },
        { text: "دبوس ذهبي على الخريطة", ok: true },
        { text: "Boost غير محدود", ok: true },
        { text: "مدير حساب مخصص", ok: true },
      ],
    },
  ].filter(p => p.enabled);

  // ✅ باقات المقاولين والمهندسين من site_settings
  const contractorPlans = [
    {
      name: "مجاني",
      price: { monthly: 0, yearly: 0 },
      color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB",
      badge: null, ctaStyle: "outline", cta: "ابدأ مجاناً",
      enabled: true,
      features: [
        { text: "ملف تعريفي أساسي", ok: true },
        { text: "ظهور في نتائج البحث", ok: true },
        { text: `${val("trial_days", "7")} أيام تجريبية`, ok: true },
        { text: "شارة موثق ✓", ok: false },
        { text: "أولوية في البحث", ok: false },
        { text: "إحصائيات الزيارات", ok: false },
      ],
    },
    {
      name: "مقاول احترافي",
      price: {
        monthly: num("contractor_monthly", 299),
        yearly: Math.round(num("contractor_monthly", 299) * 12 * (1 - yearlyDiscount / 100) / 12),
      },
      color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A",
      badge: null, ctaStyle: "amber", cta: "اشترك الآن",
      enabled: isEnabled("contractor_enabled"),
      features: [
        { text: "ملف تعريفي كامل", ok: true },
        { text: "أولوية في نتائج البحث", ok: true },
        { text: "شارة موثق ✓", ok: true },
        { text: "عرض المشاريع السابقة", ok: true },
        { text: "إحصائيات الزيارات", ok: false },
        { text: "عروض مباشرة للعملاء", ok: false },
      ],
    },
    {
      name: "مكتب هندسي",
      price: {
        monthly: num("engineer_monthly", 399),
        yearly: Math.round(num("engineer_monthly", 399) * 12 * (1 - yearlyDiscount / 100) / 12),
      },
      color: "#16a34a", bg: "#F0FDF4", border: "#BBF7D0",
      badge: "الأكثر طلباً", ctaStyle: "green", cta: "اشترك الآن",
      enabled: isEnabled("engineer_enabled"),
      features: [
        { text: "ملف تعريفي كامل + فيديو", ok: true },
        { text: "أعلى نتائج البحث", ok: true },
        { text: "شارة موثق ذهبية ⭐", ok: true },
        { text: "عرض المشاريع السابقة", ok: true },
        { text: "إحصائيات كاملة", ok: true },
        { text: "عروض مباشرة للعملاء", ok: true },
      ],
    },
  ].filter(p => p.enabled);

  const plans = activeTab === "broker" ? brokerPlans : contractorPlans;

  // ✅ الإضافات من site_settings
  const addons = [
    {
      icon: "🚀", name: "Boost إعلان",
      desc: `ارفع إعلانك لأعلى النتائج لمدة ${val("boost_duration", "7")} أيام`,
      price: `${val("boost_price", "29")} ر.س`,
      enabled: isEnabled("boost_enabled"),
    },
    {
      icon: "📍", name: "دبوس الخريطة المميز",
      desc: `دبوس ذهبي بارز على خريطة عقار بروكر لمدة ${val("map_pkg_duration", "30")} يوم`,
      price: `${val("map_pkg_price", "149")} ر.س`,
      enabled: isEnabled("map_pkg_enabled"),
    },
    {
      icon: "📢", name: "إعلان مفرد",
      desc: `نشر إعلان واحد لمدة ${val("single_ad_duration", "30")} يوماً بدون اشتراك`,
      price: `${val("single_ad_price", "49")} ر.س`,
      enabled: isEnabled("single_ad_enabled"),
    },
    {
      icon: "📊", name: "تقرير تحليلي",
      desc: "تقرير مفصل عن أداء إعلاناتك وزياراتك",
      price: "39 ر.س",
      enabled: true,
    },
  ].filter(a => a.enabled);

  if (loading) return (
    <div style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F9FB" }}>
      <div style={{ textAlign: "center", color: "#9CA3AF" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
        <p style={{ fontWeight: 600 }}>جاري تحميل الأسعار...</p>
      </div>
    </div>
  );

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .plan-card { transition: transform 0.2s, box-shadow 0.2s; }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; }
        .faq-item { transition: all 0.2s; cursor: pointer; }
        .faq-item:hover { background: #F8FAFC !important; }
        .addon-card { transition: all 0.2s; cursor: pointer; }
        .addon-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .tab-btn { transition: all 0.2s; }
      `}</style>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #052e16 0%, #16a34a 100%)", padding: "56px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 20, marginBottom: 16 }}>
          💰 شفافية كاملة في التسعير
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 12, lineHeight: 1.3 }}>
          باقات تناسب جميع احتياجاتك
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.8 }}>
          ابدأ مجاناً وطوّر باقتك عند الحاجة — بدون عقود طويلة أو رسوم خفية
        </p>

        {/* Tab Selector */}
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 4, gap: 4, marginBottom: 24 }}>
          {[
            { key: "broker", label: "🤝 الوسطاء العقاريون" },
            { key: "contractor", label: "🔧 المقاولون والمهندسون" },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as Tab)} className="tab-btn" style={{
              padding: "10px 24px", borderRadius: 12, border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700, fontFamily: "'Cairo', sans-serif",
              background: activeTab === t.key ? "#fff" : "transparent",
              color: activeTab === t.key ? "#16a34a" : "rgba(255,255,255,0.85)",
              boxShadow: activeTab === t.key ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Billing Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: billing === "monthly" ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: billing === "monthly" ? 700 : 400 }}>شهري</span>
          <button onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")} style={{ width: 48, height: 26, borderRadius: 13, background: billing === "yearly" ? "#22c55e" : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, transition: "all 0.2s", right: billing === "yearly" ? 3 : "auto", left: billing === "yearly" ? "auto" : 3 }} />
          </button>
          <span style={{ fontSize: 14, color: billing === "yearly" ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: billing === "yearly" ? 700 : 400 }}>سنوي</span>
          {billing === "yearly" && isEnabled("yearly_discount_enabled") && (
            <span style={{ background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 20 }}>وفّر {yearlyDiscount}%</span>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{ maxWidth: 1200, margin: "-24px auto 0", padding: "0 24px 48px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: 20 }}>
          {plans.map((plan, i) => (
            <div key={i} className="plan-card" style={{
              background: "#fff", borderRadius: 24, border: `2px solid ${plan.border}`,
              padding: "28px 24px", position: "relative", overflow: "hidden",
              boxShadow: plan.badge ? `0 8px 32px ${plan.color}22` : "0 2px 12px rgba(0,0,0,0.07)",
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: 16, left: 16, background: plan.color, color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 20 }}>
                  ⭐ {plan.badge}
                </div>
              )}
              <div style={{ marginTop: plan.badge ? 28 : 0, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: plan.color, background: plan.bg, padding: "3px 12px", borderRadius: 20 }}>{plan.name}</span>
              </div>
              <div style={{ marginBottom: 20 }}>
                {plan.price.monthly === 0 ? (
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#0f172a" }}>مجاناً</div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontSize: 36, fontWeight: 900, color: plan.color }}>
                        {billing === "yearly" ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span style={{ fontSize: 14, color: "#6B7280", marginBottom: 8 }}>ر.س / شهر</span>
                    </div>
                    {billing === "yearly" && (
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        يُدفع سنوياً — <span style={{ textDecoration: "line-through" }}>{plan.price.monthly}</span> ر.س شهرياً
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button style={{
                width: "100%", padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 800,
                cursor: "pointer", fontFamily: "'Cairo', sans-serif", marginBottom: 22,
                background: ctaColors[plan.ctaStyle].bg, color: ctaColors[plan.ctaStyle].color,
                border: ctaColors[plan.ctaStyle].border,
                boxShadow: plan.ctaStyle !== "outline" ? `0 4px 14px ${plan.color}44` : "none",
              }}>{plan.cta} ←</button>
              <div style={{ borderTop: `1px solid ${plan.border}`, marginBottom: 18 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: f.ok ? "#374151" : "#9CA3AF" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: f.ok ? "#DCFCE7" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: f.ok ? "#16a34a" : "#9CA3AF" }}>
                      {f.ok ? "✓" : "×"}
                    </span>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
          جميع الأسعار لا تشمل ضريبة القيمة المضافة 15% · الفواتير متوافقة مع متطلبات ZATCA
        </p>
      </div>

      {/* Add-ons */}
      {addons.length > 0 && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 56px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>إضافات بالدفع مرة واحدة</h2>
            <p style={{ fontSize: 14, color: "#6B7280" }}>عزّز ظهور إعلانك بدون اشتراك شهري</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${addons.length}, 1fr)`, gap: 16 }}>
            {addons.map((a, i) => (
              <div key={i} className="addon-card" style={{ background: "#fff", borderRadius: 20, padding: "22px", border: "1px solid #F0F0F0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{a.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7, marginBottom: 14 }}>{a.desc}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#16a34a" }}>{a.price}</span>
                  <button style={{ background: "#F0FDF4", color: "#16a34a", border: "1.5px solid #BBF7D0", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>إضافة</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 56px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>أسئلة شائعة</h2>
          <p style={{ fontSize: 14, color: "#6B7280" }}>كل ما تحتاج معرفته قبل الاشتراك</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((f, i) => (
            <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{f.q}</span>
                <span style={{ fontSize: 18, color: "#6B7280", transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
              </div>
              {openFaq === i && (
                <div style={{ padding: "0 20px 18px", fontSize: 13, color: "#4B5563", lineHeight: 1.8, borderTop: "1px solid #F3F4F6" }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 56px" }}>
        <div style={{ background: "linear-gradient(135deg, #052e16, #16a34a)", borderRadius: 28, padding: "48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 10 }}>محتار ايش تختار؟ 🤔</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.8 }}>
              ابدأ بالتجربة المجانية {val("trial_days", "7")} أيام — بدون إدخال بيانات الدفع.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/auth/register" style={{ background: "#fff", color: "#16a34a", textDecoration: "none", borderRadius: 14, padding: "14px 28px", fontSize: 15, fontWeight: 800, fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                ابدأ مجاناً ←
              </a>
              <a href="https://wa.me/966500000000" target="_blank" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "14px 28px", fontSize: 15, fontWeight: 700, fontFamily: "'Cairo', sans-serif", border: "1.5px solid rgba(255,255,255,0.3)" }}>
                💬 تواصل معنا
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "24px", borderTop: "1px solid #F0F0F0", fontSize: 12, color: "#9CA3AF" }}>
        © 2025 عقار بروكر · جميع الأسعار بالريال السعودي · مرخص من الهيئة العامة للعقار
      </div>
    </div>
  );
}
