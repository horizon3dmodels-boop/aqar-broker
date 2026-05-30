"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const tabs = [
  { key: "overview", label: "نظرة عامة" },
  { key: "units", label: "الوحدات المتاحة" },
  { key: "gallery", label: "معرض الصور" },
  { key: "timeline", label: "مراحل الإنشاء" },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();
      if (data) {
        setProject({
          ...data,
          gallery: data.images?.map((url: string, i: number) => ({ url, title: `صورة ${i+1}` })) || [],
          amenities: data.amenities || [],
          unitTypes: data.unit_types || [],
          milestones: data.milestones || [],
          startingPrice: data.price_from || '—',
          endingPrice: data.price_to || '—',
          totalUnits: data.total_units || data.units || 0,
          availableUnits: data.available_units || 0,
          developerMember: data.developer_member || '',
          deliveryDate: data.completion || '—',
          floors: data.floors || 0,
          area: data.area_from ? `من ${data.area_from}م² إلى ${data.area_to}م²` : '—',
          developerPhone: data.developer_phone || '',developerEmail: data.developer_email || '',
        });
      }
      setLoading(false);
    };
    fetchProject();
  }, [params.id]);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImg, setSelectedImg] = useState('');

  useEffect(() => {
    if (project?.gallery?.[0]?.url) setSelectedImg(project.gallery[0].url);
    else if (project?.img) setSelectedImg(project.img);
  }, [project]);

  if (loading) return <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", textAlign: "center", padding: "100px", fontSize: 18, color: "#6B7280" }}>جاري التحميل...</div>;
  if (!project) return <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", textAlign: "center", padding: "100px", fontSize: 18, color: "#6B7280" }}>المشروع غير موجود</div>;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .tab-btn { transition: all 0.2s; }
        .thumb:hover { opacity: 1 !important; transform: scale(0.97); }
        .thumb { transition: all 0.2s; }
        .unit-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.1) !important; }
        .unit-card { transition: all 0.2s; }
        input, textarea { font-family: "'Cairo', sans-serif"; }
        input:focus, textarea:focus { outline: none; border-color: #2563EB !important; }
        .send-btn:hover { background: #1d4ed8 !important; }
        .send-btn { transition: background 0.2s; }
      `}</style>

      {/* Hero Cover */}
      <div style={{ position: "relative", height: 420, overflow: "hidden" }}>
        <img src={project.gallery?.[0]?.url || project.img || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'} alt={project.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(15,23,42,0.85) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, padding: "32px 24px", display: "flex", flexDirection: "column", justifyContent: "flex-end", maxWidth: 1100, margin: "0 auto", left: 0, right: 0 }}>

          {/* Breadcrumb */}
          <div style={{ position: "relative", display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16, zIndex: 10 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>الرئيسية</Link>
            <span>›</span>
            <Link href="/projects" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>المشاريع</Link>
            <span>›</span>
            <span style={{ color: "#fff" }}>{project.name}</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span style={{ background: "#F59E0B", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 20 }}>⚡ {project.status}</span>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>{project.type}</span>
            <span style={{ background: "rgba(37,99,235,0.8)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>🖥️ محاكاة معمارية 3D</span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{project.name}</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>📍 {project.location} · 🏢 {project.floors} طابقاً · 🏗️ التسليم {project.deliveryDate}</p>

          {/* Progress */}
          <div style={{ marginTop: 16, maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>نسبة الإنجاز</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#4ade80" }}>{project.progress}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${project.progress}%`, background: "linear-gradient(90deg, #22c55e, #4ade80)", borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className="tab-btn" style={{ padding: "14px 22px", background: "none", border: "none", borderBottom: `3px solid ${activeTab === t.key ? "#2563EB" : "transparent"}`, fontSize: 14, fontWeight: activeTab === t.key ? 800 : 600, color: activeTab === t.key ? "#2563EB" : "#6B7280", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px 56px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* Main Content */}
        <div>

          {/* Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#fff", borderRadius: 20, padding: "28px", border: "1px solid #F0F0F0" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>عن المشروع</h2>
                <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 2, margin: 0 }}>{project.description}</p>
              </div>
              <div style={{ background: "#fff", borderRadius: 20, padding: "28px", border: "1px solid #F0F0F0" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>المرافق والخدمات</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {project.amenities.map((a, i) => (
                    <div key={i} style={{ background: "#F8F9FB", borderRadius: 12, padding: "12px 10px", textAlign: "center", fontSize: 12, color: "#374151", fontWeight: 600 }}>{a}</div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#fff", borderRadius: 20, padding: "28px", border: "1px solid #F0F0F0" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>تفاصيل المشروع</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                  {[
                    { label: "نوع المشروع", value: project.type },
                    { label: "عدد الطوابق", value: project.floors ? `${project.floors} طابقاً` : '—' },
                    { label: "إجمالي الوحدات", value: project.totalUnits || '—' },
                    { label: "الوحدات المتاحة", value: project.availableUnits || '—' },
                    { label: "موعد التسليم", value: project.deliveryDate || '—' },
                    { label: "المساحات", value: project.area || '—' },
                  ].map((d, i) => (  <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>    <div style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 4 }}>{d.label}</div>    <div style={{ fontWeight: 800, color: "#0f172a" }}>{d.value}</div>  </div>))}
                </div>
              </div>
            </div>
          )}

          {/* Units */}
          {activeTab === "units" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {project.unitTypes.map((u, i) => (
                <div key={i} className="unit-card" style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #F0F0F0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{u.type}</div>
                      <div style={{ fontSize: 13, color: "#6B7280" }}>📐 {u.area}</div>
                    </div>
                    <span style={{ background: "#F0FDF4", color: "#16a34a", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, border: "1px solid #BBF7D0", alignSelf: "flex-start" }}>{u.available} متاحة</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#2563EB", marginBottom: 16 }}>
                    {u.price} <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>ر.س</span>
                  </div>
                  <button style={{ width: "100%", background: "#EFF6FF", color: "#2563EB", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                    استفسر عن هذه الوحدة ←
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Gallery */}
          {activeTab === "gallery" && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #F0F0F0" }}>
              <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, position: "relative", height: 360 }}>
                <img src={selectedImg} alt="معاينة" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                  🖥️ محاكاة معمارية 3D
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
                {project.gallery.map((g, i) => (
                  <button key={i} className="thumb" onClick={() => setSelectedImg(g.url)} style={{ borderRadius: 10, overflow: "hidden", height: 72, border: `2px solid ${selectedImg === g.url ? "#2563EB" : "transparent"}`, opacity: selectedImg === g.url ? 1 : 0.65, cursor: "pointer", padding: 0 }}>
                    <img src={g.url} alt={g.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "32px", border: "1px solid #F0F0F0" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 28, textAlign: "center" }}>مراحل الإنشاء</h2>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", right: 19, top: 0, bottom: 0, width: 2, background: "#F0F0F0" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {project.milestones.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 20, alignItems: "center", paddingBottom: i < project.milestones.length - 1 ? 28 : 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: m.done ? "#16a34a" : "#F8F9FB", border: `3px solid ${m.done ? "#16a34a" : "#E5E7EB"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, fontSize: 16, color: m.done ? "#fff" : "#9CA3AF" }}>
                        {m.done ? "✓" : "○"}
                      </div>
                      <div style={{ flex: 1, background: m.done ? "#F0FDF4" : "#F8F9FB", borderRadius: 12, padding: "14px 18px", border: `1px solid ${m.done ? "#BBF7D0" : "#F0F0F0"}` }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: m.done ? "#166534" : "#374151" }}>{m.label}</div>
                        <div style={{ fontSize: 12, color: m.done ? "#16a34a" : "#9CA3AF", marginTop: 3 }}>📅 {m.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — ثابت */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Price */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1.5px solid #BFDBFE" }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>يبدأ السعر من</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#2563EB", marginBottom: 2 }}>{project.startingPrice ? Number(String(project.startingPrice).replace(/,/g, '')).toLocaleString('en-US') : '—'} <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600 }}>ر.س</span></div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>حتى {project.endingPrice ? Number(String(project.endingPrice).replace(/,/g, '')).toLocaleString('en-US') : '—'} ر.س · {project.area}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {[
                { label: `${project.totalUnits} وحدة`, icon: "🏠" },
                { label: `${project.availableUnits} متاحة`, icon: "✅" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: "#F8F9FB", borderRadius: 10, padding: "8px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  {s.icon} {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* أزرار المشاركة */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px", border: "1px solid #F0F0F0" }}> <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>شارك المشروع</p> <div style={{ display: "flex", gap: 8 }}>    <a href={`https://wa.me/?text=${encodeURIComponent(project.name + ' ' + window.location.href)}`} target="_blank" style={{ flex: 1, background: "#25D366", color: "#fff", borderRadius: 10, padding: "10px", textAlign: "center", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>واتساب</a>    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(project.name)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" style={{ flex: 1, background: "#000", color: "#fff", borderRadius: 10, padding: "10px", textAlign: "center", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>X</a>    <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={{ flex: 1, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>نسخ الرابط</button>  </div></div>

          {/* Contact Form */}
          <div style={{ background: "#0f172a", borderRadius: 24, padding: "28px", color: "#fff" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #2563EB, #1d4ed8)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 22, fontWeight: 900 }}>ر</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{project.developer}</div>
              <div style={{ fontSize: 11, color: "#60a5fa", marginTop: 4 }}>المطور العقاري المعتمد · عضوية {project.developerMember}</div>{project.developerPhone && (  <a href={`tel:${project.developerPhone}`} style={{ display: "block", marginTop: 8, background: "rgba(37,99,235,0.2)", color: "#93c5fd", borderRadius: 10, padding: "8px", textAlign: "center", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>    📞 {project.developerPhone}  </a>)}{project.developerEmail && (  <a href={`mailto:${project.developerEmail}`} style={{ display: "block", marginTop: 6, background: "rgba(255,255,255,0.05)", color: "#94a3b8", borderRadius: 10, padding: "8px", textAlign: "center", textDecoration: "none", fontSize: 12 }}>    ✉️ {project.developerEmail}  </a>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}