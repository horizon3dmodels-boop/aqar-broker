"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

let mapboxgl: any;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
}

const CITIES_DATA: Record<string, { center: [number, number]; bbox: [number, number, number, number] }> = {
  "الرياض": { center: [46.6753, 24.7136], bbox: [46.4000, 24.4000, 47.0000, 25.0000] },
  "جدة": { center: [39.1925, 21.4858], bbox: [39.0000, 21.2000, 39.4000, 21.9000] },
  "مكة المكرمة": { center: [39.8579, 21.3891], bbox: [39.6000, 21.1000, 40.1000, 21.6000] },
  "المدينة المنورة": { center: [39.6142, 24.5247], bbox: [39.4000, 24.3000, 39.8000, 24.7000] },
  "الدمام": { center: [50.1033, 26.4207], bbox: [49.9000, 26.2000, 50.3000, 26.6000] },
  "الخبر": { center: [50.2083, 26.2172], bbox: [50.1000, 26.1000, 50.3000, 26.3500] },
  "تبوك": { center: [36.5550, 28.3838], bbox: [36.4000, 28.2000, 36.7000, 28.6000] },
  "أبها": { center: [42.5050, 18.2164], bbox: [42.3000, 18.0000, 42.7000, 18.4000] },
};

function MapPicker({ onSelect, city }: { onSelect: (lat: number, lng: number, address?: string) => void; city?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
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
      center: [46.6753, 24.7136],
      zoom: 13,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
    mapRef.current.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-left');
    
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      language: 'ar',
      countries: 'sa',
      placeholder: 'ابحث عن موقع، معلم، أو حي...',
    });
    geocoderRef.current = geocoder;
    mapRef.current.addControl(geocoder, 'top-right');
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
        .catch(() => onSelectRef.current(center.lat, center.lng));
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !city) return;
    const targetCity = CITIES_DATA[city];
    if (targetCity) {
      mapRef.current.flyTo({ center: targetCity.center, zoom: 13, essential: true });
      if (geocoderRef.current) {
        geocoderRef.current.setBbox(targetCity.bbox);
        geocoderRef.current.setProximity({ longitude: targetCity.center[0], latitude: targetCity.center[1] });
      }
    }
  }, [city]);

  return (
    <div style={{ position: "relative", borderRadius: 16, border: "2px solid #E5E7EB" }}>
      <div ref={containerRef} style={{ width: "100%", height: 380, borderRadius: 16 }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -100%)", zIndex: 10, pointerEvents: "none" }}>
        <div style={{ fontSize: 36, filter: moving ? "drop-shadow(0 8px 4px rgba(0,0,0,0.3))" : "drop-shadow(0 4px 2px rgba(0,0,0,0.3))", transform: moving ? "translateY(-8px)" : "translateY(0)", transition: "all 0.2s" }}>📍</div>
      </div>
      {address && (
        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, background: "rgba(255,255,255,0.97)", borderRadius: 10, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#374151", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", zIndex: 10, textAlign: "right" }}>
          📍 {address}
        </div>
      )}
    </div>
  );
}

const steps = ["نوع العقار", "التفاصيل", "الموقع", "الصور", "المراجعة"];

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [hasLicense, setHasLicense] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [propertyId, setPropertyId] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<{ url: string; path: string }[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    purpose: "بيع",
    type: "شقة",
    title: "",
    description: "",
    price: "",
    area: "",
    beds: "",
    baths: "",
    floor: "",
    age: "",
    city: "الرياض",
    district: "",
    address: "",
    regaNumber: "",
    falNumber: "",
    features: [] as string[],
    selectedPlan: "مجاني",
  });

  // جلب بيانات العقار وتعبئة النموذج تلقائياً
  useEffect(() => {
    const fetchProperty = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }

      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!data || data.user_id !== session.user.id) {
        router.push("/profile");
        return;
      }

      setPropertyId(data.id);
      
      if (data.latitude && data.longitude) {
        setSelectedLocation({ lat: data.latitude, lng: data.longitude });
      }

      setForm({
        purpose: data.purpose || "بيع",
        type: data.type || "شقة",
        title: data.title || "",
        description: data.description || "",
        price: data.price?.toString() || "",
        area: data.area?.toString() || "",
        beds: data.beds?.toString() || "",
        baths: data.baths?.toString() || "",
        floor: data.floor || "",
        age: data.age || "",
        city: data.city || "الرياض",
        district: data.district || "",
        address: data.address || "",
        regaNumber: data.rega_number || "",
        falNumber: data.fal_number || "",
        features: data.features || [],
        selectedPlan: data.plan || "مجاني",
      });

      if (data.images?.length > 0) {
        setUploadedImages(data.images.map((url: string) => ({ url, path: "" })));
      }

      setLoading(false);
    };
    fetchProperty();
  }, [params.id, router]);

  const allFeatures = ["مسبح", "حديقة", "مجلس مستقل", "غرفة سائق", "مطبخ راقي", "موقف سيارات", "كاميرات مراقبة", "تكييف مركزي", "إنترنت فايبر", "غرفة غسيل", "مصعد", "حارس أمن"];

  const toggleFeature = (f: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(f) ? prev.features.filter((x) => x !== f) : [...prev.features, f],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // رفع الصور لـ Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("يجب تسجيل الدخول أولاً"); return; }

    setUploading(true);
    setError("");

    const newImages: { url: string; path: string }[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`الصورة ${file.name} تتجاوز 5MB`);
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `properties/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setError("فشل رفع الصورة: " + uploadError.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("property-images")
        .getPublicUrl(path);

      newImages.push({ url: publicUrl, path });
    }

    setUploadedImages((prev) => [...prev, ...newImages]);
    setUploading(false);
  };

  const removeImage = async (index: number) => {
    const img = uploadedImages[index];
    if (img.path) {
      await supabase.storage.from("property-images").remove([img.path]);
    }
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // دالة حفظ وتحديث التعديلات (Update)
  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("يجب تسجيل الدخول أولاً");
      setSubmitting(false);
      return;
    }

    if (!form.title || !form.price || !form.area || !form.district) {
      setError("يرجى تعبئة جميع الحقول الإلزامية (العنوان، السعر، المساحة، الحي)");
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("properties")
      .update({
        purpose: form.purpose,
        type: form.type,
        title: form.title,
        description: form.description,
        price: parseFloat(form.price.toString().replace(/,/g, "")) || 0,
        area: parseFloat(form.area) || 0,
        beds: form.beds ? parseInt(form.beds) : null,
        baths: form.baths ? parseInt(form.baths) : null,
        floor: form.floor || null,
        age: form.age || null,
        city: form.city,
        district: form.district,
        address: form.address,
        rega_number: form.regaNumber || null,
        fal_number: form.falNumber || null,
        features: form.features,
        images: uploadedImages.map((i) => i.url),
        plan: form.selectedPlan,
        latitude: selectedLocation?.lat || null,
        longitude: selectedLocation?.lng || null,
      })
      .eq("id", propertyId);

    if (updateError) {
      setError("حدث خطأ أثناء تحديث البيانات: " + updateError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.push("/profile");
  };

  if (loading) return <div style={{textAlign:"center", padding:"100px", fontFamily:"Cairo", fontSize: "16px", fontWeight: 600}}>جاري التحميل...</div>;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; outline: none; }
        .type-btn { transition: all 0.2s; cursor: pointer; }
        .type-btn:hover { border-color: #16a34a !important; background: #f0fdf4 !important; }
        .feature-tag { transition: all 0.2s; cursor: pointer; }
        .feature-tag:hover { border-color: #16a34a !important; }
        .next-btn:hover { background: #15803d !important; }
        .next-btn { transition: all 0.2s; }
        .img-thumb:hover .remove-btn { opacity: 1 !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>✏️ تعديل الإعلان</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>قم بتعديل تفاصيل عقارك لتحديث بيانات الإعلان في المنصة</p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800,
                  background: i < currentStep ? "#16a34a" : i === currentStep ? "#16a34a" : "#E5E7EB",
                  color: i <= currentStep ? "#fff" : "#9CA3AF",
                  boxShadow: i === currentStep ? "0 0 0 4px rgba(22,163,74,0.2)" : "none",
                }}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: i === currentStep ? "#16a34a" : "#9CA3AF", whiteSpace: "nowrap" }}>{step}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < currentStep ? "#16a34a" : "#E5E7EB", margin: "0 8px", marginBottom: 20 }} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#FFF5F5", border: "1.5px solid #FECACA", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#EF4444", fontSize: 13, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Card Forms */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #F0F0F0" }}>

          {/* Step 1: نوع العقار */}
          {currentStep === 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>ما نوع العقار؟</h2>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>الغرض من الإعلان</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["بيع", "إيجار", "إيجار يومي"].map((p) => (
                    <button key={p} onClick={() => setForm({ ...form, purpose: p })} className="type-btn" style={{
                      flex: 1, padding: "14px", border: "2px solid", borderColor: form.purpose === p ? "#16a34a" : "#E5E7EB",
                      borderRadius: 14, fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: 700,
                      background: form.purpose === p ? "#f0fdf4" : "#fff", color: form.purpose === p ? "#16a34a" : "#374151",
                    }}>
                      {p === "بيع" ? "🏷️" : p === "إيجار" ? "🔑" : "📅"} {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>نوع العقار</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "شقة", icon: "🏢" }, { label: "فيلا", icon: "🏡" }, { label: "دوبلكس", icon: "🏘️" },
                    { label: "أرض", icon: "🏗️" }, { label: "مكتب", icon: "💼" }, { label: "محل تجاري", icon: "🏪" },
                    { label: "استراحة", icon: "🌴" }, { label: "مستودع", icon: "🏭" }, { label: "عمارة", icon: "🏬" },
                  ].map((t) => (
                    <button key={t.label} onClick={() => setForm({ ...form, type: t.label })} className="type-btn" style={{
                      padding: "16px 10px", border: "2px solid", borderColor: form.type === t.label ? "#16a34a" : "#E5E7EB",
                      borderRadius: 14, fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700,
                      background: form.type === t.label ? "#f0fdf4" : "#fff", color: form.type === t.label ? "#16a34a" : "#374151",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ fontSize: 28 }}>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: التفاصيل */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>تفاصيل العقار</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>عنوان الإعلان <span style={{ color: "#EF4444" }}>*</span></label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="مثال: فيلا فاخرة للبيع في حي النرجس" style={inputStyle} />
                </div>

                <div style={{ padding: 18, background: "#F8F9FB", borderRadius: 16, border: "1px solid #EAECF0" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>التوثيق القانوني (الهيئة العامة للعقار)</h3>
                  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <button onClick={() => setHasLicense(true)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1.5px solid", borderColor: hasLicense ? "#16a34a" : "#E5E7EB", background: hasLicense ? "#f0fdf4" : "#fff", color: hasLicense ? "#16a34a" : "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      لدي رخصة إعلان
                    </button>
                    <button onClick={() => setHasLicense(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1.5px solid", borderColor: !hasLicense ? "#16a34a" : "#E5E7EB", background: !hasLicense ? "#f0fdf4" : "#fff", color: !hasLicense ? "#16a34a" : "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      إصدار آلي (للمشتركين)
                    </button>
                  </div>
                  {hasLicense ? (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>رقم رخصة الإعلان <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="regaNumber" value={form.regaNumber} onChange={handleChange} placeholder="مثال: 7100000000" style={inputStyle} />
                    </div>
                  ) : (
                    <div style={{ marginBottom: 14, padding: 12, background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", fontWeight: 600 }}>
                      ℹ️ سيتم إصدار الرخصة آلياً من الهيئة فور إتمام عملية النشر.
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>رقم رخصة فال (للمسوقين)</label>
                    <input name="falNumber" value={form.falNumber} onChange={handleChange} placeholder="اختياري للمُلاك" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>وصف العقار <span style={{ color: "#EF4444" }}>*</span></label>
                  <textarea name="description" value={form.description} onChange={handleChange} placeholder="اكتب وصفاً تفصيلياً للعقار..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>السعر (ر.س) <span style={{ color: "#EF4444" }}>*</span></label>
                    <input name="price" value={form.price} onChange={handleChange} placeholder="1,500,000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>المساحة (م²) <span style={{ color: "#EF4444" }}>*</span></label>
                    <input name="area" value={form.area} onChange={handleChange} placeholder="350" style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                  {[
                    { label: "غرف النوم", name: "beds", options: ["", "1", "2", "3", "4", "5", "6", "7+"] },
                    { label: "الحمامات", name: "baths", options: ["", "1", "2", "3", "4", "5+"] },
                    { label: "الدور", name: "floor", options: ["", "أرضي", "1", "2", "3", "4", "5+"] },
                    { label: "عمر العقار", name: "age", options: ["", "جديد", "1-3", "3-5", "5-10", "+10"] },
                  ].map((f) => (
                    <div key={f.name}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>{f.label}</label>
                      <select name={f.name} value={(form as any)[f.name]} onChange={handleChange} style={inputStyle}>
                        {f.options.map((n) => <option key={n}>{n || "اختر"}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>المميزات والمرافق</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {allFeatures.map((f) => (
                      <button key={f} onClick={() => toggleFeature(f)} className="feature-tag" style={{
                        padding: "8px 16px", borderRadius: 20, border: "1.5px solid",
                        borderColor: form.features.includes(f) ? "#16a34a" : "#E5E7EB",
                        background: form.features.includes(f) ? "#f0fdf4" : "#fff",
                        color: form.features.includes(f) ? "#16a34a" : "#374151",
                        fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif",
                      }}>
                        {form.features.includes(f) ? "✓ " : ""}{f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: الموقع */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>موقع العقار</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>المدينة <span style={{ color: "#EF4444" }}>*</span></label>
                  <select name="city" value={form.city} onChange={handleChange} style={inputStyle}>
                    {["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "تبوك", "أبها"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>الحي <span style={{ color: "#EF4444" }}>*</span></label>
                  <input name="district" value={form.district} onChange={handleChange} placeholder="مثال: حي النرجس" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>العنوان التفصيلي</label>
                  <input name="address" value={form.address} onChange={handleChange} placeholder="الشارع، رقم المبنى..." style={inputStyle} />
                </div>
                {selectedLocation && (
                  <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                    ✅ تم تحديد الموقع — {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                  </div>
                )}
                <MapPicker
                  onSelect={(lat, lng, addressText) => {
                    setSelectedLocation({ lat, lng });
                    if (addressText) setForm(prev => ({ ...prev, address: addressText, district: addressText }));
                  }}
                  city={form.city}
                />
              </div>
            </div>
          )}

          {/* Step 4: الصور */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>صور العقار</h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>أضف صوراً واضحة لزيادة فرص البيع (الحد الأقصى 20 صورة)</p>

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: "2px dashed #D1FAE5", borderRadius: 20, padding: "48px 24px", textAlign: "center", background: "#F0FDF4", cursor: "pointer", marginBottom: 20, opacity: uploading ? 0.7 : 1 }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>{uploading ? "⏳" : "📸"}</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>
                  {uploading ? "جاري الرفع..." : "اسحب الصور هنا أو اضغط للرفع"}
                </p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>PNG, JPG, WEBP — الحد الأقصى 5MB لكل صورة</p>
                {!uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ marginTop: 16, background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                  >
                    اختر الصور
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />

              {uploadedImages.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="img-thumb" style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "1", border: "2px solid #BBF7D0" }}>
                      <img src={img.url} alt={`صورة ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        className="remove-btn"
                        onClick={() => removeImage(i)}
                        style={{ position: "absolute", top: 6, left: 6, width: 24, height: 24, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: "50%", color: "#fff", fontSize: 14, cursor: "pointer", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}
                      >
                        ×
                      </button>
                      {i === 0 && (
                        <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, background: "rgba(22,163,74,0.85)", color: "#fff", fontSize: 10, fontWeight: 700, textAlign: "center", padding: "3px 0" }}>
                          الصورة الرئيسية
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: المراجعة */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>مراجعة الإعلان</h2>
              <div style={{ background: "#F8F9FB", borderRadius: 16, padding: "20px", marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "نوع الإعلان", value: form.purpose },
                    { label: "نوع العقار", value: form.type },
                    { label: "العنوان", value: form.title || "—" },
                    { label: "السعر", value: form.price ? `${Number(form.price).toLocaleString()} ر.س` : "—" },
                    { label: "المساحة", value: form.area ? `${form.area} م²` : "—" },
                    { label: "المدينة والحي", value: form.district ? `${form.city} - ${form.district}` : form.city },
                    { label: "الصور", value: `${uploadedImages.length} صورة` },
                    { label: "رخصة الإعلان", value: hasLicense ? (form.regaNumber || "—") : "سيتم الإصدار آلياً" },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px" }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>اختر باقة النشر</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { name: "مجاني", price: "0", features: ["30 يوم", "5 صور", "ظهور عادي"], color: "#6B7280", bg: "#F9FAFB" },
                    { name: "مميز", price: "99", features: ["90 يوم", "20 صورة", "ظهور مميز", "شارة مميز"], color: "#16a34a", bg: "#F0FDF4", recommended: true },
                    { name: "بريميم", price: "199", features: ["180 يوم", "30 صورة", "أعلى النتائج", "AI تحليل", "واتساب مباشر"], color: "#7C3AED", bg: "#F5F3FF" },
                  ].map((pkg) => (
                    <div
                      key={pkg.name}
                      onClick={() => setForm({ ...form, selectedPlan: pkg.name })}
                      style={{ border: `2px solid`, borderColor: form.selectedPlan === pkg.name ? pkg.color : "#E5E7EB", borderRadius: 16, padding: "18px", background: form.selectedPlan === pkg.name ? pkg.bg : "#fff", position: "relative", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      {pkg.recommended && (
                        <div style={{ position: "absolute", top: -10, right: 16, background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>الأكثر طلباً</div>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 800, color: pkg.color, marginBottom: 6 }}>{pkg.name}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
                        {pkg.price === "0" ? "مجاناً" : `${pkg.price} ر.س`}
                      </div>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                        {pkg.features.map((f, j) => (
                          <li key={j} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: pkg.color }}>✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              style={{ padding: "12px 28px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "#fff", color: "#374151", cursor: currentStep === 0 ? "not-allowed" : "pointer", fontFamily: "'Cairo', sans-serif", opacity: currentStep === 0 ? 0.4 : 1 }}
            >
              ← السابق
            </button>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {steps.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === currentStep ? "#16a34a" : "#E5E7EB", transition: "all 0.2s" }} />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <button className="next-btn" onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} style={{ padding: "12px 28px", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "#16a34a", color: "#fff", cursor: "pointer", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
                التالي ←
              </button>
            ) : (
              <button
                className="next-btn"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: "12px 28px", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, background: submitting ? "#86efac" : "#16a34a", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Cairo', sans-serif", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}
              >
                {submitting ? "جاري الحفظ..." : "حفظ التعديلات ✅"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  border: "1.5px solid #E5E7EB",
  borderRadius: 12,
  padding: "13px 14px",
  fontSize: 13,
  fontFamily: "'Cairo', sans-serif",
  color: "#374151",
  background: "#FAFAFA",
};