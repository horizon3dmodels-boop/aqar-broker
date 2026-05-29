"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // تم إضافة الاستيراد

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "عقار بروكر", siteNameEn: "Aqar Broker",
    description: "منصة عقارية ذكية تجمع العقارات والمقاولين والمكاتب الهندسية",
    email: "info@aqarbroker.com", phone: "920012345", whatsapp: "966501234567",
    primaryColor: "#16a34a", secondaryColor: "#052e16", accentColor: "#FCD34D", font: "Cairo",
    autoApproveVerified: true, autoApproveOwner: false, requireLicense: true, requirePhone: true,
    maxImages: "20", maxListingDays: "90",
    aiEnabled: true, aiModel: "Claude Sonnet", aiAutoReply: true, aiPriceEstimate: true,
    mapProvider: "Mapbox", defaultCity: "الرياض",
    paymentGateway: "Moyasar", enableMada: true, enableApplePay: true, enableSADAD: true,
    
    // الإضافات الجديدة: النفاذ الوطني
    nafathEnabled: false,
    // الباقات
    packagesEnabled: false,
    // REGA
    regaEnabled: false,
    // التفعيل التلقائي لكل فئة
    autoActivateVisitor: true,
    autoActivateOwner: true,
    autoActivateBroker: true,
    autoActivateContractor: true,
    autoActivateEngineer: true,
    // شروط النشر
    brokerRequiresFal: true,
    ownerRequiresSakk: true,
    contractorRequiresPackage: true,
    engineerRequiresPackage: true,
  });

  // جلب الإعدادات من Supabase عند التحميل الأول
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('*');
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach((row: any) => { map[row.key] = row.value; });
      setSettings(prev => ({
        ...prev,
        nafathEnabled: map['nafath_enabled'] === 'true',
        packagesEnabled: map['packages_enabled'] === 'true',
        regaEnabled: map['rega_enabled'] === 'true',
        autoActivateVisitor: map['auto_activate_visitor'] === 'true',
        autoActivateOwner: map['auto_activate_owner'] === 'true',
        autoActivateBroker: map['auto_activate_broker'] === 'true',
        autoActivateContractor: map['auto_activate_contractor'] === 'true',
        autoActivateEngineer: map['auto_activate_engineer'] === 'true',
        brokerRequiresFal: map['broker_requires_fal'] === 'true',
        ownerRequiresSakk: map['owner_requires_sakk'] === 'true',
        contractorRequiresPackage: map['contractor_requires_package'] === 'true',
        engineerRequiresPackage: map['engineer_requires_package'] === 'true',
      }));
    };
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string | boolean) => { setSettings({ ...settings, [key]: value }); setSaved(false); };
  
  // دالة الحفظ المحدثة لرفع التعديلات إلى Supabase
  const handleSave = async () => {
    const settingsMap: Record<string, string> = {
      'nafath_enabled': String(settings.nafathEnabled),
      'packages_enabled': String(settings.packagesEnabled),
      'rega_enabled': String(settings.regaEnabled),
      'auto_activate_visitor': String(settings.autoActivateVisitor),
      'auto_activate_owner': String(settings.autoActivateOwner),
      'auto_activate_broker': String(settings.autoActivateBroker),
      'auto_activate_contractor': String(settings.autoActivateContractor),
      'auto_activate_engineer': String(settings.autoActivateEngineer),
      'broker_requires_fal': String(settings.brokerRequiresFal),
      'owner_requires_sakk': String(settings.ownerRequiresSakk),
      'contractor_requires_package': String(settings.contractorRequiresPackage),
      'engineer_requires_package': String(settings.engineerRequiresPackage),
    };
    for (const [key, value] of Object.entries(settingsMap)) {
      await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" };
  const labelStyle = { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 } as React.CSSProperties;

  const tabs = [
    { key: "general", icon: "🏢", label: "عام" },
    { key: "activation", icon: "🔐", label: "التفعيل والتوثيق" },
    { key: "appearance", icon: "🎨", label: "المظهر" },
    { key: "listings", icon: "🏠", label: "الإعلانات" },
    { key: "ai", icon: "🤖", label: "الذكاء الاصطناعي" },
    { key: "maps", icon: "🗺️", label: "الخرائط" },
    { key: "payments", icon: "💳", label: "المدفوعات" },
    { key: "categories", icon: "🗂️", label: "الفئات" },
    { key: "fields", icon: "📝", label: "الحقول المخصصة" },
    { key: "nav", icon: "🔗", label: "القوائم والمسميات" },
  ];

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative", background: checked ? "#16a34a" : "#D1D5DB", transition: "all 0.2s" }}>
      <div style={{ width: 22, height: 22, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, transition: "all 0.2s", right: checked ? 3 : "auto", left: checked ? "auto" : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );

  return (
    <div style={{ padding: "24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap'); input:focus, select:focus, textarea:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; outline: none; } .tab-item { transition: all 0.2s; cursor: pointer; } .tab-item:hover { background: #f0fdf4 !important; }`}</style>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button onClick={handleSave} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
          {saved ? "✅ تم الحفظ!" : "💾 حفظ التغييرات"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        {/* Tabs */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", position: "sticky", top: 80 }}>
            {tabs.map((tab) => (
              <div key={tab.key} onClick={() => setActiveTab(tab.key)} className="tab-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, marginBottom: 4, background: activeTab === tab.key ? "#F0FDF4" : "transparent", color: activeTab === tab.key ? "#16a34a" : "#374151", fontWeight: activeTab === tab.key ? 700 : 500, fontSize: 13 }}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0" }}>

            {activeTab === "general" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🏢 الإعدادات العامة</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div><label style={labelStyle}>اسم الموقع (عربي)</label><input value={settings.siteName} onChange={(e) => handleChange("siteName", e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>اسم الموقع (إنجليزي)</label><input value={settings.siteNameEn} onChange={(e) => handleChange("siteNameEn", e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div><label style={labelStyle}>وصف الموقع</label><textarea value={settings.description} onChange={(e) => handleChange("description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div><label style={labelStyle}>البريد</label><input value={settings.email} onChange={(e) => handleChange("email", e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>الهاتف</label><input value={settings.phone} onChange={(e) => handleChange("phone", e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>واتساب</label><input value={settings.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* التبويب الجديد: التفعيل والتوثيق */}
            {activeTab === "activation" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>🔐 التفعيل والتوثيق</h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>تحكم في آليات التسجيل والتوثيق لكل فئة</p>
                
                {/* الخدمات الخارجية */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>🌐 الخدمات الخارجية</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "النفاذ الوطني", desc: "تسجيل الدخول عبر النفاذ الوطني السعودي", key: "nafathEnabled", badge: "قريباً", badgeColor: "#F59E0B" },
                      { label: "الباقات الإعلانية", desc: "تفعيل نظام الباقات والاشتراكات المدفوعة", key: "packagesEnabled", badge: "جاهز", badgeColor: "#16a34a" },
                      { label: "ربط REGA", desc: "ربط الهيئة العامة للعقار للتحقق من رخص الإعلان", key: "regaEnabled", badge: "قريباً", badgeColor: "#F59E0B" },
                    ].map((item) => (
                      <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "#F8F9FB", borderRadius: 14, border: "1.5px solid #E5E7EB" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.label}</span>
                            <span style={{ background: item.badgeColor + "22", color: item.badgeColor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{item.badge}</span>
                          </div>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>{item.desc}</span>
                        </div>
                        <ToggleSwitch checked={(settings as any)[item.key]} onChange={() => handleChange(item.key, !(settings as any)[item.key])} />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* التفعيل التلقائي */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>⚡ التفعيل التلقائي عند التسجيل</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "🔍 باحث عن عقار", desc: "تفعيل فوري بدون أي شروط", key: "autoActivateVisitor" },
                      { label: "🏠 مالك عقار", desc: "تفعيل فوري — يشترط صك الملكية عند النشر", key: "autoActivateOwner" },
                      { label: "🤝 مسوق عقاري", desc: "تفعيل فوري — يشترط رخصة فال عند النشر", key: "autoActivateBroker" },
                      { label: "🔧 مقاول", desc: "تفعيل فوري — يشترط باقة إعلانية عند النشر", key: "autoActivateContractor" },
                      { label: "📐 مكتب هندسي", desc: "تفعيل فوري — يشترط باقة إعلانية عند النشر", key: "autoActivateEngineer" },
                    ].map((item) => (
                      <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#F8F9FB", borderRadius: 14, border: "1.5px solid #E5E7EB" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>{item.desc}</div>
                        </div>
                        <ToggleSwitch checked={(settings as any)[item.key]} onChange={() => handleChange(item.key, !(settings as any)[item.key])} />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* شروط النشر */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>📋 شروط نشر الإعلان</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "المسوق يحتاج رخصة فال", desc: "لا يستطيع نشر إعلان بدون رخصة فال صالحة", key: "brokerRequiresFal" },
                      { label: "المالك يحتاج صك ملكية", desc: "لا يستطيع نشر إعلان بدون رفع صك الملكية", key: "ownerRequiresSakk" },
                      { label: "المقاول يحتاج باقة إعلانية", desc: "لا يستطيع نشر إعلان بدون الاشتراك بباقة", key: "contractorRequiresPackage" },
                      { label: "المكتب الهندسي يحتاج باقة إعلانية", desc: "لا يستطيع نشر إعلان بدون الاشتراك بباقة", key: "engineerRequiresPackage" },
                    ].map((item) => (
                      <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#F8F9FB", borderRadius: 14, border: "1.5px solid #E5E7EB" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>{item.desc}</div>
                        </div>
                        <ToggleSwitch checked={(settings as any)[item.key]} onChange={() => handleChange(item.key, !(settings as any)[item.key])} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🎨 المظهر والألوان</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                  {[{ label: "اللون الرئيسي", key: "primaryColor" }, { label: "اللون الثانوي", key: "secondaryColor" }, { label: "لون التمييز", key: "accentColor" }].map((c) => (
                    <div key={c.key}><label style={labelStyle}>{c.label}</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="color" value={(settings as Record<string, string>)[c.key]} onChange={(e) => handleChange(c.key, e.target.value)} style={{ width: 44, height: 44, border: "2px solid #E5E7EB", borderRadius: 10, cursor: "pointer", padding: 2 }} />
                        <input value={(settings as Record<string, string>)[c.key]} onChange={(e) => handleChange(c.key, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div><label style={labelStyle}>الخط</label>
                  <select value={settings.font} onChange={(e) => handleChange("font", e.target.value)} style={inputStyle}>
                    {["Cairo", "Tajawal", "Almarai", "IBM Plex Sans Arabic"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ background: "#F8F9FB", borderRadius: 14, padding: "20px", border: "1.5px solid #E5E7EB", marginTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>معاينة الألوان</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 60, height: 60, background: settings.primaryColor, borderRadius: 12 }} />
                    <div style={{ width: 60, height: 60, background: settings.secondaryColor, borderRadius: 12 }} />
                    <div style={{ width: 60, height: 60, background: settings.accentColor, borderRadius: 12 }} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "listings" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🏠 إعدادات الإعلانات</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "الموافقة التلقائية للوسطاء الموثقين", key: "autoApproveVerified" },
                    { label: "الموافقة التلقائية لأصحاب العقارات", key: "autoApproveOwner" },
                    { label: "رخصة الإعلان إلزامية", key: "requireLicense" },
                    { label: "رقم الجوال إلزامي", key: "requirePhone" },
                  ].map((item) => (
                    <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F8F9FB", borderRadius: 14 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                      <ToggleSwitch checked={(settings as Record<string, boolean>)[item.key]} onChange={() => handleChange(item.key, !(settings as Record<string, boolean>)[item.key])} />
                    </div>
                  ))}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
                    <div><label style={labelStyle}>الحد الأقصى للصور</label><input value={settings.maxImages} onChange={(e) => handleChange("maxImages", e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>مدة الإعلان (أيام)</label><input value={settings.maxListingDays} onChange={(e) => handleChange("maxListingDays", e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🤖 إعدادات الذكاء الاصطناعي</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "تفعيل AI في الموقع", key: "aiEnabled" },
                    { label: "الرد التلقائي على الاستفسارات", key: "aiAutoReply" },
                    { label: "تقدير الأسعار الذكي", key: "aiPriceEstimate" },
                  ].map((item) => (
                    <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F8F9FB", borderRadius: 14 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                      <ToggleSwitch checked={(settings as Record<string, boolean>)[item.key]} onChange={() => handleChange(item.key, !(settings as Record<string, boolean>)[item.key])} />
                    </div>
                  ))}
                  <div><label style={labelStyle}>نموذج AI</label>
                    <select value={settings.aiModel} onChange={(e) => handleChange("aiModel", e.target.value)} style={inputStyle}>
                      {["Claude Sonnet", "Claude Opus", "Claude Haiku"].map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "maps" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🗺️ الخرائط</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div><label style={labelStyle}>مزوّد الخرائط</label><select value={settings.mapProvider} onChange={(e) => handleChange("mapProvider", e.target.value)} style={inputStyle}><option>Mapbox</option><option>Google Maps</option></select></div>
                  <div><label style={labelStyle}>المدينة الافتراضية</label><select value={settings.defaultCity} onChange={(e) => handleChange("defaultCity", e.target.value)} style={inputStyle}>{["الرياض", "جدة", "مكة", "المدينة", "الدمام"].map((c) => <option key={c}>{c}</option>)}</select></div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>💳 المدفوعات</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><label style={labelStyle}>بوابة الدفع</label><select value={settings.paymentGateway} onChange={(e) => handleChange("paymentGateway", e.target.value)} style={inputStyle}><option>Moyasar</option><option>Stripe</option><option>PayTabs</option></select></div>
                  {[{ label: "تفعيل مدى", key: "enableMada" }, { label: "تفعيل Apple Pay", key: "enableApplePay" }, { label: "تفعيل سداد", key: "enableSADAD" }].map((item) => (
                    <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F8F9FB", borderRadius: 14 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                      <ToggleSwitch checked={(settings as Record<string, boolean>)[item.key]} onChange={() => handleChange(item.key, !(settings as Record<string, boolean>)[item.key])} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "categories" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>🗂️ الفئات والتصنيفات</h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>أضف فئات جديدة بدون كود — مثل: إيجار يومي، استراحات</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["شقة", "فيلا", "دوبلكس", "أرض", "مكتب", "محل تجاري", "استراحة", "مستودع", "عمارة"].map((cat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F8F9FB", borderRadius: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 14, cursor: "grab" }}>☰</span><span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{cat}</span></div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>تعديل</button>
                        <button style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>حذف</button>
                      </div>
                    </div>
                  ))}
                  <button style={{ border: "2px dashed #BBF7D0", background: "#F0FDF4", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, color: "#16a34a", cursor: "pointer", fontFamily: "'Cairo'" }}>+ إضافة فئة جديدة</button>
                </div>
              </div>
            )}

            {activeTab === "fields" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>📝 الحقول المخصصة</h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>أضف حقول جديدة لأي فئة بدون كود</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { name: "عدد الغرف", type: "رقم", required: true, cat: "الكل" },
                    { name: "المساحة", type: "رقم", required: true, cat: "الكل" },
                    { name: "عدد الضيوف", type: "رقم", required: false, cat: "إيجار يومي" },
                    { name: "تاريخ الحجز", type: "تاريخ", required: false, cat: "إيجار يومي" },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F8F9FB", borderRadius: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>{f.name}</span>
                        <span style={{ background: "#EFF6FF", color: "#3B82F6", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>{f.type}</span>
                        <span style={{ background: "#F5F3FF", color: "#8B5CF6", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>{f.cat}</span>
                        {f.required && <span style={{ background: "#FEF9C3", color: "#92400E", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>إلزامي</span>}
                      </div>
                      <button style={{ background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>تعديل</button>
                    </div>
                  ))}
                  <button style={{ border: "2px dashed #BBF7D0", background: "#F0FDF4", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, color: "#16a34a", cursor: "pointer", fontFamily: "'Cairo'" }}>+ إضافة حقل جديد</button>
                </div>
              </div>
            )}

            {activeTab === "nav" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>🔗 القوائم والمسميات</h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>غيّر أي مسمى في الموقع بدون كود</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "الرئيسية", value: "الرئيسية" },
                    { label: "بيع", value: "بيع" },
                    { label: "إيجار", value: "إيجار" },
                    { label: "مشاريع", value: "مشاريع" },
                    { label: "المقاولون", value: "المقاولون" },
                    { label: "الهندسة", value: "الهندسة" },
                    { label: "الخريطة", value: "الخريطة" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#F8F9FB", borderRadius: 12 }}>
                      <span style={{ fontSize: 13, color: "#9CA3AF", width: 80, flexShrink: 0 }}>المسمى الحالي:</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", width: 100 }}>{item.label}</span>
                      <input defaultValue={item.value} style={{ ...inputStyle, flex: 1 }} placeholder="اكتب المسمى الجديد..." />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}