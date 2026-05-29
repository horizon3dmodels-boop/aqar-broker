"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ActivityLog {
  id: string;
  action: string;
  status: string;
  details?: string;
  created_at: string;
}

export default function AdminAIPage() {
  const [settings, setSettings] = useState({
    enabled: true,
    model: "claude-sonnet-4-5",
    maxTokens: 1000,
    temperature: 0.7,
    searchEnabled: true,
    autoReply: false,
    language: "ar",
    systemPrompt: `أنت Broker AI — مساعد عقاري ذكي متخصص في السوق السعودي لمنصة عقار بروكر.
تحدث دائماً بالعربية بأسلوب ودي واحترافي.
مهامك الرئيسية:
- مساعدة المستخدمين في البحث عن عقارات مناسبة
- تحليل الأسعار ومقارنتها بالسوق
- حساب الأقساط الشهرية للتمويل العقاري
- مقارنة الأحياء والمناطق
- الإجابة على أسئلة العقود والتراخيص (REGA، فال)
- تقدير العائد الاستثماري`,
    supportPrompt: `أنت مساعد دعم فني لمنصة عقار بروكر السعودية.
مهمتك الوحيدة: مساعدة المستخدمين في حل المشاكل التقنية فقط.
تساعد في: مشاكل تسجيل الدخول، مشاكل إضافة الإعلانات، مشاكل الدفع والاشتراكات.
لا تجيب على أسئلة البحث عن عقارات — وجّه المستخدم لاستخدام Broker AI.
رد دائماً بالعربية بشكل مختصر وودي.
إذا لم تستطع حل المشكلة بعد محاولتين، أضف: [SHOW_TICKET]`,
    guestLimit: 5,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [realStats, setRealStats] = useState({ totalChats: 0, totalTokens: 0, todayChats: 0 });
  const [activeTab, setActiveTab] = useState<"broker" | "support">("broker");

  useEffect(() => {
    loadAISettings();
    fetchStats();
    fetchActivityLogs();

    // تحديث السجل كل 30 ثانية
    const interval = setInterval(fetchActivityLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { count: todayChats } = await supabase
      .from('ai_activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    const { count: totalChats } = await supabase
      .from('ai_activity_log')
      .select('*', { count: 'exact', head: true });

    setRealStats({
      totalChats: totalChats || 0,
      todayChats: todayChats || 0,
      totalTokens: (totalChats || 0) * 500,
    });
  };

  const fetchActivityLogs = async () => {
    const { data } = await supabase
      .from('ai_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setActivityLogs(data);
  };

  const loadAISettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('site_settings').select('*');
    if (!data) { setLoading(false); return; }
    const m: Record<string, string> = {};
    data.forEach((r: any) => { m[r.key] = r.value; });
    setSettings(prev => ({
      ...prev,
      enabled: m['ai_enabled'] !== 'false',
      model: m['ai_model'] || 'claude-sonnet-4-5',
      maxTokens: Number(m['ai_max_tokens']) || 1000,
      temperature: Number(m['ai_temperature']) || 0.7,
      searchEnabled: m['ai_search_enabled'] !== 'false',
      autoReply: m['ai_auto_reply'] === 'true',
      language: m['ai_language'] || 'ar',
      systemPrompt: m['ai_system_prompt'] || prev.systemPrompt,
      supportPrompt: m['ai_support_prompt'] || prev.supportPrompt,
      guestLimit: Number(m['ai_guest_limit']) || 5,
    }));
    setLoading(false);
  };

  const handleSave = async () => {
    const updates = [
      { key: 'ai_enabled', value: String(settings.enabled) },
      { key: 'ai_model', value: settings.model },
      { key: 'ai_max_tokens', value: String(settings.maxTokens) },
      { key: 'ai_temperature', value: String(settings.temperature) },
      { key: 'ai_search_enabled', value: String(settings.searchEnabled) },
      { key: 'ai_auto_reply', value: String(settings.autoReply) },
      { key: 'ai_system_prompt', value: settings.systemPrompt },
      { key: 'ai_support_prompt', value: settings.supportPrompt },
      { key: 'ai_language', value: settings.language },
      { key: 'ai_guest_limit', value: String(settings.guestLimit) },
    ];
    for (const item of updates) {
      await supabase.from('site_settings').upsert(
        { key: item.key, value: item.value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ width: 48, height: 26, borderRadius: 13, background: value ? "#16a34a" : "#E5E7EB", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, right: value ? 3 : "calc(100% - 23px)", transition: "right 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );

  const stats = [
    { label: "نشاط اليوم", value: realStats.todayChats.toLocaleString(), icon: "💬", color: "#2563EB", bg: "#EFF6FF" },
    { label: "إجمالي النشاط", value: realStats.totalChats.toLocaleString(), icon: "⚡", color: "#16a34a", bg: "#F0FDF4" },
    { label: "حد رسائل الزوار", value: String(settings.guestLimit), icon: "🔒", color: "#D97706", bg: "#FFFBEB" },
    { label: "التوكنز المستخدمة", value: `${Math.round(realStats.totalTokens / 1000)}K`, icon: "🧠", color: "#7C3AED", bg: "#F5F3FF" },
  ];

  if (loading) return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 16, color: "#6B7280" }}>جاري التحميل...</div>
    </div>
  );

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #2563EB !important; }
        input[type=range] { accent-color: #2563EB; }
        .tab-btn:hover { background: #F0F9FF !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 4 }}>إعدادات الذكاء الاصطناعي 🤖</h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>إدارة مساعدَي Broker AI ومساعد الدعم الفني</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: settings.enabled ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: "8px 14px", border: `1px solid ${settings.enabled ? "#BBF7D0" : "#FECACA"}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: settings.enabled ? "#16a34a" : "#DC2626" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: settings.enabled ? "#16a34a" : "#DC2626" }}>
              {settings.enabled ? "المساعد نشط" : "المساعد متوقف"}
            </span>
          </div>
          <a href="/admin/ai-chat" target="_blank"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#7C3AED", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", textDecoration: "none" }}>
            🤖 دردشة الأدمن
          </a>
          <button onClick={handleSave} style={{ background: saved ? "#16a34a" : "#0f172a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", transition: "background 0.2s" }}>
            {saved ? "✓ تم الحفظ" : "حفظ الإعدادات"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* الإعدادات العامة */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #F0F0F0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>⚙️ الإعدادات العامة</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>تفعيل المساعد الذكي</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>يظهر زر المساعد للزوار</div>
              </div>
              <Toggle value={settings.enabled} onChange={() => setSettings(s => ({ ...s, enabled: !s.enabled }))} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>تفعيل البحث على الإنترنت</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>يبحث عن أسعار السوق الحديثة</div>
              </div>
              <Toggle value={settings.searchEnabled} onChange={() => setSettings(s => ({ ...s, searchEnabled: !s.searchEnabled }))} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>الرد التلقائي على الرسائل</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>يرد على رسائل المستخدمين تلقائياً</div>
              </div>
              <Toggle value={settings.autoReply} onChange={() => setSettings(s => ({ ...s, autoReply: !s.autoReply }))} />
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>النموذج المستخدم</div>
              <select value={settings.model} onChange={(e) => setSettings(s => ({ ...s, model: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", background: "#F8F9FB", color: "#374151" }}>
                <option value="claude-sonnet-4-5">Claude Sonnet 4.5 (موصى به)</option>
                <option value="claude-opus-4-5">Claude Opus 4.5 (الأقوى)</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (الأسرع)</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>لغة الردود</div>
              <select value={settings.language} onChange={(e) => setSettings(s => ({ ...s, language: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", background: "#F8F9FB", color: "#374151" }}>
                <option value="ar">العربية (اللهجة السعودية)</option>
                <option value="ar-msa">العربية الفصحى</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>حد رسائل الزوار</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{settings.guestLimit} رسائل</span>
              </div>
              <input type="range" min={1} max={20} step={1} value={settings.guestLimit}
                onChange={(e) => setSettings(s => ({ ...s, guestLimit: +e.target.value }))} style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                <span>1 (مقيد)</span><span>20 (سخي)</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #F0F0F0" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>🎛️ إعدادات متقدمة</h2>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>الحد الأقصى للرد</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{settings.maxTokens} توكن</span>
              </div>
              <input type="range" min={200} max={4000} step={100} value={settings.maxTokens}
                onChange={(e) => setSettings(s => ({ ...s, maxTokens: +e.target.value }))} style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                <span>200 (موجز)</span><span>4000 (مفصل)</span>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>مستوى الإبداع</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{settings.temperature}</span>
              </div>
              <input type="range" min={0} max={1} step={0.1} value={settings.temperature}
                onChange={(e) => setSettings(s => ({ ...s, temperature: +e.target.value }))} style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                <span>0 (دقيق)</span><span>1 (مبدع)</span>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #F0F0F0" }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>📊 حالة الميزات</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Broker AI", status: settings.enabled, desc: "المساعد العقاري الرئيسي" },
                { label: "بحث الإنترنت", status: settings.searchEnabled, desc: "أسعار السوق الحديثة" },
                { label: "بحث Supabase", status: true, desc: "عقارات الموقع الحقيقية" },
                { label: "مساعد الدعم", status: true, desc: "الدعم الفني للمستخدمين" },
                { label: "سجل النشاط", status: true, desc: "تسجيل كل نشاط AI" },
                { label: "الرد التلقائي", status: settings.autoReply, desc: "ردود تلقائية على الرسائل" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F8F9FB", borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.status ? "#16a34a" : "#E5E7EB", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{f.label}</span>
                    <span style={{ fontSize: 11, color: "#9CA3AF", marginRight: 8 }}>— {f.desc}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: f.status ? "#16a34a" : "#9CA3AF" }}>
                    {f.status ? "نشط" : "متوقف"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Prompts */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0", marginBottom: 20 }}>
        <div style={{ display: "flex", borderBottom: "1px solid #F0F0F0" }}>
          <button className="tab-btn" onClick={() => setActiveTab("broker")}
            style={{ padding: "16px 24px", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Cairo', sans-serif", borderBottom: activeTab === "broker" ? "2px solid #2563EB" : "2px solid transparent", color: activeTab === "broker" ? "#2563EB" : "#6B7280", background: "transparent" }}>
            🤖 توجيهات Broker AI
          </button>
          <button className="tab-btn" onClick={() => setActiveTab("support")}
            style={{ padding: "16px 24px", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Cairo', sans-serif", borderBottom: activeTab === "support" ? "2px solid #16a34a" : "2px solid transparent", color: activeTab === "support" ? "#6B7280" : "#16a34a", background: "transparent" }}>
            🎧 توجيهات مساعد الدعم
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {activeTab === "broker" ? (
            <>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 14, lineHeight: 1.7 }}>يحدد شخصية Broker AI ومهامه — البحث عن عقارات، تحليل الأسعار، حساب الأقساط، وغيرها</p>
              <textarea value={settings.systemPrompt} onChange={(e) => setSettings(s => ({ ...s, systemPrompt: e.target.value }))}
                rows={10} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", lineHeight: 1.8, resize: "vertical", background: "#F8F9FB", color: "#374151" }} />
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, textAlign: "left" }}>{settings.systemPrompt.length} حرف</div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 14, lineHeight: 1.7 }}>يحدد شخصية مساعد الدعم الفني — مشاكل تسجيل الدخول، الدفع، والمشاكل التقنية فقط</p>
              <textarea value={settings.supportPrompt} onChange={(e) => setSettings(s => ({ ...s, supportPrompt: e.target.value }))}
                rows={10} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 13, fontFamily: "'Cairo', sans-serif", lineHeight: 1.8, resize: "vertical", background: "#F8F9FB", color: "#374151" }} />
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, textAlign: "left" }}>{settings.supportPrompt.length} حرف</div>
            </>
          )}
        </div>
      </div>

      {/* AI Agent */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #7C3AED, #2563EB)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0 }}>AI Agent — التحكم الكامل</h2>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>وكيل ذكي يعمل بدلاً عنك</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #F0F0F0" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>🔑 صلاحيات الوكيل</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "🔍", label: "البحث في العقارات", desc: "يبحث في Supabase ويعرض نتائج حقيقية", enabled: true, soon: false },
                { icon: "🌐", label: "البحث على الإنترنت", desc: "يبحث عن أسعار السوق الحديثة", enabled: settings.searchEnabled, soon: false },
                { icon: "🖼️", label: "تحليل الصور", desc: "يحلل صور العقار ويستخرج التفاصيل", enabled: true, soon: false },
                { icon: "📝", label: "كتابة وصف الإعلانات", desc: "يكتب وصف احترافي للإعلان", enabled: true, soon: false },
                { icon: "📋", label: "تسجيل النشاط", desc: "يسجل كل نشاط في قاعدة البيانات", enabled: true, soon: false },
                { icon: "𝕏", label: "النشر على تويتر", desc: "ينشر العقارات على حساب تويتر", enabled: false, soon: true },
                { icon: "📸", label: "النشر على انستغرام", desc: "ينشر الصور والريلز", enabled: false, soon: true },
                { icon: "💬", label: "إرسال واتساب", desc: "يرسل رسائل للعملاء المهتمين", enabled: false, soon: true },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: p.enabled ? "#F0FDF4" : "#F8F9FB", borderRadius: 12, border: `1px solid ${p.enabled ? "#BBF7D0" : "#F0F0F0"}` }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.label}</span>
                      {p.soon && <span style={{ background: "#FEF9C3", color: "#92400E", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>قريباً</span>}
                    </div>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>{p.desc}</span>
                  </div>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: p.enabled ? "#16a34a" : "#E5E7EB", position: "relative", flexShrink: 0, opacity: p.soon ? 0.5 : 1 }}>
                    <div style={{ width: 18, height: 18, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, right: p.enabled ? 3 : "calc(100% - 21px)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #F0F0F0" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>📤 سير عمل المسوّق</h3>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>المسوّق يرفع الصور — الوكيل يكمل الباقي</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { step: "1", label: "المسوّق يرفع صور العقار", icon: "📷", color: "#2563EB", done: true },
                  { step: "2", label: "Agent يحلل الصور ويستخرج التفاصيل", icon: "🔍", color: "#7C3AED", done: true },
                  { step: "3", label: "Agent يكتب وصف احترافي للإعلان", icon: "✍️", color: "#16a34a", done: true },
                  { step: "4", label: "Agent ينشر الإعلان في الموقع", icon: "🏠", color: "#16a34a", done: true },
                  { step: "5", label: "Agent ينشر على تويتر وانستغرام", icon: "📱", color: "#D97706", done: false },
                  { step: "6", label: "Agent يرسل للعملاء المهتمين", icon: "💬", color: "#D97706", done: false },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.done ? s.color : "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: s.done ? "#fff" : "#9CA3AF", flexShrink: 0 }}>{s.step}</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#F8F9FB", borderRadius: 10, padding: "8px 12px", border: `1px solid ${s.done ? "#E5E7EB" : "#F0F0F0"}` }}>
                      <span style={{ fontSize: 14 }}>{s.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: s.done ? "#374151" : "#9CA3AF" }}>{s.label}</span>
                      {!s.done && <span style={{ marginRight: "auto", fontSize: 10, color: "#D97706", fontWeight: 700 }}>قريباً</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* سجل النشاط الحقيقي */}
            <div style={{ background: "#0f172a", borderRadius: 16, padding: "20px", border: "1px solid #1e3a5f" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>📋 سجل نشاط الوكيل</h3>
                <button onClick={fetchActivityLogs} style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  🔄 تحديث
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activityLogs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: 12 }}>
                    لا يوجد نشاط بعد — ستظهر السجلات هنا عند استخدام Broker AI
                  </div>
                ) : activityLogs.map((log, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: log.status === "success" ? "#22c55e" : log.status === "error" ? "#ef4444" : "#F59E0B", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{formatTime(log.created_at)}</span>
                    <span style={{ fontSize: 12, color: log.status === "success" ? "#e2e8f0" : log.status === "error" ? "#fca5a5" : "#FCD34D", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}