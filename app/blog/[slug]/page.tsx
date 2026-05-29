"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function BlogArticlePage() {
  const params = useParams();
  const [copied, setCopied] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      const slug = params?.slug as string;
      if (!slug) return;

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!data || error) { setNotFound(true); setLoading(false); return; }

      await supabase.from('blog_posts').update({ views: (data.views || 0) + 1 }).eq('id', data.id);
      setArticle(data);

      const { data: related } = await supabase
        .from('blog_posts')
        .select('id, title, slug, image, category_label, read_time')
        .eq('status', 'published')
        .neq('id', data.id)
        .limit(5);
      setRelatedPosts(related || []);
      setLoading(false);
    };
    fetchArticle();
  }, [params?.slug]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent((article?.title || '') + ' ' + window.location.href)}`, '_blank');
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article?.title || '')}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  const shareLinkedin = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');

  if (loading) return <div style={{ textAlign: "center", padding: "100px", fontFamily: "'Cairo'", fontSize: 16, fontWeight: 600 }}>جاري التحميل...</div>;

  if (notFound) return (
    <div style={{ textAlign: "center", padding: "100px", fontFamily: "'Cairo'" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>المقال غير موجود</h2>
      <Link href="/blog" style={{ color: "#2563EB", fontWeight: 700 }}>← العودة للمدونة</Link>
    </div>
  );

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .share-btn:hover { transform: translateY(-2px); opacity: 0.9; }
        .share-btn { transition: all 0.2s; }
        .related-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important; }
        .related-card { transition: all 0.2s; }
      `}</style>

      {/* Hero */}
      <div style={{ position: "relative", height: 420, overflow: "hidden" }}>
        <img src={article.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(15,23,42,0.85))" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px 24px", maxWidth: 1100, margin: "0 auto", left: 0, right: 0 }}>
          <div style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>الرئيسية</Link>
            <span>›</span>
            <Link href="/blog" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>المدونة</Link>
            <span>›</span>
            <span style={{ color: "#fff" }}>{article.title}</span>
          </div>
          <span style={{ background: "#DBEAFE", color: "#1E40AF", fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 20, alignSelf: "flex-start", marginBottom: 12 }}>{article.category_label || "عام"}</span>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12, lineHeight: 1.4, maxWidth: 700 }}>{article.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34, background: "#2563EB", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>{article.author_name?.[0] || "ب"}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{article.author_name || "—"}</span>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>📅 {new Date(article.created_at).toLocaleDateString('ar-SA')}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>⏱️ {article.read_time} دقائق</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>👁️ {(article.views || 0).toLocaleString()} مشاهدة</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px 56px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 28, alignItems: "start" }}>

        {/* Article Content */}
        <div>
          {/* Content Box */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "36px", border: "1px solid #F0F0F0", marginBottom: 24, fontSize: 15, lineHeight: 2, color: "#374151" }}>
            {article.content ? (
              typeof article.content === 'string' ? (
                <div>
                  {article.content.split('\n').map((line: string, i: number) => {
                    if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: "24px 0 12px" }}>{line.replace('## ', '')}</h2>;
                    if (line.startsWith('💡 ')) return <div key={i} style={{ background: "#EFF6FF", borderRadius: 12, padding: "12px 16px", margin: "12px 0", fontSize: 13, fontWeight: 700, color: "#1E40AF", border: "1px solid #BFDBFE" }}>{line}</div>;
                    if (line.startsWith('---')) return <hr key={i} style={{ border: "none", borderTop: "1px solid #F0F0F0", margin: "20px 0" }} />;
                    if (line.match(/^!\[.*\]\(.*\)$/)) {
                      const url = line.match(/\((.*)\)/)?.[1];
                      return url ? <img key={i} src={url} alt="" style={{ width: "100%", borderRadius: 12, margin: "12px 0" }} /> : null;
                    }
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} style={{ fontSize: 15, color: "#4B5563", lineHeight: 2, margin: "8px 0" }}>{line}</p>;
                  })}
                </div>
              ) : Array.isArray(article.content) ? article.content.map((block: any, i: number) => {
                if (block.type === "intro") return <p key={i} style={{ fontSize: 16, color: "#374151", lineHeight: 2, marginBottom: 24, fontWeight: 600, borderRight: "4px solid #2563EB", paddingRight: 16 }}>{block.text}</p>;
                if (block.type === "heading") return <h2 key={i} style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 12, marginTop: 32 }}>{block.text}</h2>;
                if (block.type === "text") return <p key={i} style={{ fontSize: 15, color: "#4B5563", lineHeight: 2, marginBottom: 16 }}>{block.text}</p>;
                if (block.type === "highlight") return <div key={i} style={{ background: "#EFF6FF", borderRadius: 12, padding: "14px 18px", marginBottom: 16, fontSize: 13, fontWeight: 700, color: "#1E40AF", border: "1px solid #BFDBFE" }}>{block.text}</div>;
                if (block.type === "image") return <img key={i} src={block.url} alt={block.caption || ""} style={{ width: "100%", borderRadius: 12, marginBottom: 16 }} />;
                return null;
              }) : null
            ) : <p style={{ color: "#9CA3AF" }}>لا يوجد محتوى</p>}
          </div>

          {/* Author */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", border: "1px solid #F0F0F0", marginBottom: 20, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, background: "#EFF6FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#2563EB", flexShrink: 0 }}>{article.author_name?.[0] || "ب"}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>✍️ {article.author_name}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{article.author_bio || "كاتب في عقار بروكر"}</div>
            </div>
          </div>

          {/* Share Row */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "16px 24px", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>شارك المقال:</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={shareWhatsapp} className="share-btn" style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", display: "flex", alignItems: "center", gap: 5 }}>💬 واتساب</button>
              <button onClick={shareTwitter} className="share-btn" style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", display: "flex", alignItems: "center", gap: 5 }}>𝕏 تويتر</button>
              <button onClick={shareLinkedin} className="share-btn" style={{ background: "#0077B5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", display: "flex", alignItems: "center", gap: 5 }}>in لينكدإن</button>
              <button onClick={handleCopy} className="share-btn" style={{ background: copied ? "#F0FDF4" : "#F8F9FB", color: copied ? "#16a34a" : "#374151", border: "1.5px solid", borderColor: copied ? "#BBF7D0" : "#E5E7EB", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>
                {copied ? "✓ تم النسخ" : "🔗 نسخ الرابط"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ position: "sticky", top: 80 }}>

          {/* Share Buttons */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px", border: "1px solid #F0F0F0", marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 12 }}>مشاركة</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={shareWhatsapp} className="share-btn" style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>💬 واتساب</button>
              <button onClick={shareTwitter} className="share-btn" style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>𝕏 تويتر</button>
              <button onClick={shareLinkedin} className="share-btn" style={{ background: "#0077B5", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>in لينكدإن</button>
              <button onClick={handleCopy} className="share-btn" style={{ background: copied ? "#F0FDF4" : "#F8F9FB", color: copied ? "#16a34a" : "#374151", border: "1.5px solid", borderColor: copied ? "#BBF7D0" : "#E5E7EB", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {copied ? "✓ تم النسخ" : "🔗 نسخ الرابط"}
              </button>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "16px", border: "1px solid #F0F0F0" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>📚 مقالات مشابهة</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {relatedPosts.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}`} style={{ textDecoration: "none" }}>
                    <div className="related-card" style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px", borderRadius: 10, border: "1px solid #F0F0F0" }}>
                      <div style={{ width: 56, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                        <img src={r.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80"} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>⏱️ {r.read_time} دقائق</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}