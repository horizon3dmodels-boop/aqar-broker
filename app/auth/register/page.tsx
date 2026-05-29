"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Step = 1 | 2 | 3;
type UserType = "visitor" | "broker" | "owner" | "contractor" | "engineer";

const userTypes = [
  { key: "visitor", icon: "🔍", label: "باحث عن عقار", desc: "أبحث عن عقار للشراء أو الإيجار", steps: 1 },
  { key: "broker", icon: "🤝", label: "وسيط عقاري", desc: "أمتلك رخصة فال وأتوسط في الصفقات", steps: 3 },
  { key: "owner", icon: "🏠", label: "مالك عقار", desc: "أمتلك عقاراً وأريد نشر إعلان", steps: 2 },
  { key: "contractor", icon: "🔧", label: "مقاول", desc: "أقدم خدمات البناء والتشطيب", steps: 3 },
  { key: "engineer", icon: "📐", label: "مكتب هندسي", desc: "أقدم خدمات التصميم والإشراف", steps: 3 },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [authMethod, setAuthMethod] = useState<"nafath" | "email" | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", falLicense: "", commercialReg: "", engineeringLicense: "" });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // رفع الصورة الشخصية
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const totalSteps = userType === "visitor" ? 2 : userType === "owner" ? 2 : 3;
  const progress = (step / totalSteps) * 100;

  const handleNafath = () => {
    setAuthMethod("nafath");
    setStep(2);
  };

  const handleNext = () => {
    if (step === 1 && authMethod === "email" && (!form.name || !form.email || !form.password)) return;
    if (step === 2 && !userType) return;
    if (step < 3) setStep((step + 1) as Step);
  };

  const handleFinish = async () => {
    setLoading(true);
    let userId = null;
    
    // إذا كان التسجيل بالإيميل — أنشئ الحساب
    if (authMethod === "email") {
      if (!form.email || !form.password) {
        alert("يرجى إدخال الإيميل وكلمة المرور");
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      
      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }
      userId = data.user?.id;
    } else {
      // نفاذ — جلب المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }
    
    // حفظ البيانات في جدول profiles
    if (userId) {
      let avatarUrl = null;

      // رفع الصورة الشخصية إن وجدت
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `avatars/${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from("property-images").upload(path, avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);
          avatarUrl = publicUrl;
        }
      }

      await supabase.from('profiles').upsert({
        id: userId,
        full_name: form.name || null,
        role: userType || 'visitor',
        fal_license: form.falLicense || null,
        commercial_register: form.commercialReg || null,
        avatar_url: avatarUrl,
        verified: true,
        has_package: false,
        sakk_uploaded: false,
      });
    }
    
    setLoading(false);
    router.push("/");
  };

  const inputStyle = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA", outline: "none" };

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #f8f9fb 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; }
        .type-card { transition: all 0.2s; cursor: pointer; border: 2px solid #E5E7EB; }
        .type-card:hover { border-color: #16a34a; background: #F0FDF4; transform: translateY(-1px); }
        .type-card.active { border-color: #16a34a !important; background: #F0FDF4 !important; }
        .method-btn { transition: all 0.2s; cursor: pointer; }
        .method-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10, boxShadow: "0 4px 16px rgba(22,163,74,0.3)" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>ع</span>
            </div>
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0 }}>إنشاء حساب جديد</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>انضم إلى منصة عقار بروكر</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 14, padding: 4, marginBottom: 20 }}>
          <button style={{ flex: 1, padding: "10px", borderRadius: 11, border: "none", background: "#fff", color: "#16a34a", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            حساب جديد
          </button>
          <a href="/auth/login" style={{ flex: 1, padding: "10px", borderRadius: 11, border: "none", background: "transparent", color: "#6B7280", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo'", textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            تسجيل الدخول
          </a>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: 600 }}>
            <span>الخطوة {step} من {userType ? totalSteps : "؟"}</span>
            <span>{step === 1 ? "طريقة التسجيل" : step === 2 ? "نوع حسابك" : "التوثيق"}</span>
          </div>
          <div style={{ background: "#E5E7EB", borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)", height: "100%", borderRadius: 8, transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #F0F0F0" }}>

          {/* ── Step 1: طريقة التسجيل ── */}
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>كيف تريد التسجيل؟</h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>اختر الطريقة الأنسب لك</p>

              {/* صورة شخصية */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div onClick={() => avatarInputRef.current?.click()}
                  style={{ width: 80, height: 80, borderRadius: "50%", border: "2px dashed #BBF7D0", background: "#F0FDF4", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", transition: "all 0.2s", marginBottom: 6 }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 28 }}>📷</span>
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>صورة شخصية (اختياري)</p>
              </div>

              {/* نفاذ */}
              <button onClick={handleNafath} disabled={loading} className="method-btn" style={{ width: "100%", background: "linear-gradient(135deg, #1a3a6b, #2563EB)", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 16px rgba(37,99,235,0.3)", marginBottom: 12 }}>
                {loading ? (
                  <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : <span style={{ fontSize: 22 }}>🇸🇦</span>}
                {loading ? "جاري التحقق..." : "تسجيل عبر النفاذ الوطني"}
                {!loading && <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 20, marginRight: 4 }}>⚡ الأسرع</span>}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>أو بالبريد الإلكتروني</span>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              </div>

              {/* Email Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setAuthMethod("email"); }} placeholder="الاسم الكامل *" style={inputStyle} />
                <input type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setAuthMethod("email"); }} placeholder="البريد الإلكتروني *" style={inputStyle} />
                <div style={{ position: "relative" }}>
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={form.password} 
                    onChange={(e) => {
                      // السماح بالأحرف الإنجليزية والأرقام والرموز فقط
                      const val = e.target.value.replace(/[^\x00-\x7F]/g, '');
                      setForm({ ...form, password: val });
                      setAuthMethod("email");
                    }} 
                    placeholder="Password (A-Z, 0-9, !@#$)" 
                    style={inputStyle} 
                    pattern="(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}"
                    lang="en"
                  />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</button>
                </div>
                <input type={showPass ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="تأكيد كلمة المرور *" style={inputStyle} />

                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#374151" }}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#16a34a" }} />
                  أوافق على <a href="#" style={{ color: "#16a34a", fontWeight: 700 }}>الشروط والأحكام</a> و<a href="#" style={{ color: "#16a34a", fontWeight: 700 }}>سياسة الخصوصية</a>
                </label>

                <button onClick={() => {
                  if (!form.name || !form.email || !form.password || !form.confirmPassword) return;
                  
                  // التحقق من كلمة المرور
                  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
                  if (!passwordRegex.test(form.password)) {
                    alert("كلمة المرور يجب أن تحتوي على:\n• 8 أحرف على الأقل\n• حرف كبير واحد على الأقل\n• رقم واحد على الأقل\n• رمز خاص واحد على الأقل (!@#$%^&*)");
                    return;
                  }
                  if (form.password !== form.confirmPassword) {
                    alert("كلمة المرور وتأكيدها غير متطابقتين");
                    return;
                  }
                  if (!agreed) return;
                  
                  setAuthMethod("email");
                  setStep(2);
                }} style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo'", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
                  إنشاء الحساب ←
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: نوع الحساب ── */}
          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>ما هي فئتك؟</h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>اختر الفئة المناسبة لتجربة مخصصة</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                {userTypes.map(t => (
                  <div key={t.key} className={`type-card${userType === t.key ? " active" : ""}`} onClick={() => setUserType(t.key as UserType)} style={{ borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{t.desc}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${userType === t.key ? "#16a34a" : "#E5E7EB"}`, background: userType === t.key ? "#16a34a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "#fff" }}>
                      {userType === t.key ? "✓" : ""}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: "#F8F9FB", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>
                  ← رجوع
                </button>
                <button
                  onClick={() => {
                    if (!userType) return;
                    if (userType === "visitor" || userType === "owner") { handleFinish(); }
                    else { setStep(3); }
                  }}
                  disabled={!userType}
                  style={{ flex: 2, background: userType ? "#16a34a" : "#E5E7EB", color: userType ? "#fff" : "#9CA3AF", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800, cursor: userType ? "pointer" : "not-allowed", fontFamily: "'Cairo'", boxShadow: userType ? "0 4px 14px rgba(22,163,74,0.3)" : "none" }}
                >
                  {userType === "visitor" || userType === "owner" ? "إنشاء الحساب ✓" : "التالي ←"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: التوثيق ── */}
          {step === 3 && (
            <div className="fade-in">
              <button onClick={() => setStep(2)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6B7280", fontFamily: "'Cairo'", marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>
                ← رجوع
              </button>

              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                {userTypes.find(t => t.key === userType)?.icon} توثيق {userTypes.find(t => t.key === userType)?.label}
              </h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
                {userType === "broker" && "أدخل رقم رخصة فال (يمكن تخطيه والإضافة لاحقاً)"}
                {userType === "contractor" && "أدخل رقم السجل التجاري"}
                {userType === "engineer" && "أدخل رقم الترخيص المهني"}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                {userType === "broker" && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
                      رقم رخصة فال
                      <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginRight: 6 }}>(اختياري — إلزامي عند نشر إعلان)</span>
                    </label>
                    <input value={form.falLicense} onChange={e => setForm({ ...form, falLicense: e.target.value })} placeholder="مثال: FAL-12345678" style={inputStyle} />
                  </div>
                )}
                {userType === "contractor" && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>رقم السجل التجاري <span style={{ color: "#EF4444" }}>*</span></label>
                    <input value={form.commercialReg} onChange={e => setForm({ ...form, commercialReg: e.target.value })} placeholder="مثال: 1010123456" style={inputStyle} />
                  </div>
                )}
                {userType === "engineer" && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>رقم الترخيص المهني <span style={{ color: "#EF4444" }}>*</span></label>
                    <input value={form.engineeringLicense} onChange={e => setForm({ ...form, engineeringLicense: e.target.value })} placeholder="مثال: ENG-12345" style={inputStyle} />
                  </div>
                )}

                {/* رفع مستند */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>صورة المستند</label>
                  <div style={{ border: "2px dashed #BBF7D0", background: "#F0FDF4", borderRadius: 14, padding: "20px", textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#16a34a", margin: 0 }}>اضغط لرفع المستند</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>PDF أو JPG أو PNG — حتى 5MB</p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {userType === "broker" && (
                  <button onClick={handleFinish} style={{ flex: 1, background: "#F8F9FB", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "13px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>
                    تخطّي الآن
                  </button>
                )}
                <button onClick={handleFinish} disabled={loading} style={{ flex: 2, background: "#16a34a", color: "#fff", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo'", boxShadow: "0 4px 14px rgba(22,163,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : null}
                  {loading ? "جاري الإنشاء..." : "إنشاء الحساب ✓"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
          لديك حساب بالفعل؟ <a href="/auth/login" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>سجّل دخولك</a>
        </p>
      </div>
    </div>
  );
}