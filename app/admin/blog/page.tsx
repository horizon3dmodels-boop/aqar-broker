"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    image: "",
    category: "general",
    category_label: "عام",
    author_name: "باسل",
    author_bio: "",
    read_time: 5,
    status: "draft",
    featured: false,
    content: "",
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    setPosts(data || []);
    loading && setLoading(false);
  };

  const generateSlug = () => {
  return `post-${Date.now()}`;
};

  const openAdd = () => {
    setEditPost(null);
    setForm({ title: "", slug: "", excerpt: "", image: "", category: "general", category_label: "عام", author_name: "باسل", author_bio: "", read_time: 5, status: "draft", featured: false, content: "" });
    setShowModal(true);
  };

  const openEdit = (post: any) => {
    setEditPost(post);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      image: post.image || "",
      category: post.category || "general",
      category_label: post.category_label || "عام",
      author_name: post.author_name || "باسل",
      author_bio: post.author_bio || "",
      read_time: post.read_time || 5,
      status: post.status || "draft",
      featured: post.featured || false,
      content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ""),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const slug = form.slug && /^[a-zA-Z0-9-]+$/.test(form.slug) ? form.slug : `post-${Date.now()}`;
    const data = {
      ...form,
      slug,
      updated_at: new Date().toISOString(),
      content: form.content ? form.content : null,
    };

    if (editPost) {
      await supabase.from('blog_posts').update(data).eq('id', editPost.id);
    } else {
      await supabase.from('blog_posts').insert({ ...data, views: 0 });
    }

    setSaving(false);
    setShowModal(false);
    fetchPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'published' ? 'draft' : 'published';
    await supabase.from('blog_posts').update({ status: newStatus }).eq('id', id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const filtered = posts.filter(p => {
    if (statusFilter !== "الكل" && p.status !== (statusFilter === "منشور" ? "published" : "draft")) return false;
    if (search && !p.title?.includes(search)) return false;
    return true;
  });

  const inputStyle = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" };

  return (
    <div style={{ padding: "24px", fontFamily: "'Cairo', sans-serif" }}>
      <style>{`* { box-sizing: border-box; } tr:hover td { background: #F8F9FB; } .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; } input:focus, select:focus, textarea:focus { border-color: #16a34a !important; outline: none; }`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "📝", label: "إجمالي المقالات", value: posts.length, color: "#3B82F6", bg: "#EFF6FF" },
          { icon: "✅", label: "منشورة", value: posts.filter(p => p.status === "published").length, color: "#16a34a", bg: "#F0FDF4" },
          { icon: "📄", label: "مسودة", value: posts.filter(p => p.status === "draft").length, color: "#F59E0B", bg: "#FFFBEB" },
          { icon: "⭐", label: "مميزة", value: posts.filter(p => p.featured).length, color: "#8B5CF6", bg: "#F5F3FF" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
            <div><div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div><div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "14px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", gap: 10, alignItems: "center" }}>
        <input placeholder="🔍 بحث بعنوان المقال..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Cairo'", color: "#374151", background: "#FAFAFA", outline: "none" }} />
        {["الكل", "منشور", "مسودة"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "7px 16px", borderRadius: 20, border: "1.5px solid", borderColor: statusFilter === s ? "#16a34a" : "#E5E7EB", background: statusFilter === s ? "#16a34a" : "#fff", color: statusFilter === s ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo'" }}>{s}</button>
        ))}
        <button onClick={openAdd} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'", whiteSpace: "nowrap" }}>+ مقال جديد</button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8F9FB" }}>
              {["المقال", "التصنيف", "الكاتب", "المشاهدات", "مميز", "الحالة", "التاريخ", "إجراءات"].map((h, i) => (
                <th key={i} style={{ padding: "13px 14px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF" }}>جاري التحميل...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>لا توجد مقالات — أضف أول مقال</p>
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {p.image && <div style={{ width: 48, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}><img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ background: "#EFF6FF", color: "#3B82F6", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{p.category_label || p.category}</span>
                </td>
                <td style={{ padding: "14px", fontSize: 12, color: "#374151" }}>{p.author_name}</td>
                <td style={{ padding: "14px", fontSize: 13, color: "#374151", textAlign: "center" }}>👁️ {p.views || 0}</td>
                <td style={{ padding: "14px", textAlign: "center" }}>
                  {p.featured ? <span style={{ color: "#F59E0B", fontSize: 18 }}>⭐</span> : <span style={{ color: "#E5E7EB", fontSize: 18 }}>☆</span>}
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: p.status === "published" ? "#DCFCE7" : "#FEF9C3", color: p.status === "published" ? "#16a34a" : "#92400E" }}>
                    {p.status === "published" ? "منشور" : "مسودة"}
                  </span>
                </td>
                <td style={{ padding: "14px", fontSize: 12, color: "#9CA3AF" }}>{new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleStatus(p.id, p.status)} style={{ background: p.status === "published" ? "#FEF9C3" : "#DCFCE7", color: p.status === "published" ? "#92400E" : "#16a34a", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>
                      {p.status === "published" ? "⏸" : "▶ نشر"}
                    </button>
                    <button onClick={() => openEdit(p)} style={{ background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>✏️</button>
                    <button onClick={() => window.open(`/blog/${p.slug}`, '_blank')} style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>👁️</button>
                    <button onClick={() => deletePost(p.id)} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "32px", width: 640, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{editPost ? "✏️ تعديل المقال" : "📝 مقال جديد"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>عنوان المقال *</label>
                <input value={form.title} onChange={e => { setForm({ ...form, title: e.target.value }); }} placeholder="مثال: أفضل أحياء الرياض للسكن" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>الرابط (Slug)</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="example-slug-in-english" style={inputStyle}/><p style={{ fontSize: 11, color: "#F59E0B", marginTop: 4, fontWeight: 600 }}>⚠️ يجب أن يكون بالإنجليزي فقط — مثال: best-neighborhoods-riyadh</p>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>مقتطف المقال</label>
                <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="وصف مختصر للمقال..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <div>  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>محتوى المقال</label>    {/* شريط أدوات */}  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>    {[      { label: "عنوان", insert: "\n\n## " },      { label: "نص عادي", insert: "\n\n" },      { label: "اقتباس 💡", insert: "\n\n💡 " },      { label: "فاصل", insert: "\n\n---\n\n" },    ].map((btn, i) => (      <button key={i} type="button" onClick={() => setForm({ ...form, content: form.content + btn.insert })}        style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'Cairo'", color: "#374151" }}>        {btn.label}      </button>    ))}        {/* زر رفع صورة */}    <label style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'Cairo'", color: "#2563EB", fontWeight: 700 }}>      🖼️ إضافة صورة      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {        const file = e.target.files?.[0];        if (!file) return;        const ext = file.name.split(".").pop();        const path = `blog/${Date.now()}.${ext}`;        const { error } = await supabase.storage.from("property-images").upload(path, file, { cacheControl: "3600", upsert: false });        if (error) { alert("فشل رفع الصورة"); return; }        const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);        setForm({ ...form, content: form.content + `\n\n![صورة](${publicUrl})\n\n` });      }} />    </label>  </div>  <textarea     value={form.content}     onChange={e => setForm({ ...form, content: e.target.value })}     rows={20}    placeholder="اكتب محتوى المقال هنا...&#10;&#10;يمكنك استخدام:&#10;## عنوان فرعي&#10;💡 نص مميز&#10;![صورة](رابط الصورة)"     style={{ ...inputStyle, resize: "vertical", minHeight: 400, lineHeight: 1.8 }}   />  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, textAlign: "left" }}>{form.content.length} حرف</div></div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>الصورة الرئيسية</label>
                {form.image && (
                  <div style={{ marginBottom: 8, borderRadius: 10, overflow: "hidden", height: 120 }}>
                    <img src={form.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const ext = file.name.split(".").pop();
                    const path = `blog/${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from("property-images").upload(path, file, { cacheControl: "3600", upsert: false });
                    if (error) { alert("فشل رفع الصورة"); return; }
                    const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);
                    setForm({ ...form, image: publicUrl });
                  }}
                  style={{ width: "100%", border: "1.5px dashed #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA", cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>التصنيف</label>
                  <select value={form.category} onChange={e => {
                    const labels: Record<string, string> = { general: "عام", neighborhoods: "أحياء", prices: "أسعار", tips: "نصائح", investment: "استثمار" };
                    setForm({ ...form, category: e.target.value, category_label: labels[e.target.value] || "عام" });
                  }} style={inputStyle}>
                    <option value="general">عام</option>
                    <option value="neighborhoods">أحياء الرياض</option>
                    <option value="prices">أسعار العقارات</option>
                    <option value="tips">نصائح الشراء</option>
                    <option value="investment">استثمار عقاري</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>وقت القراءة (دقائق)</label>
                  <input type="number" value={form.read_time} onChange={e => setForm({ ...form, read_time: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>اسم الكاتب</label>
                  <input value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>الحالة</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                    <option value="draft">مسودة</option>
                    <option value="published">منشور</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F8F9FB", borderRadius: 10 }}>
                <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} style={{ accentColor: "#16a34a", width: 16, height: 16 }} />
                <label htmlFor="featured" style={{ fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>⭐ مقال مميز (يظهر في الصفحة الرئيسية)</label>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: saving ? "#86efac" : "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Cairo'" }}>
                  {saving ? "جاري الحفظ..." : editPost ? "💾 حفظ التعديلات" : "✅ نشر المقال"}
                </button>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: "#F8F9FB", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo'" }}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}