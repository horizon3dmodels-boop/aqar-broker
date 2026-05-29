"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("الكل");
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      setProjects(data || []);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const statuses = ["الكل", "على الخارطة", "قيد الإنشاء", "مكتمل"];

  const filtered = projects.filter(p => {
    if (selectedStatus !== "الكل" && p.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card-hover { transition: all 0.25s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; }
      `}</style>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.2)", marginBottom: 18 }}>
            🏗️ مشاريع المطورين العقاريين
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 12 }}>المشاريع الكبرى في السعودية</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, marginBottom: 28 }}>
            أحدث مشاريع التطوير العقاري من أكبر المطورين في المملكة
          </p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
            {[
              { value: projects.length, label: "مشروع" },
              { value: projects.reduce((a, p) => a + (p.total_units || 0), 0).toLocaleString(), label: "وحدة سكنية" },
              { value: [...new Set(projects.map(p => p.developer))].length, label: "مطور معتمد" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px" }}>

        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setSelectedStatus(s)} style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid", borderColor: selectedStatus === s ? "#16a34a" : "#E5E7EB", background: selectedStatus === s ? "#16a34a" : "#fff", color: selectedStatus === s ? "#fff" : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              {s}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px", color: "#9CA3AF", fontSize: 15 }}>جاري التحميل...</div>
        )}

        {/* Projects List */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px", color: "#9CA3AF", fontSize: 15 }}>لا توجد مشاريع</div>
        )}

        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {filtered.map(p => (
              <div key={p.id} className="card-hover" onClick={() => router.push(`/projects/${p.id}`)} style={{ background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0", display: "flex", cursor: "pointer" }}>
                <div style={{ width: 320, flexShrink: 0, overflow: "hidden" }}>
                  <img src={p.img || p.images?.[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "24px", flex: 1 }}>
                  {p.featured && (
                    <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginBottom: 10, display: "inline-block" }}>⭐ مميز</span>
                  )}
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>{p.name}</h2>
                  <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>🏢 {p.developer} · 📍 {p.location}</p>
                  <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.8, marginBottom: 16 }}>{p.description?.slice(0, 120)}...</p>
                  <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    {[
                      { label: "الحالة", value: p.status },
                      { label: "التسليم", value: p.completion },
                      { label: "الوحدات", value: p.total_units || p.units },
                    ].map((d, i) => (
                      <div key={i} style={{ fontSize: 12 }}>
                        <div style={{ color: "#9CA3AF" }}>{d.label}</div>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress */}
                  <div style={{ marginBottom: 16, maxWidth: 300 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>نسبة الإنجاز</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>{p.progress}%</span>
                    </div>
                    <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${p.progress}%`, background: "#16a34a", borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>
                      {Number(p.price_from)?.toLocaleString() || p.price_from} <span style={{ fontSize: 13, color: "#9CA3AF" }}>ر.س</span>
                    </div>
                    <button style={{ padding: "10px 20px", background: "#16a34a", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}