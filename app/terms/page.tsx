"use client";
import Navbar from "@/components/Navbar";

const sections = [
  {
    title: "1. قبول الشروط",
    content: `باستخدامك منصة عقار بروكر، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يُرجى عدم استخدام المنصة. نحتفظ بحق تعديل هذه الشروط في أي وقت، وستُنشر التعديلات على هذه الصفحة مع تاريخ آخر تحديث.`,
  },
  {
    title: "2. الخدمات المقدمة",
    content: `توفر منصة عقار بروكر خدمات نشر الإعلانات العقارية، وربط الباحثين عن العقار بالوسطاء العقاريين المرخصين والمقاولين والمكاتب الهندسية المعتمدة في المملكة العربية السعودية. المنصة وسيط إلكتروني فقط ولا تتحمل مسؤولية الصفقات المُبرمة بين الأطراف.`,
  },
  {
    title: "3. شروط التسجيل",
    content: `يجب أن يكون عمر المستخدم 18 عاماً أو أكثر. يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة عند التسجيل. يحظر استخدام المنصة لأغراض احتيالية أو مخالفة للنظام السعودي. الوسطاء العقاريون ملزمون بالحصول على رخصة فال السارية من الهيئة العامة للعقار قبل نشر أي إعلان.`,
  },
  {
    title: "4. نشر الإعلانات",
    content: `يجب أن تكون جميع الإعلانات المنشورة صحيحة ودقيقة وغير مضللة. تحتفظ المنصة بحق إزالة أي إعلان يخالف السياسات أو الأنظمة المعمول بها. يُحظر نشر إعلانات لعقارات غير موجودة أو بيانات مزورة أو أسعار مضللة. يلتزم الناشر بامتلاك رخصة إعلان عقاري سارية المفعول من الهيئة العامة للعقار.`,
  },
  {
    title: "5. الدفع والاشتراكات",
    content: `تُعالَج جميع المدفوعات عبر منصة Moyasar المرخصة من البنك المركزي السعودي (ساما). رسوم الاشتراكات غير قابلة للاسترداد بعد 48 ساعة من الشراء. الأسعار المعروضة لا تشمل ضريبة القيمة المضافة 15% التي تُضاف تلقائياً عند الدفع. يمكن إلغاء الاشتراك في أي وقت مع الاحتفاظ بالمزايا حتى نهاية الفترة المدفوعة.`,
  },
  {
    title: "6. حقوق الملكية الفكرية",
    content: `جميع محتويات المنصة من تصميم وكود وعلامات تجارية هي ملك حصري لعقار بروكر. يُحظر نسخ أو توزيع أو استخدام أي محتوى دون إذن كتابي مسبق. محتوى الإعلانات التي ينشرها المستخدمون تظل ملكاً لأصحابها، مع منح المنصة ترخيصاً لعرضها.`,
  },
  {
    title: "7. حدود المسؤولية",
    content: `لا تتحمل منصة عقار بروكر أي مسؤولية عن الصفقات العقارية المُبرمة بين الأطراف. المنصة لا تضمن صحة المعلومات المقدمة من الوسطاء أو المعلنين رغم جهودها في التحقق منها. الاستثمار في العقارات ينطوي على مخاطر — يُنصح باستشارة متخصصين قبل اتخاذ أي قرار.`,
  },
  {
    title: "8. القانون المطبق",
    content: `تخضع هذه الشروط لأحكام نظام التجارة الإلكترونية ونظام حماية البيانات الشخصية في المملكة العربية السعودية. أي نزاع ينشأ عن استخدام المنصة يُحسم وفق الأنظمة السعودية المعمول بها أمام المحاكم السعودية المختصة.`,
  },
];

export default function TermsPage() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>
      <Navbar />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginBottom: 10 }}>الشروط والأحكام</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>آخر تحديث: مايو 2025</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "40px auto 56px", padding: "0 24px" }}>

        {/* Intro */}
        <div style={{ background: "#FEF9C3", border: "1.5px solid #FDE68A", borderRadius: 16, padding: "16px 20px", marginBottom: 28, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.8, margin: 0 }}>
            يُرجى قراءة هذه الشروط بعناية قبل استخدام منصة عقار بروكر. استخدامك للمنصة يعني موافقتك الكاملة على هذه الشروط.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #F0F0F0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 28, height: 28, background: "#F0FDF4", color: "#16a34a", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
                {s.title.replace(/^\d+\. /, "")}
              </h2>
              <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 2, margin: 0 }}>{s.content}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background: "#F0FDF4", borderRadius: 16, padding: "20px 24px", marginTop: 24, border: "1.5px solid #BBF7D0" }}>
          <p style={{ fontSize: 13, color: "#166534", margin: 0, lineHeight: 1.8 }}>
            <strong>تواصل معنا:</strong> لأي استفسار حول هذه الشروط، تواصل معنا عبر البريد الإلكتروني:{" "}
            <a href="mailto:legal@aqarbroker.com" style={{ color: "#16a34a", fontWeight: 700 }}>legal@aqarbroker.com</a>
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px", borderTop: "1px solid #F0F0F0", fontSize: 12, color: "#9CA3AF" }}>
        © 2025 عقار بروكر — جميع الحقوق محفوظة
      </div>
    </div>
  );
}
