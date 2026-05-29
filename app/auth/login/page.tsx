"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "owner", // تم تحديث القيمة الافتراضية لتتوافق مع الخيارات الجديدة
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "confirmPassword" || e.target.name === "password") setPassError("");
    setError("");
  };

  const handleSubmit = async () => {
    setError(""); setSuccess(""); setLoading(true);

    if (activeTab === "register") {
      if (form.password !== form.confirmPassword) {
        setPassError("كلمة المرور غير متطابقة!"); setLoading(false); return;
      }
      if (form.password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); setLoading(false); return;
      }

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name, phone: form.phone, role: form.role },
        },
      });

      if (error) {
        setError(error.message === "User already registered" ? "البريد الإلكتروني مسجل مسبقاً" : error.message);
        setLoading(false); return;
      }

      // احفظ البيانات في profiles مباشرة قبل توجيه المستخدم
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: form.name,
          phone: form.phone,
          role: form.role,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
      }

      router.push("/email-sent");
      setLoading(false);

    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        setError(
          error.message === "Invalid login credentials" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" :
          error.message === "Email not confirmed" ? "يرجى تأكيد بريدك الإلكتروني أولاً" :
          error.message
        );
        setLoading(false); return;
      }

      router.push("/profile");
      router.refresh();
    }
  };

  const inputStyle = {
    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12,
    padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif",
    color: "#374151", background: "#FAFAFA", transition: "all 0.2s",
  };

  const labelStyle = {
    fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6,
  } as React.CSSProperties;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important; outline: none; }
        .submit-btn:hover { background: #1d4ed8 !important; transform: translateY(-1px); }
        .submit-btn { transition: all 0.2s; }
        .tab-btn { transition: all 0.2s; }
        .national-btn:hover { background: #f0f9ff !important; border-color: #2563EB !important; }
        .national-btn { transition: all 0.2s; }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #EAECF0", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>ع</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>عقار بروكر</div>
            <div style={{ fontSize: 10, color: "#2563EB", fontWeight: 600 }}>Aqar Broker</div>
          </div>
        </a>
        <a href="/" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", fontWeight: 600 }}>← العودة للرئيسية</a>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "36px", boxShadow: "0 8px 40px rgba(0,0,0,0.10)", border: "1px solid #F0F0F0" }}>

            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 24 }}>ع</span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                {activeTab === "login" ? "أهلاً بك مجدداً 👋" : "إنشاء حساب جديد"}
              </h1>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}>
                {activeTab === "login" ? "سجّل دخولك للوصول لحسابك" : "انضم إلى منصة عقار بروكر"}
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 14, padding: 4, marginBottom: 28 }}>
              {(["login", "register"] as const).map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setPassError(""); setError(""); setSuccess(""); }} className="tab-btn" style={{ flex: 1, padding: "10px", borderRadius: 11, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Cairo', sans-serif", background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#2563EB" : "#6B7280", boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
                  {tab === "login" ? "تسجيل الدخول" : "حساب جديد"}
                </button>
              ))}
            </div>

            {/* النفاذ الوطني */}
            <button className="national-btn" style={{ width: "100%", border: "1.5px solid #E5E7EB", background: "#fff", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              <span>🪪</span> تسجيل عبر النفاذ الوطني
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>أو بالبريد الإلكتروني</span>
              <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            </div>

            {/* رسائل */}
            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#DC2626", fontWeight: 600, marginBottom: 16, textAlign: "center" }}>
                ❌ {error}
              </div>
            )}
            {success && (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#16a34a", fontWeight: 600, marginBottom: 16, textAlign: "center" }}>
                {success}
              </div>
            )}

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeTab === "register" && (
                <div>
                  <label style={labelStyle}>الاسم الكامل <span style={{ color: "#EF4444" }}>*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="باسل محمد" style={inputStyle} />
                </div>
              )}

              {activeTab === "register" && (
                <div>
                  <label style={labelStyle}>نوع الحساب <span style={{ color: "#EF4444" }}>*</span></label>
                  <select name="role" value={form.role} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="owner">🏠 مالك عقار</option>
                    <option value="broker">🤝 وسيط عقاري / مسوق عقاري</option>
                    <option value="contractor">🔧 مقاول</option>
                    <option value="engineer">📐 مكتب هندسي</option>
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>البريد الإلكتروني <span style={{ color: "#EF4444" }}>*</span></label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" style={{ ...inputStyle, direction: "ltr", textAlign: "right" }} />
              </div>

              {activeTab === "register" && (
                <div>
                  <label style={labelStyle}>رقم الجوال <span style={{ color: "#EF4444" }}>*</span></label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="05xxxxxxxx" style={{ ...inputStyle, direction: "ltr", textAlign: "right" }} />
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>كلمة المرور <span style={{ color: "#EF4444" }}>*</span></label>
                  {activeTab === "login" && (
                    <a href="#" style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>نسيت كلمة المرور؟</a>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 44 }} />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9CA3AF" }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {activeTab === "register" && (
                <div>
                  <label style={labelStyle}>تأكيد كلمة المرور <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input name="confirmPassword" type={showConfirmPass ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 44, borderColor: passError ? "#EF4444" : "#E5E7EB", background: passError ? "#FFF5F5" : "#FAFAFA" }} />
                    <button onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9CA3AF" }}>
                      {showConfirmPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {passError && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6, fontWeight: 600 }}>❌ {passError}</p>}
                  {!passError && form.confirmPassword && form.password === form.confirmPassword && (
                    <p style={{ fontSize: 12, color: "#16a34a", marginTop: 6, fontWeight: 600 }}>✅ كلمة المرور متطابقة</p>
                  )}
                </div>
              )}

              {activeTab === "register" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" id="terms" style={{ width: 16, height: 16, accentColor: "#2563EB", cursor: "pointer", flexShrink: 0 }} />
                  <label htmlFor="terms" style={{ fontSize: 12, color: "#6B7280", cursor: "pointer", lineHeight: 1.6 }}>
                    أوافق على{" "}
                    <a href="/terms" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 700 }}>الشروط والأحكام</a>
                    {" "}و
                    <a href="/privacy" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 700 }}>سياسة الخصوصية</a>
                  </label>
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading} className="submit-btn" style={{ background: loading ? "#94a3b8" : "#2563EB", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Cairo', sans-serif", width: "100%", boxShadow: "0 4px 14px rgba(37,99,235,0.3)", marginTop: 4 }}>
                {loading ? "⏳ جاري المعالجة..." : activeTab === "login" ? "تسجيل الدخول ←" : "إنشاء الحساب ←"}
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20 }}>
              {activeTab === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
              <button onClick={() => { setActiveTab(activeTab === "login" ? "register" : "login"); setPassError(""); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#2563EB", fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>
                {activeTab === "login" ? "أنشئ حساباً" : "سجّل دخولك"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 عقار بروكر — جميع الحقوق محفوظة
      </div>
    </div>
  );
}