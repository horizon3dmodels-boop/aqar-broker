"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

let mapboxgl: any;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
}

function ProjectMapPicker({ lat, lng, onSelect }: { lat: number; lng: number; onSelect: (lat: number, lng: number, address: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [address, setAddress] = useState('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (mapRef.current || !mapboxgl || !containerRef.current) return;

    if (mapboxgl.getRTLTextPluginStatus() === 'unavailable') {
      mapboxgl.setRTLTextPlugin(
        'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
        () => {}, true
      );
    }

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng || 46.6753, lat || 24.7136],
      zoom: 13,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      language: 'ar',
      placeholder: 'ابحث عن موقع...',
    });
    mapRef.current.addControl(geocoder, 'top-right');

    mapRef.current.on('load', () => {
      const layers = ['country-label', 'state-label', 'settlement-label'];
      layers.forEach(layer => {
        try { mapRef.current.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); } catch {}
      });
      const center = mapRef.current.getCenter();
      onSelectRef.current(center.lat, center.lng, '');
    });

    mapRef.current.on('movestart', () => setMoving(true));

    mapRef.current.on('moveend', () => {
      setMoving(false);
      const center = mapRef.current.getCenter();
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${center.lng},${center.lat}.json?access_token=${mapboxgl.accessToken}&language=ar`)
        .then(r => r.json())
        .then(data => {
          const placeName = data.features?.[0]?.place_name || '';
          setAddress(placeName);
          onSelectRef.current(center.lat, center.lng, placeName);
        })
        .catch(() => onSelectRef.current(center.lat, center.lng, ''));
    });
  }, []);

  return (
    <div style={{ position: "relative", borderRadius: 12, border: "1px solid #E5E7EB" }}>
      <div ref={containerRef} style={{ width: "100%", height: 280 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -100%)", zIndex: 10, pointerEvents: "none" }}>
        <div style={{ fontSize: 32, filter: moving ? "drop-shadow(0 8px 4px rgba(0,0,0,0.3))" : "drop-shadow(0 4px 2px rgba(0,0,0,0.3))", transform: moving ? "translateY(-8px)" : "translateY(0)", transition: "all 0.2s" }}>📍</div>
      </div>
      {address && (
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "rgba(255,255,255,0.97)", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#374151", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 10 }}>
          📍 {address}
        </div>
      )}
    </div>
  );
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<any | null>(null);
  const [searchText, setSearchText] = useState("");
  const [newProject, setNewProject] = useState({
    name: "", developer: "", location: "", type: "للبيع", status: "على الخارطة",
    units: "", priceFrom: "", completion: "", progress: "0", pinColor: "#3B82F6",
    featured: false, img: "", lat: "24.7136", lng: "46.6753",
    description: "", amenities: [] as string[], floors: "", areaFrom: "", areaTo: "", priceTo: "", totalUnits: "", availableUnits: "", images: [] as string[],
    unit_types: [] as any[],
    developerPhone: "", developerEmail: "", developerMember: "",
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [newUnit, setNewUnit] = useState({ type: '', area: '', price: '', available: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const filePath = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('projects').upload(filePath, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('projects').getPublicUrl(filePath);
        urls.push(publicUrl);
      }
    }
    if (urls.length > 0) {
      if (editProject) {
        const newImages = [...(editProject.images || []), ...urls];
        setEditProject({ ...editProject, images: newImages, img: editProject.img || urls[0] });
      } else {
        const newImages = [...(newProject.images || []), ...urls];
        setNewProject({ ...newProject, images: newImages, img: newProject.img || urls[0] });
      }
    }
    setUploadingImage(false);
  };

  const filtered = projects.filter(p =>
    !searchText || p.name.includes(searchText) || p.developer.includes(searchText)
  );

  const handleAdd = async () => {
    if (!newProject.name || !newProject.developer) return;
    const { error } = await supabase.from('projects').insert({
      name: newProject.name,
      developer: newProject.developer,
      location: newProject.location,
      type: newProject.type,
      status: newProject.status,
      units: Number(newProject.units) || 0,
      price_from: newProject.priceFrom,
      completion: newProject.completion,
      progress: Number(newProject.progress) || 0,
      pin_color: newProject.pinColor,
      featured: newProject.featured,
      img: newProject.img,
      latitude: Number(newProject.lat) || null,
      longitude: Number(newProject.lng) || null,
      description: newProject.description,
      amenities: newProject.amenities,
      floors: Number(newProject.floors) || 0,
      area_from: newProject.areaFrom,
      area_to: newProject.areaTo,
      price_to: newProject.priceTo,
      total_units: Number(newProject.totalUnits) || 0,
      available_units: Number(newProject.availableUnits) || 0,
      images: newProject.images,
      unit_types: newProject.unit_types,
      developer_phone: newProject.developerPhone,developer_email: newProject.developerEmail,developer_member: newProject.developerMember,
    });
    if (!error) { 
      fetchProjects(); 
      setShowModal(false); 
      setNewProject({ name: "", developer: "", location: "", type: "للبيع", status: "على الخارطة", units: "", priceFrom: "", completion: "", progress: "0", pinColor: "#3B82F6", featured: false, img: "", lat: "24.7136", lng: "46.6753", description: "", amenities: [] as string[], floors: "", areaFrom: "", areaTo: "", priceTo: "", totalUnits: "", availableUnits: "", images: [] as string[], unit_types: [] as any[], developerPhone: "", developerEmail: "", developerMember: "" });
    }
  };

  const toggleFeatured = async (id: number, featured: boolean) => {
    await supabase.from('projects').update({ featured: !featured }).eq('id', id);
    fetchProjects();
  };

  const deleteProject = async (id: number) => {
    await supabase.from('projects').delete().eq('id', id);
    fetchProjects();
  };

  const updateProgress = async (id: number, progress: number) => {
    await supabase.from('projects').update({ progress }).eq('id', id);
    setProjects(projects.map(p => p.id === id ? { ...p, progress } : p));
  };

  const inputStyle = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 6 } as React.CSSProperties;

  const pinColors = ["#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#16a34a", "#EC4899", "#0EA5E9"];

  return (
    <div style={{ padding: "24px" }}>
      <style>{`input:focus, select:focus, textarea:focus { border-color: #16a34a !important; outline: none; } .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; } tr:hover td { background: #F8F9FB; }`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "🏗️", label: "إجمالي المشاريع", value: projects.length, color: "#3B82F6", bg: "#EFF6FF" },
          { icon: "📍", label: "على الخارطة", value: projects.filter(p => p.status === "على الخارطة").length, color: "#F59E0B", bg: "#FFFBEB" },
          { icon: "🔨", label: "قيد الإنشاء", value: projects.filter(p => p.status === "قيد الإنشاء").length, color: "#16a34a", bg: "#F0FDF4" },
          { icon: "⭐", label: "مشاريع مميزه", value: projects.filter(p => p.featured).length, color: "#8B5CF6", bg: "#F5F3FF" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", display: "flex", gap: 12, alignItems: "center" }}>
        <input type="text" placeholder="🔍 بحث بالاسم أو المطور..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ flex: 1, border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" }} />
        <button onClick={() => setShowModal(true)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
          + إضافة مشروع جديد
        </button>
      </div>

      {/* Projects Table */}
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1px solid #F0F0F0", overflow: "hidden", marginBottom: 20 }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontFamily: "'Cairo', sans-serif" }}>جاري تحميل المشاريع...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8F9FB" }}>
                {["المشروع", "المطور", "النوع", "الحالة", "الوحدات", "السعر من", "التسليم", "الإنجاز", "دبوس", "مميز", "إجراءات"].map((h, i) => (
                  <th key={i} style={{ padding: "14px 12px", fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F0F0F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #F8F9FB" }}>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 48, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                        {p.img ? (
                          <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🖼️</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>📍 {p.location} {p.lat && `(${p.lat}, ${p.lng})`}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px", fontSize: 13, color: "#374151" }}>{p.developer}</td>
                  <td style={{ padding: "14px" }}>
                    <span style={{ background: p.type === "للبيع" ? "#F0FDF4" : "#EFF6FF", color: p.type === "للبيع" ? "#16a34a" : "#3B82F6", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{p.type}</span>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: p.status === "قيد الإنشاء" ? "#FEF9C3" : "#EFF6FF", color: p.status === "قيد الإنشاء" ? "#92400E" : "#3B82F6" }}>{p.status}</span>
                  </td>
                  <td style={{ padding: "14px", fontSize: 13, fontWeight: 600, color: "#374151", textAlign: "center" }}>{p.units}</td>
                  <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{p.price_from} ر.س</td>
                  <td style={{ padding: "14px", fontSize: 13, color: "#374151" }}>{p.completion}</td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, height: 6, overflow: "hidden", minWidth: 60 }}>
                        <div style={{ width: `${p.progress}%`, background: "#16a34a", height: "100%", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", flexShrink: 0 }}>{p.progress}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={p.progress} onChange={(e) => updateProgress(p.id, Number(e.target.value))} style={{ width: "100%", marginTop: 4, accentColor: "#16a34a" }} />
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ width: 20, height: 20, background: p.pin_color, borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
                  </td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <button onClick={() => toggleFeatured(p.id, p.featured)} style={{ background: p.featured ? "#FFFBEB" : "#F3F4F6", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 16 }}>
                      {p.featured ? "⭐" : "☆"}
                    </button>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditProject({ ...p, priceFrom: p.price_from, pinColor: p.pin_color, lat: String(p.lat || '24.7136'), lng: String(p.lng || '46.6753') }); setShowModal(true); }} style={{ background: "#EFF6FF", color: "#3B82F6", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>✏️ تعديل</button>
                      <button onClick={() => deleteProject(p.id)} style={{ background: "#FFF5F5", color: "#EF4444", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditProject(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "32px", width: 620, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                {editProject ? "✏️ تعديل المشروع" : "🏗️ إضافة مشروع جديد"}
              </h3>
              <button onClick={() => { setShowModal(false); setEditProject(null); }} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={labelStyle}>اسم المشروع <span style={{ color: "#EF4444" }}>*</span></label><input value={editProject?.name ?? newProject.name} onChange={(e) => editProject ? setEditProject({ ...editProject, name: e.target.value }) : setNewProject({ ...newProject, name: e.target.value })} placeholder="مشروع أبراج النخيل" style={inputStyle} /></div>
                <div><label style={labelStyle}>المطور العقاري <span style={{ color: "#EF4444" }}>*</span></label><input value={editProject?.developer ?? newProject.developer} onChange={(e) => editProject ? setEditProject({ ...editProject, developer: e.target.value }) : setNewProject({ ...newProject, developer: e.target.value })} placeholder="شركة الأفق" style={inputStyle} /></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>  <div><label style={labelStyle}>رقم المطور</label><input value={editProject?.developerPhone ?? newProject.developerPhone} onChange={(e) => editProject ? setEditProject({ ...editProject, developerPhone: e.target.value }) : setNewProject({ ...newProject, developerPhone: e.target.value })} placeholder="05xxxxxxxx" style={inputStyle} /></div>  <div><label style={labelStyle}>إيميل المطور</label><input value={editProject?.developerEmail ?? newProject.developerEmail} onChange={(e) => editProject ? setEditProject({ ...editProject, developerEmail: e.target.value }) : setNewProject({ ...newProject, developerEmail: e.target.value })} placeholder="info@developer.com" style={inputStyle} /></div>  <div><label style={labelStyle}>رقم العضوية</label><input value={editProject?.developerMember ?? newProject.developerMember} onChange={(e) => editProject ? setEditProject({ ...editProject, developerMember: e.target.value }) : setNewProject({ ...newProject, developerMember: e.target.value })} placeholder="#7200" style={inputStyle} /></div></div>

              <div><label style={labelStyle}>الموقع (نصّاً)</label><input value={editProject?.location ?? newProject.location} onChange={(e) => editProject ? setEditProject({ ...editProject, location: e.target.value }) : setNewProject({ ...newProject, location: e.target.value })} placeholder="حي العليا، الرياض" style={inputStyle} /></div>

              <div>
                <label style={labelStyle}>وصف المشروع</label>
                <textarea value={editProject?.description ?? newProject.description} onChange={(e) => editProject ? setEditProject({ ...editProject, description: e.target.value }) : setNewProject({ ...newProject, description: e.target.value })} placeholder="وصف تفصيلي للمشروع..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* تفاصيل المشروع مرتبة طبقاً للصورة المعروضة */}
              <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "16px", border: "1px solid #F0F0F0", display: "flex", flexDirection: "column", gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1F2937", marginBottom: 2, display: "block" }}>📋 تفاصيل المشروع</span>
                
                {/* الصف الأول: نوع المشروع - عدد الطوابق */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>نوع المشروع</label>
                    <select value={editProject?.type ?? newProject.type} onChange={(e) => editProject ? setEditProject({ ...editProject, type: e.target.value }) : setNewProject({ ...newProject, type: e.target.value })} style={inputStyle}>
                      <option>للبيع</option>
                      <option>للإيجار</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>عدد الطوابق</label>
                    <input value={editProject?.floors ?? newProject.floors} onChange={(e) => editProject ? setEditProject({ ...editProject, floors: e.target.value }) : setNewProject({ ...newProject, floors: e.target.value })} placeholder="5" style={inputStyle} />
                  </div>
                </div>

                {/* الصف الثاني: إجمالي الوحدات - الوحدات المتاحة */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>إجمالي الوحدات</label>
                    <input value={editProject?.units ?? newProject.units} onChange={(e) => editProject ? setEditProject({ ...editProject, units: Number(e.target.value) }) : setNewProject({ ...newProject, units: e.target.value })} placeholder="100" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>الوحدات المتاحة</label>
                    <input value={editProject?.availableUnits ?? newProject.availableUnits} onChange={(e) => editProject ? setEditProject({ ...editProject, availableUnits: e.target.value }) : setNewProject({ ...newProject, availableUnits: e.target.value })} placeholder="52" style={inputStyle} />
                  </div>
                </div>

                {/* الصف الثالث: موعد التسليم - المساحات */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>موعد التسليم</label>
                    <input value={editProject?.completion ?? newProject.completion} onChange={(e) => editProject ? setEditProject({ ...editProject, completion: e.target.value }) : setNewProject({ ...newProject, completion: e.target.value })} placeholder="2027" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>المساحة من (م²)</label>
                    <input value={editProject?.areaFrom ?? newProject.areaFrom} onChange={(e) => editProject ? setEditProject({ ...editProject, areaFrom: e.target.value }) : setNewProject({ ...newProject, areaFrom: e.target.value })} placeholder="120" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>المساحة إلى (م²)</label>
                    <input value={editProject?.areaTo ?? newProject.areaTo} onChange={(e) => editProject ? setEditProject({ ...editProject, areaTo: e.target.value }) : setNewProject({ ...newProject, areaTo: e.target.value })} placeholder="220" style={inputStyle} />
                  </div>
                </div>

                {/* الصف الرابع: حالة المشروع - الأسعار */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>حالة المشروع</label>
                    <select value={editProject?.status ?? newProject.status} onChange={(e) => editProject ? setEditProject({ ...editProject, status: e.target.value }) : setNewProject({ ...newProject, status: e.target.value })} style={inputStyle}>
                      <option>على الخارطة</option>
                      <option>قيد الإنشاء</option>
                      <option>مكتمل</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>السعر من (ر.س)</label>
                    <input value={editProject?.priceFrom ?? newProject.priceFrom} onChange={(e) => editProject ? setEditProject({ ...editProject, priceFrom: e.target.value }) : setNewProject({ ...newProject, priceFrom: e.target.value })} placeholder="3,000,000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>السعر إلى (ر.س)</label>
                    <input value={editProject?.priceTo ?? newProject.priceTo} onChange={(e) => editProject ? setEditProject({ ...editProject, priceTo: e.target.value }) : setNewProject({ ...newProject, priceTo: e.target.value })} placeholder="3,500,000" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* الخريطة التفاعلية لاختيار الموقع داخل المودال */}
              <div>
                <label style={labelStyle}>حدّد موقع المشروع بدقة على الخريطة (اضغط لتغيير الدبوس):</label>
                <div style={{ height: "220px", width: "100%", borderRadius: "12px", overflow: "hidden", marginBottom: "8px", border: "1px solid #E5E7EB" }}>
                  <ProjectMapPicker
                    lat={Number(editProject?.lat ?? newProject.lat) || 24.7136}
                    lng={Number(editProject?.lng ?? newProject.lng) || 46.6753}
                    onSelect={(lat, lng, address) => {
                      if (editProject) {
                        setEditProject({ ...editProject, lat: String(lat), lng: String(lng), location: address || editProject.location });
                      } else {
                        setNewProject({ ...newProject, lat: String(lat), lng: String(lng), location: address || newProject.location });
                      }
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={labelStyle}>خط العرض (Lat)</label><input type="number" step="any" value={editProject?.lat ?? newProject.lat} style={inputStyle} readOnly /></div>
                <div><label style={labelStyle}>خط الطول (Lng)</label><input type="number" step="any" value={editProject?.lng ?? newProject.lng} style={inputStyle} readOnly /></div>
              </div>

              <div>
                <label style={labelStyle}>نسبة الإنجاز: {editProject?.progress ?? newProject.progress}%</label>
                <input type="range" min={0} max={100} value={editProject?.progress ?? newProject.progress} onChange={(e) => editProject ? setEditProject({ ...editProject, progress: Number(e.target.value) }) : setNewProject({ ...newProject, progress: e.target.value })} style={{ width: "100%", accentColor: "#16a34a" }} />
              </div>

              <div>
                <label style={labelStyle}>صور المشروع (يمكن رفع عدة صور)</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <input type="file" id="project-img-file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
                  <label htmlFor="project-img-file" style={{ background: "#F3F4F6", border: "1.5px dashed #D1D5DB", borderRadius: 10, padding: "10px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "inline-block", color: "#374151" }}>
                    {uploadingImage ? "⏳ جاري الرفع..." : "📁 ارفع صور المشروع"}
                  </label>
                </div>
                {(editProject?.images?.length > 0 || newProject.images?.length > 0) && (
                  <div>
                    <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }}>اضغط على صورة لجعلها صورة الغلاف</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                      {(editProject?.images || newProject.images || []).map((url: string, i: number) => {
                        const currentImg = editProject?.img ?? newProject.img;
                        const isCover = url === currentImg;
                        return (
                          <div key={i} onClick={() => editProject ? setEditProject({ ...editProject, img: url }) : setNewProject({ ...newProject, img: url })} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "1", cursor: "pointer", border: isCover ? "3px solid #16a34a" : "2px solid #E5E7EB" }}>
                            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            {isCover && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(22,163,74,0.85)", color: "#fff", fontSize: 9, fontWeight: 700, textAlign: "center", padding: "2px 0" }}>الغلاف</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* المرافق والخدمات */}
              <div>
                <label style={labelStyle}>المرافق والخدمات</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} placeholder="مثال: 🏊 مسبح" style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => {
                    if (e.key === 'Enter' && newAmenity) {
                      const list = editProject?.amenities ?? newProject.amenities;
                      if (editProject) setEditProject({ ...editProject, amenities: [...list, newAmenity] });
                      else setNewProject({ ...newProject, amenities: [...list, newAmenity] });
                      setNewAmenity('');
                    }
                  }} />
                  <button type="button" onClick={() => {
                    if (!newAmenity) return;
                    const list = editProject?.amenities ?? newProject.amenities;
                    if (editProject) setEditProject({ ...editProject, amenities: [...list, newAmenity] });
                    else setNewProject({ ...newProject, amenities: [...list, newAmenity] });
                    setNewAmenity('');
                  }} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ إضافة</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(editProject?.amenities ?? newProject.amenities).map((a: string, i: number) => (
                    <span key={i} style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      {a}
                      <button type="button" onClick={() => {
                        const list = (editProject?.amenities ?? newProject.amenities).filter((_: string, j: number) => j !== i);
                        if (editProject) setEditProject({ ...editProject, amenities: list });
                        else setNewProject({ ...newProject, amenities: list });
                      }} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontWeight: 900, fontSize: 14, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* أنواع الوحدات */}
              <div>
                <label style={labelStyle}>أنواع الوحدات المتاحة</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  <input value={newUnit.type} onChange={(e) => setNewUnit({...newUnit, type: e.target.value})} placeholder="نوع الوحدة" style={inputStyle} />
                  <input value={newUnit.area} onChange={(e) => setNewUnit({...newUnit, area: e.target.value})} placeholder="المساحة" style={inputStyle} />
                  <input value={newUnit.price} onChange={(e) => setNewUnit({...newUnit, price: e.target.value})} placeholder="السعر" style={inputStyle} />
                  <input value={newUnit.available} onChange={(e) => setNewUnit({...newUnit, available: e.target.value})} placeholder="المتاح" style={inputStyle} />
                  <button type="button" onClick={() => {
                    if (!newUnit.type) return;
                    const list = editProject?.unit_types ?? newProject.unit_types ?? [];
                    if (editProject) setEditProject({ ...editProject, unit_types: [...list, newUnit] });
                    else setNewProject({ ...newProject, unit_types: [...list, newUnit] });
                    setNewUnit({ type: '', area: '', price: '', available: '' });
                  }} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+</button>
                </div>
                {(editProject?.unit_types ?? newProject.unit_types ?? []).map((u: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8F9FB", borderRadius: 10, padding: "8px 12px", marginBottom: 6, fontSize: 12 }}>
                    <span style={{ fontWeight: 700 }}>{u.type}</span>
                    <span style={{ color: "#6B7280" }}>{u.area}</span>
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>{u.price} ر.س</span>
                    <span style={{ color: "#3B82F6" }}>{u.available} متاح</span>
                    <button type="button" onClick={() => {
                      const list = (editProject?.unit_types ?? newProject.unit_types).filter((_: any, j: number) => j !== i);
                      if (editProject) setEditProject({ ...editProject, unit_types: list });
                      else setNewProject({ ...newProject, unit_types: list });
                    }} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontWeight: 900 }}>×</button>
                  </div>
                ))}
              </div>

              <div>
                <label style={labelStyle}>لون الدبوس على الخريطة</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {pinColors.map(color => (
                    <button key={color} type="button" onClick={() => editProject ? setEditProject({ ...editProject, pinColor: color }) : setNewProject({ ...newProject, pinColor: color })} style={{ width: 36, height: 36, background: color, borderRadius: "50%", border: (editProject?.pinColor ?? newProject.pinColor) === color ? "3px solid #0f172a" : "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", cursor: "pointer" }} />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#FFFBEB", borderRadius: 14, border: "1px solid #FDE68A" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>⭐ مشروع مميز</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>يظهر في أعلى قائمة المشاريع</div>
                </div>
                <button type="button" onClick={() => editProject ? setEditProject({ ...editProject, featured: !editProject.featured }) : setNewProject({ ...newProject, featured: !newProject.featured })} style={{ width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer", position: "relative", background: (editProject?.featured ?? newProject.featured) ? "#16a34a" : "#D1D5DB", transition: "all 0.2s" }}>
                  <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, transition: "all 0.2s", right: (editProject?.featured ?? newProject.featured) ? 3 : "auto", left: (editProject?.featured ?? newProject.featured) ? "auto" : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (editProject) {
                      await supabase.from('projects').update({
                        name: editProject.name,
                        developer: editProject.developer,
                        location: editProject.location,
                        type: editProject.type,
                        status: editProject.status,
                        units: editProject.units,
                        price_from: editProject.priceFrom,
                        completion: editProject.completion,
                        progress: editProject.progress,
                        pin_color: editProject.pinColor,
                        featured: editProject.featured,
                        img: editProject.img,
                        latitude: Number(editProject.lat) || null,
                        longitude: Number(editProject.lng) || null,
                        description: editProject.description,
                        amenities: editProject.amenities,
                        floors: Number(editProject.floors) || 0,
                        area_from: editProject.areaFrom || editProject.area_from,
                        area_to: editProject.areaTo || editProject.area_to,
                        price_to: editProject.priceTo || editProject.price_to,
                        total_units: Number(editProject.totalUnits || editProject.total_units) || 0,
                        available_units: Number(editProject.availableUnits || editProject.available_units) || 0,
                        images: editProject.images || [],
                        unit_types: editProject.unit_types || [],
                        developer_phone: editProject.developerPhone || editProject.developer_phone,developer_email: editProject.developerEmail || editProject.developer_email,developer_member: editProject.developerMember || editProject.developer_member,
                      }).eq('id', editProject.id);
                      fetchProjects();
                      setShowModal(false); setEditProject(null);
                    } else { handleAdd(); }
                  }}
                  style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}
                >
                  {editProject ? "✅ حفظ التعديلات" : "✅ إضافة المشروع"}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditProject(null); }} style={{ flex: 1, background: "#F8F9FB", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}