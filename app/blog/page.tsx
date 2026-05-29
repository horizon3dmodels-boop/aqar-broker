"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const categories = [
  { key: "all", label: "الكل" },
  { key: "prices", label: "أسعار العقارات" },
  { key: "tips", label: "نصائح الشراء" },
  { key: "neighborhoods", label: "أحياء الرياض" },
  { key: "laws", label: "قوانين وأنظمة" },
  { key: "finance", label: "تمويل عقاري" },
];

const categoryColors: Record<string, { bg: string; color: string }> = {
  prices: { bg: "#FEF9C3", color: "#854D0E" },
  tips: { bg: "#DBEAFE", color: "#1E40AF" },
  neighborhoods: { bg: "#F0FDF4", color: "#166534" },
  laws: { bg: "#FEE2E2", color: "#991B1B" },
  finance: { bg: "#F5F3FF", color: "#4C1D95" },
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setArticles(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === "all" || a.category === activeCategory;
    const matchSearch = !search || a.title?.includes(search) || a.excerpt?.includes(search);
    return matchCat && matchSearch;
  });

  const featured = filtered.filter((a) => a.featured);
  const regular = filtered.filter((a) => !a.featured);

  if (loading) return <div style={{ textAlign: "center", padding: "100px", fontFamily: "'Cairo'", fontSize: 16, fontWeight: 600 }}>جاري التحميل...</div>;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .article-card { transition: all 0.2s; cursor: pointer; }
        .article-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(0,0,0,0.12) !important; }
        .article-card:hover .article-img { transform: scale(1.05); }
        .article-img { transition: transform 0.3s; }
        .filter-btn { transition: all 0.15s; cursor: pointer; }
        .search-input:focus { outline: none; border-color: #2563EB !important; }
      `}</style>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", padding: "56px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 20, marginBottom: 16 }}>
          📰 المدونة العقارية
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginBottom: 12 }}>أحدث المقالات والتحليلات العقارية</h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.8 }}>
          محتوى موثوق من خبراء السوق العقاري السعودي — نصائح، تحليلات، وأخبار السوق
        </p>
        {/* Search */}
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في المقالات..." className="search-input" style={{ width: "100%", padding: "13px 44px 13px 16px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.1)", fontSize: 14, fontFamily: "'Cairo', sans-serif", color: "#fff" }} />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 56px" }}>

        {/* Categories */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button key={c.key} onClick={() => setActiveCategory(c.key)} className="filter-btn" style={{ padding: "8px 18px", borderRadius: 20, border: "1.5px solid", fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif", background: activeCategory === c.key ? "#0f172a" : "#fff", color: activeCategory === c.key ? "#fff" : "#374151", borderColor: activeCategory === c.key ? "#0f172a" : "#E5E7EB" }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Featured Articles */}
        {featured.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>📌 مقالات مميزة</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
              {featured.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`} style={{ textDecoration: "none" }}>
                  <div className="article-card" style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #F0F0F0", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                    <div style={{ height: 220, overflow: "hidden", position: "relative" }}>
                      <img src={a.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"} alt={a.title} className="article-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: 12, right: 12 }}>
                        <span style={{ background: categoryColors[a.category]?.bg, color: categoryColors[a.category]?.color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>{a.category_label || a.category}</span>
                      </div>
                      <div style={{ position: "absolute", top: 12, left: 12 }}>
                        <span style={{ background: "#0f172a", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>⭐ مميز</span>
                      </div>
                    </div>
                    <div style={{ padding: "20px" }}>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 8, lineHeight: 1.4 }}>{a.title}</h3>
                      <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7, marginBottom: 16 }}>{a.excerpt}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, background: "#EFF6FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#2563EB" }}>{a.author_name?.[0] || "ب"}</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{a.author_name || "—"}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{a.date}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#9CA3AF" }}>
                          <span>⏱️ {a.readTime} د</span>
                          <span>👁️ {a.views?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles */}
        {regular.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>📚 جميع المقالات</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {regular.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`} style={{ textDecoration: "none" }}>
                  <div className="article-card" style={{ background: "#fff", borderRadius: 18, overflow: "hidden", border: "1px solid #F0F0F0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ height: 170, overflow: "hidden", position: "relative" }}>
                      <img src={a.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"} alt={a.title} className="article-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <span style={{ background: categoryColors[a.category]?.bg, color: categoryColors[a.category]?.color, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{a.category_label || a.category}</span>
                      </div>
                    </div>
                    <div style={{ padding: "16px" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 6, lineHeight: 1.5 }}>{a.title}</h3>
                      <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7, marginBottom: 12 }}>{a.excerpt?.slice(0, 90)}...</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 24, height: 24, background: "#EFF6FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#2563EB" }}>{a.author_name?.[0] || "ب"}</div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{a.author_name || "—"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#9CA3AF" }}>
                          <span>⏱️ {a.readTime} د</span>
                          <span>👁️ {a.views?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: 20, border: "1px solid #F0F0F0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>لا توجد مقالات</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>جرب تغيير كلمة البحث أو التصنيف</div>
          </div>
        )}
      </div>
    </div>
  );
}