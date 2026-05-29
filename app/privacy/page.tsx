"use client";
import Navbar from "@/components/Navbar";

const sections = [
  {
    title: "البيانات التي نجمعها",
    icon: "📋",
    content: `نجمع البيانات التي تقدمها مباشرة عند التسجيل (الاسم، البريد الإلكتروني، رقم الجوال، رقم الهوية الوطنية للتحقق عبر نفاذ). كذلك نجمع بيانات الاستخدام تلقائياً مثل الصفحات التي تزورها والعقارات التي تتصفحها وعمليات البحث التي تجريها. لا نجمع أي بيانات حساسة كبيانات البطاقة البنكية — تُعالَج المدفوعات مباشرة عبر Moyasar.`,
  },
  {
    title: "كيف نستخدم بياناتك",
    icon: "🎯",
    content: `نستخدم بياناتك لتقديم خدمات المنصة وتحسينها، وللتحقق من هويتك عبر منصة نفاذ الوطنية، وإرسال إشعارات تتعلق بإعلاناتك واشتراكاتك. كذلك نستخدمها لتخصيص تجربة البحث وتوصية العقارات المناسبة لك، وللامتثال للمتطلبات النظامية بما فيها اشتراطات الهيئة العامة للعقار.`,
  },
  {
    title: "مشاركة البيانات مع أطراف ثالثة",
    icon: "🤝",
    content: `لا نبيع بياناتك الشخصية لأي طرف ثالث. نشارك بياناتك فقط مع: منصة نفاذ للتحقق من الهوية، Moyasar لمعالجة المدفوعات، الهيئة العامة للعقار للتحقق من رخص الوسطاء، وخدمات البنية التحتية مثل Supabase وVercel لتشغيل المنصة تقنياً. جميع هذه الجهات ملتزمة بأعلى معايير حماية البيانات.`,
  },
  {
    title: "أمان البيانات",
    icon: "🔒",
    content: `نطبّق أحدث معايير التشفير وأمان البيانات بما يشمل: تشفير SSL/TLS لجميع الاتصالات، تشفير كلمات المرور باستخدام bcrypt، نظام مصادقة ثنائي عبر منصة نفاذ، وقواعد بيانات محمية وفق معايير ISO 27001. رغم ذلك لا يوجد نظام آمن 100% ونشجعك على حماية كلمة مرورك.`,
  },
  {
    title: "ملفات تعريف الارتباط (Cookies)",
    icon: "🍪",
    content: `نستخدم ملفات تعريف الارتباط الضرورية لتشغيل المنصة (مثل حفظ جلسة تسجيل الدخول) وملفات تحليلية مجهولة الهوية لفهم كيفية استخدام المنصة وتحسينها. يمكنك التحكم في ملفات تعريف الارتباط من إعدادات متصفحك، لكن بعض ميزات المنصة قد لا تعمل بشكل صحيح عند تعطيلها.`,
  },
  {
    title: "حقوقك في بياناتك",
    icon: "⚖️",
    content: `وفق نظام حماية البيانات الشخصية السعودي، لك الحق في: الاطلاع على بياناتك الشخصية المحفوظة لدينا، تصحيح أي بيانات غير دقيقة، طلب حذف بياناتك (مع بعض القيود النظامية)، الاعتراض على معالجة بياناتك لأغراض التسويق. لممارسة هذه الحقوق، تواصل معنا عبر privacy@aqarbroker.com`,
  },
  {
    title: "الاحتفاظ بالبيانات",
    icon: "🗂️",
    content: `نحتفظ ببيانات حسابك طالما حسابك نشط. عند حذف حسابك، نحذف بياناتك الشخصية خلال 30 يوماً، باستثناء البيانات المطلوب الاحتفاظ بها وفق المتطلبات النظامية السعودية (مثل سجلات المعاملات المالية التي تُحتفظ بها 5 سنوات وفق نظام مكافحة غسل الأموال).`,
  },
  {
    title: "التغييرات على سياسة الخصوصية",
    icon: "📝",
    content: `قد نحدّث هذه السياسة من وقت لآخر. سنُخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق قبل 14 يوماً من تطبيقها. استمرارك في استخدام المنصة بعد التغييرات يعني موافقتك عليها.`,
  },
];

export default function PrivacyPage() {
  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>
      <Navbar />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginBottom: 10 }}>سياسة الخصوصية</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>آخر تحديث: مايو 2025 · متوافقة مع نظام حماية البيانات الشخصية السعودي</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "40px auto 56px", padding: "0 24px" }}>

        {/* Intro */}
        <div style={{ background: "#EDE9FE", border: "1.5px solid #C4B5FD", borderRadius: 16, padding: "16px 20px", marginBottom: 28, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🛡️</span>
          <p style={{ fontSize: 13, color: "#4C1D95", lineHeight: 1.8, margin: 0 }}>
            خصوصيتك تهمنا. هذه السياسة تشرح بوضوح كيف نجمع بياناتك ونستخدمها ونحميها وفق أعلى المعايير وأحكام نظام حماية البيانات الشخصية في المملكة العربية السعودية.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1px solid #F0F0F0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                {s.title}
              </h2>
              <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 2, margin: 0 }}>{s.content}</p>
            </div>
          ))}
        </div>

        {/* PDPL Badge */}
        <div style={{ background: "#F0FDF4", borderRadius: 16, padding: "20px 24px", marginTop: 24, border: "1.5px solid #BBF7D0", display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 32, flexShrink: 0 }}>🇸🇦</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#166534", marginBottom: 4 }}>متوافق مع PDPL</div>
            <p style={{ fontSize: 12, color: "#166534", margin: 0, lineHeight: 1.7 }}>
              هذه السياسة متوافقة مع نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم م/19 لعام 1443هـ وتعديلاته.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div style={{ background: "#F8F9FB", borderRadius: 16, padding: "20px 24px", marginTop: 14, border: "1px solid #E5E7EB" }}>
          <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.8 }}>
            <strong>مسؤول حماية البيانات:</strong> للاستفسار عن خصوصيتك أو ممارسة حقوقك، تواصل معنا على{" "}
            <a href="mailto:privacy@aqarbroker.com" style={{ color: "#4338ca", fontWeight: 700 }}>privacy@aqarbroker.com</a>
            {" "}أو عبر واتساب:{" "}
            <a href="https://wa.me/966500000000" style={{ color: "#4338ca", fontWeight: 700 }}>966500000000+</a>
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px", borderTop: "1px solid #F0F0F0", fontSize: 12, color: "#9CA3AF" }}>
        © 2025 عقار بروكر — جميع الحقوق محفوظة
      </div>
    </div>
  );
}
