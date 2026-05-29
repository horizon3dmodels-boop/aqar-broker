"use client";
import { useState } from "react";

type UserType = "broker" | "owner" | "contractor" | "engineer" | null;
type Step = "select" | "verify" | "done";

const userTypes = [
  { key: "broker", icon: "🤝", label: "وسيط عقاري", desc: "لديك رخصة فال وتتوسط في صفقات العقار", docs: ["رخصة فال"] },
  { key: "owner", icon: "🏠", label: "مالك عقار", desc: "تمتلك عقاراً وتريد نشر إعلان", docs: ["الهوية الوطنية", "صك العقار"] },
  { key: "contractor", icon: "🔧", label: "مقاول", desc: "تقدم خدمات البناء والتشطيب", docs: ["السجل التجاري"] },
  { key: "engineer", icon: "📐", label: "مكتب هندسي", desc: "تقدم خدمات التصميم والإشراف الهندسي", docs: ["الترخيص المهني"] },
];

export default function VerifyPage() {
  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const [falLicense, setFalLicense] = useState("");
  const [commercialReg, setCommercialReg] = useState("");
  const [engineeringLicense, setEngineeringLicense] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [deedNumber, setDeedNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = () => {
    setError("");
    if (selectedType === "broker" && !falLicense) { setError("رقم رخصة فال مطلوب"); return; }
    if (selectedType === "contractor" && !commercialReg) { setError("رقم السجل التجاري مطلوب"); return; }
    if (selectedType === "engineer" && !engineeringLicense) { setError("رقم الترخيص المهني مطلوب"); return; }
    if (selectedType === "owner" && (!nationalId || !deedNumber)) { setError("رقم الهوية والصك مطلوبان"); return; }

    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("done"); }, 1500);
  };

  const inputStyle = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA", outline: "none", transition: "border-color 0.2s" };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #f8f9fb 0%, #f0fdf4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; }
        .type-card { transition: all 0.2s; cursor: pointer; }
        .type-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .type-card.selected { border-color: #16a34a !important; background: #F0FDF4 !important; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 4px 16px rgba(22,163,74,0.3)" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 24 }}>ع</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>توثيق الحساب</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>وثّق حسابك للاستفادة من كامل مزايا المنصة</p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, justifyContent: "center" }}>
          {[{ num: 1, label: "اختر فئتك" }, { num: 2, label: "التوثيق" }, { num: 3, label: "مكتمل" }].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, background: (step === "select" && i === 0) || (step === "verify" && i === 1) || (step === "done" && i === 2) ? "#16a34a" : (step === "verify" && i === 0) || (step === "done" && i <= 1) ? "#16a34a" : "#E5E7EB", color: (step === "verify" && i === 0) || (step === "done" && i <= 1) || (step === "select" && i === 0) || (step === "verify" && i === 1) || (step === "done" && i === 2) ? "#fff" : "#9CA3AF" }}>
                  {(step === "verify" && i === 0) || (step === "done" && i < 2) ? "✓" : s.num}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: 32, height: 1, background: "#E5E7EB" }} />}
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #F0F0F0" }}>

          {/* Step 1: Select Type */}
          {step === "select" && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>ما هي فئتك؟</h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>اختر الفئة التي تناسبك لنحدد المستندات المطلوبة</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {userTypes.map(t => (
                  <div key={t.key} className={`type-card${selectedType === t.key ? " selected" : ""}`} onClick={() => setSelectedType(t.key as UserType)} style={{ border: `2px solid ${selectedType === t.key ? "#16a34a" : "#E5E7EB"}`, borderRadius: 14, padding: "14px 16px", background: selectedType === t.key ? "#F0FDF4" : "#fff", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{t.desc}</div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {selectedType === t.key
                        ? <div style={{ width: 20, height: 20, background: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>✓</div>
                        : <div style={{ width: 20, height: 20, border: "2px solid #E5E7EB", borderRadius: "50%" }} />
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* نفاذ */}
              <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "16px", border: "1px solid #E5E7EB", marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>التحقق من الهوية عبر نفاذ</p>
                <button style={{ width: "100%", background: "linear-gradient(135deg, #1a3a6b, #2563EB)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
                  <span style={{ fontSize: 20 }}>🇸🇦</span>
                  تسجيل عبر النفاذ الوطني
                </button>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8, textAlign: "center" }}>سيتم توجيهك لمنصة نفاذ الحكومية للتحقق من هويتك</p>
              </div>

              <button
                onClick={() => { if (selectedType) setStep("verify"); }}
                disabled={!selectedType}
                style={{ width: "100%", background: selectedType ? "#16a34a" : "#E5E7EB", color: selectedType ? "#fff" : "#9CA3AF", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: selectedType ? "pointer" : "not-allowed", fontFamily: "'Cairo', sans-serif", boxShadow: selectedType ? "0 4px 14px rgba(22,163,74,0.3)" : "none", transition: "all 0.2s" }}
              >
                التالي — رفع المستندات ←
              </button>
            </div>
          )}

          {/* Step 2: Upload Docs */}
          {step === "verify" && (
            <div>
              <button onClick={() => setStep("select")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6B7280", fontFamily: "'Cairo'", marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
                ← رجوع
              </button>

              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
                {userTypes.find(t => t.key === selectedType)?.icon} رفع مستندات {userTypes.find(t => t.key === selectedType)?.label}
              </h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>أدخل بيانات المستندات المطلوبة للتوثيق</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* وسيط عقاري */}
                {selectedType === "broker" && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
                      رقم رخصة فال <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input value={falLicense} onChange={e => setFalLicense(e.target.value)} placeholder="مثال: FAL-12345678" style={inputStyle} />
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>يمكنك التحقق من رخصتك على موقع الهيئة العامة للعقار</p>
                  </div>
                )}

                {/* مقاول */}
                {selectedType === "contractor" && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
                      رقم السجل التجاري <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input value={commercialReg} onChange={e => setCommercialReg(e.target.value)} placeholder="مثال: 1010123456" style={inputStyle} />
                  </div>
                )}

                {/* مكتب هندسي */}
                {selectedType === "engineer" && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
                      رقم الترخيص المهني <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input value={engineeringLicense} onChange={e => setEngineeringLicense(e.target.value)} placeholder="مثال: ENG-12345" style={inputStyle} />
                  </div>
                )}

                {/* مالك عقار */}
                {selectedType === "owner" && (
                  <>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
                        رقم الهوية الوطنية <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="مثال: 1234567890" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
                        رقم الصك العقاري <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input value={deedNumber} onChange={e => setDeedNumber(e.target.value)} placeholder="مثال: 1234567890123" style={inputStyle} />
                    </div>
                  </>
                )}

                {/* رفع صورة المستند */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>صورة المستند</label>
                  <div style={{ border: "2px dashed #BBF7D0", background: "#F0FDF4", borderRadius: 14, padding: "24px", textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#16a34a", margin: 0 }}>اضغط لرفع صورة المستند</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>PDF أو JPG أو PNG — حتى 5MB</p>
                  </div>
                </div>

                {error && (
                  <div style={{ background: "#FFF5F5", border: "1.5px solid #FECACA", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ fontSize: 13, color: "#EF4444", fontWeight: 600 }}>{error}</span>
                  </div>
                )}

                <button onClick={handleVerify} disabled={loading} style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 14px rgba(22,163,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading ? (
                    <>
                      <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      جاري التحقق...
                    </>
                  ) : "إرسال للمراجعة ✓"}
                </button>

                <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
                  سيتم مراجعة طلبك خلال 24 ساعة وإشعارك بالنتيجة
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20, boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}>
                ✅
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>تم إرسال طلب التوثيق!</h2>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.8, marginBottom: 28 }}>
                سيتم مراجعة مستنداتك خلال <strong>24 ساعة</strong> وستصلك رسالة بالنتيجة على بريدك الإلكتروني.
              </p>

              <div style={{ background: "#F0FDF4", borderRadius: 16, padding: "16px 20px", border: "1.5px solid #BBF7D0", marginBottom: 24, textAlign: "right" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 10 }}>في انتظار التوثيق يمكنك:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["تصفح العقارات والمشاريع", "إضافة العقارات للمفضلة", "التواصل مع المقاولين والمهندسين"].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <a href="/" style={{ flex: 1, background: "#16a34a", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, textAlign: "center", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
                  الذهاب للرئيسية
                </a>
                <a href="/profile" style={{ flex: 1, background: "#F8F9FB", color: "#374151", textDecoration: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, textAlign: "center", fontFamily: "'Cairo', sans-serif", border: "1.5px solid #E5E7EB" }}>
                  الملف الشخصي
                </a>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
          لديك مشكلة في التوثيق؟ <a href="#" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>تواصل مع الدعم</a>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
