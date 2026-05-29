"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPricing() {
  const [activeTab, setActiveTab] = useState("general");
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  const [singleAd, setSingleAd] = useState({ price: "49", duration: "30", enabled: true });

  const [packages, setPackages] = useState([
    { id: 1, name: "الأساسية", price: "199", ads: "10", duration: "30", reels: "10", features: ["10 إعلانات", "30 يوم لكل إعلان", "إحصائيات أساسية"], color: "#6B7280", enabled: true, recommended: false },
    { id: 2, name: "المتوسطة", price: "399", ads: "25", duration: "60", reels: "25", features: ["25 إعلان", "60 يوم لكل إعلان", "إحصائيات متقدمة", "Boost إعلان واحد"], color: "#3B82F6", enabled: true, recommended: false },
    { id: 3, name: "المتقدمة", price: "699", ads: "50", duration: "90", reels: "50", features: ["50 إعلان", "90 يوم لكل إعلان", "إحصائيات كاملة", "3 Boost شهرياً", "دبوس مميز"], color: "#16a34a", enabled: true, recommended: true },
    { id: 4, name: "البريميم", price: "999", ads: "100", duration: "180", reels: "999", features: ["100 إعلان", "180 يوم", "كل المزايا", "Boost غير محدود", "دبوس ذهبي"], color: "#F59E0B", enabled: true, recommended: false },
  ]);
  const [freeReels, setFreeReels] = useState("3");

  const [mapPackage, setMapPackage] = useState({
    price: "149", duration: "30", enabled: true,
    colors: [
      { label: "أخضر مميز", value: "#16a34a", name: "مميز" },
      { label: "ذهبي بريميم", value: "#F59E0B", name: "ذهبي" },
      { label: "أزرق خاص", value: "#3B82F6", name: "أزرق" },
    ]
  });

  const [contractorPlans, setContractorPlans] = useState([
    { id: 1, type: "مقاول", monthly: "299", yearly: "2,990", enabled: true },
    { id: 2, type: "مكتب هندسي", monthly: "399", yearly: "3,990", enabled: true },
  ]);

  const [boost, setBoost] = useState({ price: "29", duration: "7", enabled: true });
  const [trial, setTrial] = useState({ days: "7", maxAds: "1", enabled: true });
  const [yearlyDiscount, setYearlyDiscount] = useState({ percent: "25", enabled: true });
  const [points, setPoints] = useState({ enabled: true, dealPoints: "100", redeemRate: "10" });

  // جلب البيانات من Supabase عند التحميل
  useEffect(() => {
    const fetchPricing = async () => {
      const { data } = await supabase.from('site_settings').select('*');
      if (!data) return;
      const m: Record<string, string> = {};
      data.forEach((r: any) => { m[r.key] = r.value; });
      setPaymentsEnabled(m['payments_enabled'] === 'true');
      setSingleAd({ price: m['single_ad_price'] || '49', duration: m['single_ad_duration'] || '30', enabled: m['single_ad_enabled'] === 'true' });
      setPackages([
        { id: 1, name: m['pkg1_name'] || 'الأساسية', price: m['pkg1_price'] || '199', ads: m['pkg1_ads'] || '10', duration: m['pkg1_duration'] || '30', reels: m['pkg1_reels'] || '10', features: ["10 إعلانات", "30 يوم", "إحصائيات أساسية"], color: "#6B7280", enabled: m['pkg1_enabled'] === 'true', recommended: false },
        { id: 2, name: m['pkg2_name'] || 'المتوسطة', price: m['pkg2_price'] || '399', ads: m['pkg2_ads'] || '25', duration: m['pkg2_duration'] || '60', reels: m['pkg2_reels'] || '25', features: ["25 إعلان", "60 يوم", "إحصائيات متقدمة"], color: "#3B82F6", enabled: m['pkg2_enabled'] === 'true', recommended: false },
        { id: 3, name: m['pkg3_name'] || 'المتقدمة', price: m['pkg3_price'] || '699', ads: m['pkg3_ads'] || '50', duration: m['pkg3_duration'] || '90', reels: m['pkg3_reels'] || '50', features: ["50 إعلان", "90 يوم", "إحصائيات كاملة"], color: "#16a34a", enabled: m['pkg3_enabled'] === 'true', recommended: true },
        { id: 4, name: m['pkg4_name'] || 'البريميم', price: m['pkg4_price'] || '999', ads: m['pkg4_ads'] || '100', duration: m['pkg4_duration'] || '180', reels: m['pkg4_reels'] || '999', features: ["100 إعلان", "180 يوم", "كل المزايا"], color: "#F59E0B", enabled: m['pkg4_enabled'] === 'true', recommended: false },
      ]);
      setFreeReels(m['free_reels'] || '3');
      setMapPackage(prev => ({ ...prev, price: m['map_pkg_price'] || '149', duration: m['map_pkg_duration'] || '30', enabled: m['map_pkg_enabled'] === 'true' }));
      setContractorPlans([
        { id: 1, type: "مقاول", monthly: m['contractor_monthly'] || '299', yearly: m['contractor_yearly'] || '2990', enabled: m['contractor_enabled'] === 'true' },
        { id: 2, type: "مكتب هندسي", monthly: m['engineer_monthly'] || '399', yearly: m['engineer_yearly'] || '3990', enabled: m['engineer_enabled'] === 'true' },
      ]);
      setBoost({ price: m['boost_price'] || '29', duration: m['boost_duration'] || '7', enabled: m['boost_enabled'] === 'true' });
      setTrial({ days: m['trial_days'] || '7', maxAds: m['trial_max_ads'] || '1', enabled: m['trial_enabled'] === 'true' });
      setYearlyDiscount({ percent: m['yearly_discount'] || '25', enabled: m['yearly_discount_enabled'] === 'true' });
      setPoints({ enabled: m['points_enabled'] === 'true', dealPoints: m['points_per_deal'] || '100', redeemRate: m['points_redeem_rate'] || '10' });
    };
    fetchPricing();
  }, []);

  // دالة حفظ التغييرات وإرسالها إلى Supabase
  const handleSave = async () => {
    const updates = [
      { key: 'payments_enabled', value: String(paymentsEnabled) },
      { key: 'single_ad_price', value: singleAd.price },
      { key: 'single_ad_duration', value: singleAd.duration },
      { key: 'single_ad_enabled', value: String(singleAd.enabled) },
      { key: 'pkg1_name', value: packages[0].name },
      { key: 'pkg1_price', value: packages[0].price },
      { key: 'pkg1_ads', value: packages[0].ads },
      { key: 'pkg1_duration', value: packages[0].duration },
      { key: 'pkg1_enabled', value: String(packages[0].enabled) },
      { key: 'pkg2_name', value: packages[1].name },
      { key: 'pkg2_price', value: packages[1].price },
      { key: 'pkg2_ads', value: packages[1].ads },
      { key: 'pkg2_duration', value: packages[1].duration },
      { key: 'pkg2_enabled', value: String(packages[1].enabled) },
      { key: 'pkg3_name', value: packages[2].name },
      { key: 'pkg3_price', value: packages[2].price },
      { key: 'pkg3_ads', value: packages[2].ads },
      { key: 'pkg3_duration', value: packages[2].duration },
      { key: 'pkg3_enabled', value: String(packages[2].enabled) },
      { key: 'pkg4_name', value: packages[3].name },
      { key: 'pkg4_price', value: packages[3].price },
      { key: 'pkg4_ads', value: packages[3].ads },
      { key: 'pkg4_duration', value: packages[3].duration },
      { key: 'pkg4_enabled', value: String(packages[3].enabled) },
      { key: 'pkg1_reels', value: packages[0].reels },
      { key: 'pkg2_reels', value: packages[1].reels },
      { key: 'pkg3_reels', value: packages[2].reels },
      { key: 'pkg4_reels', value: packages[3].reels },
      { key: 'free_reels', value: freeReels },
      { key: 'map_pkg_price', value: mapPackage.price },
      { key: 'map_pkg_duration', value: mapPackage.duration },
      { key: 'map_pkg_enabled', value: String(mapPackage.enabled) },
      { key: 'contractor_monthly', value: contractorPlans[0].monthly },
      { key: 'contractor_yearly', value: contractorPlans[0].yearly },
      { key: 'contractor_enabled', value: String(contractorPlans[0].enabled) },
      { key: 'engineer_monthly', value: contractorPlans[1].monthly },
      { key: 'engineer_yearly', value: contractorPlans[1].yearly },
      { key: 'engineer_enabled', value: String(contractorPlans[1].enabled) },
      { key: 'boost_price', value: boost.price },
      { key: 'boost_duration', value: boost.duration },
      { key: 'boost_enabled', value: String(boost.enabled) },
      { key: 'trial_days', value: trial.days },
      { key: 'trial_max_ads', value: trial.maxAds },
      { key: 'trial_enabled', value: String(trial.enabled) },
      { key: 'yearly_discount', value: yearlyDiscount.percent },
      { key: 'yearly_discount_enabled', value: String(yearlyDiscount.enabled) },
      { key: 'points_enabled', value: String(points.enabled) },
      { key: 'points_per_deal', value: points.dealPoints },
      { key: 'points_redeem_rate', value: points.redeemRate },
    ];
    for (const item of updates) {
      await supabase.from('site_settings').upsert({ key: item.key, value: item.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 6 } as React.CSSProperties;

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer", position: "relative", background: checked ? "#16a34a" : "#D1D5DB", transition: "all 0.2s", flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, transition: "all 0.2s", right: checked ? 3 : "auto", left: checked ? "auto" : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );

  const tabs = [
    { key: "general", icon: "⚡", label: "نظرة عامة" },
    { key: "single", icon: "📋", label: "إعلان مفرد" },
    { key: "packages", icon: "📦", label: "الباقات الأربع" },
    { key: "map", icon: "🗺️", label: "تمييز الخريطة" },
    { key: "contractors", icon: "🔧", label: "المقاولون والمهندسون" },
    { key: "boost", icon: "🚀", label: "Boost الإعلان" },
    { key: "trial", icon: "🎁", label: "باقة تجريبية" },
    { key: "points", icon: "⭐", label: "نظام النقاط" },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <style>{`input:focus, select:focus { border-color: #16a34a !important; outline: none; } .tab-item { transition: all 0.2s; cursor: pointer; } .tab-item:hover { background: #f0fdf4 !important; }`}</style>

      {/* Payment Master Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: paymentsEnabled ? "#F0FDF4" : "#FFF5F5", border: `1.5px solid ${paymentsEnabled ? "#BBF7D0" : "#FECACA"}`, borderRadius: 14, padding: "10px 20px" }}>
          <span style={{ fontSize: 22 }}>{paymentsEnabled ? "✅" : "⏸️"}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: paymentsEnabled ? "#16a34a" : "#EF4444" }}>
              {paymentsEnabled ? "المدفوعات مفعّلة" : "المدفوعات موقوفة — الوضع التسويقي"}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              {paymentsEnabled ? "المستخدمون يدفعون مقابل الخدمات" : "كل الخدمات مجانية مؤقتاً لجذب المستخدمين"}
            </div>
          </div>
          <ToggleSwitch checked={paymentsEnabled} onChange={() => setPaymentsEnabled(!paymentsEnabled)} />
        </div>
        <button onClick={handleSave} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
          {saved ? "✅ تم الحفظ!" : "💾 حفظ"}
        </button>
      </div>

      {!paymentsEnabled && (
        <div style={{ background: "#FFFBEB", borderRadius: 14, padding: "14px 20px", marginBottom: 20, border: "1.5px solid #FDE68A", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>المدفوعات موقوفة — كل الخدمات مجانية حالياً. فعّل عند الإطلاق الرسمي.</p>
        </div>
      )}

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

            {/* General Overview */}
            {activeTab === "general" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>⚡ نظرة عامة على الإيرادات</h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>ملخص كامل لجميع مصادر الدخل</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[
                    { icon: "📋", label: "إعلان مفرد", value: `${singleAd.price} ر.س`, status: singleAd.enabled, color: "#3B82F6" },
                    { icon: "📦", label: "الباقات الأربع", value: "199 — 999 ر.س", status: true, color: "#16a34a" },
                    { icon: "🗺️", label: "تمييز الخريطة", value: `${mapPackage.price} ر.س/شهر`, status: mapPackage.enabled, color: "#F59E0B" },
                    { icon: "🔧", label: "اشتراك مقاولين", value: `${contractorPlans[0].monthly} ر.س/شهر`, status: contractorPlans[0].enabled, color: "#8B5CF6" },
                    { icon: "🚀", label: "Boost الإعلان", value: `${boost.price} ر.س/${boost.duration} أيام`, status: boost.enabled, color: "#EF4444" },
                    { icon: "🎁", label: "باقة تجريبية", value: `${trial.days} أيام مجاناً`, status: trial.enabled, color: "#10B981" },
                    { icon: "📅", label: "خصم السنوي", value: `${yearlyDiscount.percent}%`, status: yearlyDiscount.enabled, color: "#F59E0B" },
                    { icon: "⭐", label: "نظام النقاط", value: `${points.dealPoints} نقطة/صفقة`, status: points.enabled, color: "#6366F1" },
                    { icon: "🎟️", label: "أكواد الخصم", value: "متاح", status: true, color: "#EC4899" },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#F8F9FB", borderRadius: 14, padding: "16px", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.value}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: item.status ? "#DCFCE7" : "#F3F4F6", color: item.status ? "#16a34a" : "#9CA3AF" }}>
                        {item.status ? "مفعّل" : "موقوف"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single Ad */}
            {activeTab === "single" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>📋 الإعلان المفرد</h2>
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>لأصحاب العقار الواحد — يدفع مرة وينتهي</p>
                  </div>
                  <ToggleSwitch checked={singleAd.enabled} onChange={() => setSingleAd({ ...singleAd, enabled: !singleAd.enabled })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label style={labelStyle}>سعر الإعلان الواحد (ر.س)</label><input value={singleAd.price} onChange={(e) => setSingleAd({ ...singleAd, price: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>مدة الإعلان (أيام)</label><input value={singleAd.duration} onChange={(e) => setSingleAd({ ...singleAd, duration: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={{ marginTop: 20, background: "#F0FDF4", borderRadius: 14, padding: "16px", border: "1.5px solid #BBF7D0" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 10 }}>💡 معاينة ما سيراه المستخدم:</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #E5E7EB" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>إعلان مفرد</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>📅 {singleAd.duration} يوم · دفعة واحدة</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>{singleAd.price} <span style={{ fontSize: 13 }}>ر.س</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Packages */}
            {activeTab === "packages" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>📦 الباقات الأربع</h2>
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>للمكاتب والوسطاء العقاريين</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFFBEB", borderRadius: 10, padding: "8px 14px", border: "1px solid #FDE68A" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>خصم سنوي</span>
                    <input value={yearlyDiscount.percent} onChange={(e) => setYearlyDiscount({ ...yearlyDiscount, percent: e.target.value })} style={{ width: 50, border: "1px solid #FDE68A", borderRadius: 6, padding: "4px 6px", fontSize: 12, fontFamily: "'Cairo'", textAlign: "center" }} />
                    <span style={{ fontSize: 12, color: "#92400E" }}>%</span>
                    <ToggleSwitch checked={yearlyDiscount.enabled} onChange={() => setYearlyDiscount({ ...yearlyDiscount, enabled: !yearlyDiscount.enabled })} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {packages.map((pkg) => (
                    <div key={pkg.id} style={{ border: `2px solid ${pkg.color}`, borderRadius: 18, padding: "20px", background: "#fff", position: "relative" }}>
                      {pkg.recommended && <div style={{ position: "absolute", top: -10, right: 20, background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>الأكثر طلباً</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <input value={pkg.name} onChange={(e) => setPackages(packages.map(p => p.id === pkg.id ? { ...p, name: e.target.value } : p))} style={{ fontSize: 16, fontWeight: 800, color: pkg.color, border: "none", background: "transparent", fontFamily: "'Cairo'", padding: 0 }} />
                        <ToggleSwitch checked={pkg.enabled} onChange={() => setPackages(packages.map(p => p.id === pkg.id ? { ...p, enabled: !p.enabled } : p))} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div><label style={labelStyle}>السعر/شهر (ر.س)</label><input value={pkg.price} onChange={(e) => setPackages(packages.map(p => p.id === pkg.id ? { ...p, price: e.target.value } : p))} style={{ ...inputStyle, fontWeight: 800, color: pkg.color, textAlign: "center" }} /></div>
                        <div><label style={labelStyle}>عدد الإعلانات</label><input value={pkg.ads} onChange={(e) => setPackages(packages.map(p => p.id === pkg.id ? { ...p, ads: e.target.value } : p))} style={{ ...inputStyle, textAlign: "center" }} /></div>
                        <div><label style={labelStyle}>مدة الإعلان (يوم)</label><input value={pkg.duration} onChange={(e) => setPackages(packages.map(p => p.id === pkg.id ? { ...p, duration: e.target.value } : p))} style={{ ...inputStyle, textAlign: "center" }} /></div>
                        <div><label style={labelStyle}>🎬 عدد Reels</label><input value={pkg.reels} onChange={(e) => setPackages(packages.map(p => p.id === pkg.id ? { ...p, reels: e.target.value } : p))} style={{ ...inputStyle, textAlign: "center" }} /></div>
                      </div>
                      <div style={{ padding: "10px", background: "#F8F9FB", borderRadius: 10, fontSize: 12, color: "#6B7280" }}>
                        السنوي: <span style={{ color: pkg.color, fontWeight: 800 }}>
                          {yearlyDiscount.enabled ? Math.round(Number(pkg.price) * 12 * (1 - Number(yearlyDiscount.percent) / 100)).toLocaleString() : (Number(pkg.price) * 12).toLocaleString()} ر.س
                        </span>
                        {yearlyDiscount.enabled && <span style={{ color: "#16a34a", marginRight: 6 }}>({yearlyDiscount.percent}% خصم)</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reels المجانية */}
                <div style={{ marginTop: 24, background: "#F5F3FF", borderRadius: 14, padding: "16px 20px", border: "1.5px solid #DDD6FE" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#7C3AED" }}>🎬 Reels للمستخدم المجاني (بدون باقة)</span>
                      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>عدد الريلز المسموح للمستخدم الغير مشترك</p>
                    </div>
                    <input value={freeReels} onChange={(e) => setFreeReels(e.target.value)}
                      style={{ width: 80, border: "1.5px solid #DDD6FE", borderRadius: 10, padding: "8px 12px", fontSize: 14, fontFamily: "'Cairo', sans-serif", textAlign: "center", fontWeight: 800, color: "#7C3AED" }} />
                  </div>
                </div>

              </div>
            )}

            {/* Map Package */}
            {activeTab === "map" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>🗺️ باقة تمييز الخريطة</h2>
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>إعلانات بدبابيس مميزة ملونة على الخريطة</p>
                  </div>
                  <ToggleSwitch checked={mapPackage.enabled} onChange={() => setMapPackage({ ...mapPackage, enabled: !mapPackage.enabled })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div><label style={labelStyle}>السعر الشهري (ر.س)</label><input value={mapPackage.price} onChange={(e) => setMapPackage({ ...mapPackage, price: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>المدة (أيام)</label><input value={mapPackage.duration} onChange={(e) => setMapPackage({ ...mapPackage, duration: e.target.value })} style={inputStyle} /></div>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>ألوان الدبابيس</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {mapPackage.colors.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#F8F9FB", borderRadius: 12 }}>
                      <div style={{ width: 32, height: 32, background: c.value, borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", flex: 1 }}>{c.label}</span>
                      <input type="color" value={c.value} onChange={(e) => setMapPackage({ ...mapPackage, colors: mapPackage.colors.map((col, j) => j === i ? { ...col, value: e.target.value } : col) })} style={{ width: 40, height: 40, border: "2px solid #E5E7EB", borderRadius: 8, cursor: "pointer", padding: 2 }} />
                    </div>
                  ))}
                </div>
                <div style={{ background: "#F8F9FB", borderRadius: 14, padding: "16px", border: "1px solid #E5E7EB" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>معاينة الدبابيس:</p>
                  <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
                    <div style={{ textAlign: "center" }}><div style={{ fontSize: 24 }}>📍</div><div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>عادي</div></div>
                    {mapPackage.colors.map((c, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ width: 26, height: 26, background: c.value, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", margin: "0 auto" }} />
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>{c.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contractors */}
            {activeTab === "contractors" && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🔧 اشتراكات المقاولين والمهندسين</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {contractorPlans.map((plan) => (
                    <div key={plan.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 18, padding: "20px", background: "#F8F9FB" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{plan.type}</h3>
                        <ToggleSwitch checked={plan.enabled} onChange={() => setContractorPlans(contractorPlans.map(p => p.id === plan.id ? { ...p, enabled: !p.enabled } : p))} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div><label style={labelStyle}>السعر الشهري (ر.س)</label><input value={plan.monthly} onChange={(e) => setContractorPlans(contractorPlans.map(p => p.id === plan.id ? { ...p, monthly: e.target.value } : p))} style={inputStyle} /></div>
                        <div><label style={labelStyle}>السعر السنوي (ر.س)</label><input value={plan.yearly} onChange={(e) => setContractorPlans(contractorPlans.map(p => p.id === plan.id ? { ...p, yearly: e.target.value } : p))} style={inputStyle} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boost */}
            {activeTab === "boost" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>🚀 Boost الإعلان</h2>
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>رفع الإعلان لأعلى نتائج البحث</p>
                  </div>
                  <ToggleSwitch checked={boost.enabled} onChange={() => setBoost({ ...boost, enabled: !boost.enabled })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label style={labelStyle}>السعر (ر.س)</label><input value={boost.price} onChange={(e) => setBoost({ ...boost, price: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>مدة الـ Boost (أيام)</label><input value={boost.duration} onChange={(e) => setBoost({ ...boost, duration: e.target.value })} style={inputStyle} /></div>
                </div>
              </div>
            )}

            {/* Trial */}
            {activeTab === "trial" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>🎁 الباقة التجريبية</h2>
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>أول إعلان مجاني لكل مستخدم جديد</p>
                  </div>
                  <ToggleSwitch checked={trial.enabled} onChange={() => setTrial({ ...trial, enabled: !trial.enabled })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label style={labelStyle}>مدة التجربة (أيام)</label><input value={trial.days} onChange={(e) => setTrial({ ...trial, days: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>الحد الأقصى للإعلانات</label><input value={trial.maxAds} onChange={(e) => setTrial({ ...trial, maxAds: e.target.value })} style={inputStyle} /></div>
                </div>
              </div>
            )}

            {/* Points */}
            {activeTab === "points" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>⭐ نظام النقاط والمكافآت</h2>
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>كل صفقة = نقاط تُستبدل بإعلانات مجانية</p>
                  </div>
                  <ToggleSwitch checked={points.enabled} onChange={() => setPoints({ ...points, enabled: !points.enabled })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><label style={labelStyle}>نقاط لكل صفقة</label><input value={points.dealPoints} onChange={(e) => setPoints({ ...points, dealPoints: e.target.value })} style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>نقاط لاسترداد إعلان مجاني</label>
                    <input value={points.redeemRate} onChange={(e) => setPoints({ ...points, redeemRate: e.target.value })} style={inputStyle} />
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>كل {points.redeemRate} نقطة = إعلان مجاني</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}