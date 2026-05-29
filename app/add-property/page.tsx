"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import 'mapbox-gl/dist/mapbox-gl.css';
import { getLocationByIP } from "@/lib/getLocationByIP";

// استيراد مكتبة البحث الجغرافي المتقدم (Geocoder) وتصاميمها
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const steps = ["نوع العقار", "التفاصيل", "الموقع", "الصور", "المراجعة"];

let mapboxgl: any;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
}

// مصفوفة البيانات الجغرافية الصارمة للمدن (المركز + حدود المدينة المربعة لمنع تشتت البحث)
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

// ── 1. مكون خريطة تحديد الموقع المطور والمقيد جغرافيا بالمدينة (MapPicker) ──
function MapPicker({ onSelect, city }: { onSelect: (lat: number, lng: number, address?: string) => void; city?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null); // مرجع للتحكم بصندوق البحث ديناميكياً
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
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-left'
    );

    // إنشاء صندوق البحث وتصحيح الكود لـ countries لحظر نتائج خارج السعودية
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      language: 'ar',
      countries: 'sa', // حظر قاطع لأي دولة أخرى
      placeholder: 'ابحث عن موقع، معلم، أو حي...',
    });
    
    geocoderRef.current = geocoder;
    mapRef.current.addControl(geocoder, 'top-right');

    mapRef.current.on('load', () => {
      try {
        const style = mapRef.current.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer: any) => {
            if (layer.layout && layer.layout['text-field']) {
              mapRef.current.setLayoutProperty(layer.id, 'text-field', [
                'coalesce',
                ['get', 'name_ar'], 
                ['get', 'name']     
              ]);
            }
          });
        }
      } catch (e) {}

      getLocationByIP().then((loc) => {
        if (loc && loc.latitude && loc.longitude) {
          mapRef.current?.flyTo({ center: [loc.longitude, loc.latitude], zoom: 14 });
        }
      }).catch(() => {});

      const center = mapRef.current.getCenter();
      onSelectRef.current(center.lat, center.lng);
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
        .catch(() => onSelectRef.current(center.lat, center.lng));
    });

  }, []);

  // مراقبة تغيير منسدلة المدن: لتحديث الطيران وتقييد صندوق البحث بالـ Bounding Box للمدينة فوراً
  useEffect(() => {
    if (!mapRef.current || !city) return;

    const targetCity = CITIES_DATA[city];
    if (targetCity) {
      // 1. نقل الكاميرا للمدينة المحددة
      mapRef.current.flyTo({ center: targetCity.center, zoom: 13, essential: true });
      
      // 2. تحديث قيود صندوق البحث (Geocoder) ليحظر أي نتائج خارج حدود هذه المدينة
      if (geocoderRef.current) {
        geocoderRef.current.setBbox(targetCity.bbox); // حصر جيوكودر البحث بالمدينة الحالية
        geocoderRef.current.setProximity({
          longitude: targetCity.center[0],
          latitude: targetCity.center[1]
        });
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

// ── 2. المكون الرئيسي الشامل لصفحة إضافة العقار الاحترافية ──
export default function AddPropertyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasLicense, setHasLicense] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; path: string }[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number} | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const [form, setForm] = useState({
    purpose: "بيع", type: "شقة", title: "", description: "", price: "", area: "", beds: "", baths: "",
    floor: "", age: "", city: "الرياض", district: "", address: "", regaNumber: "", falNumber: "",
    features: [] as string[], selectedPlan: "مجاني", latitude: null as number | null, longitude: null as number | null,
    rentPeriod: "سنوي", rentInsurance: "", includesUtilities: "لا",
    tourismLicense: "", weekendPrice: "", maxCapacity: "", checkInTime: "14:00", checkOutTime: "12:00", cancellationPolicy: "مرن", securityDeposit: ""
  });

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

  // دالة ضغط الصور التلقائي قبل الرفع للحفاظ على جودة الأداء ومساحة التخزين
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("يجب تسجيل الدخول أولاً"); return; }

    setUploading(true);
    setUploadProgress(15); 
    setError("");

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 5 : prev));
    }, 150);

    const newImages: { url: string; path: string }[] = [];

    for (let file of Array.from(files)) {
      // تطبيق الضغط التلقائي على الصورة الحالية
      file = await compressImage(file);

      if (file.size > 5 * 1024 * 1024) { setError(`الصورة ${file.name} تتجاوز 5MB`); continue; }
      const ext = file.name.split(".").pop();
      const path = `properties/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) { setError("فشل رفع الصورة: " + uploadError.message); continue; }

      const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);
      newImages.push({ url: publicUrl, path });
    }

    clearInterval(progressInterval);
    setUploadProgress(100); 

    setTimeout(() => {
      setUploadedImages((prev) => [...prev, ...newImages]);
      setUploading(false);
      setUploadProgress(0);
    }, 400);
  };

  const removeImage = async (index: number) => {
    const img = uploadedImages[index];
    await supabase.storage.from("property-images").remove([img.path]);
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setAsCover = (index: number) => {
    setUploadedImages((prev) => {
      const updated = [...prev];
      const selectedImg = updated.splice(index, 1)[0];
      updated.unshift(selectedImg); 
      return updated;
    });
  };

  // آلية الحفظ التلقائي كمسودة (Auto-Save) عند الانتقال بين الخطوات
  const autoSaveDraft = async (nextStepIndex: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      user_id: session.user.id,
      purpose: form.purpose,
      type: form.type,
      title: form.title || `مسودة غير مكتملة - خطوة ${currentStep + 1}`,
      description: form.description,
      price: form.price ? parseFloat(form.price.replace(/,/g, "")) : 0,
      area: form.area ? parseFloat(form.area) : 0,
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
      status: "draft", 
      latitude: selectedLocation?.lat || null,
      longitude: selectedLocation?.lng || null,
      meta_data: {
        rent_period: form.rentPeriod, rent_insurance: form.rentInsurance, includes_utilities: form.includesUtilities,
        tourism_license: form.tourismLicense, weekend_price: form.weekendPrice, max_capacity: form.maxCapacity,
        check_in: form.checkInTime, check_out: form.checkOutTime, cancellation: form.cancellationPolicy, security_deposit: form.securityDeposit
      }
    };

    if (propertyId) {
      await supabase.from("properties").update(payload).eq("id", propertyId);
    } else {
      const { data } = await supabase.from("properties").insert(payload).select("id").single();
      if (data) setPropertyId(data.id);
    }
    setCurrentStep(nextStepIndex);
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("يجب تسجيل الدخول أولاً"); setSubmitting(false); return; }
    if (!form.title || !form.price || !form.area) { setError("يرجى تعبئة جميع الحقول الإلزامية (العنوان، السعر، المساحة)"); setSubmitting(false); return; }

    const propertyData = {
      user_id: session.user.id,
      purpose: form.purpose,
      type: form.type,
      title: form.title,
      description: form.description,
      price: parseFloat(form.price.replace(/,/g, "")) || 0,
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
      status: "active", 
      latitude: selectedLocation?.lat || null,   
      longitude: selectedLocation?.lng || null, 
    };

    if (propertyId) {
      const { error: updateError } = await supabase.from("properties").update(propertyData).eq("id", propertyId);
      if (updateError) { setError("حدث خطأ أثناء النشر: " + updateError.message); setSubmitting(false); return; }
    } else {
      const { error: insertError } = await supabase.from("properties").insert(propertyData);
      if (insertError) { setError("حدث خطأ أثناء النشر: " + insertError.message); setSubmitting(false); return; }
    }

    setSubmitting(false);
    router.push("/add-property/success");
  };

  const handleMapSelect = useCallback((lat: number, lng: number, addressText?: string) => {
    setSelectedLocation({ lat, lng });
    if (addressText) {
      setForm(prev => ({ ...prev, address: addressText, district: addressText }));
    }
  }, []);

  const inputStyle = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "13px 14px", fontSize: 13, fontFamily: "'Cairo', sans-serif", color: "#374151", background: "#FAFAFA" };
  const labelStyle = { fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 } as React.CSSProperties;

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", minHeight: "100vh", background: "#F8F9FB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.1) !important; outline: none; }
        .type-btn { transition: all 0.2s; cursor: pointer; display: flex; flexDirection: column; alignItems: center; gap: 8; }
        .type-btn:hover { border-color: #16a34a !important; background: #f0fdf4 !important; }
        .img-thumb:hover .remove-btn { opacity: 1 !important; }
        .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-logo { display: none !important; }
        .mapboxgl-ctrl-geocoder { font-family: 'Cairo', sans-serif !important; border-radius: 12px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; border: 1px solid #E5E7EB !important; z-index: 5555 !important; }
        .mapboxgl-ctrl-geocoder--input { font-family: 'Cairo', sans-serif !important; padding: 10px 35px 10px 10px !important; }
        .feature-tag { transition: all 0.2s; cursor: pointer; padding: 8px 16px; border-radius: 20px; border: 1.5px solid #E5E7EB; background: #fff; font-size: 13px; font-weight: 600; font-family: 'Cairo', sans-serif; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>➕ إضافة إعلان عقاري</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>أضف إعلانك في دقائق وتواصل مع آلاف المشترين</p>
        </div>

        {/* Steps Tracker */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, background: i <= currentStep ? "#16a34a" : "#E5E7EB", color: i <= currentStep ? "#fff" : "#9CA3AF" }}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: i === currentStep ? "#16a34a" : "#9CA3AF", whiteSpace: "nowrap" }}>{step}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < currentStep ? "#16a34a" : "#E5E7EB", margin: "0 8px", marginBottom: 20 }} />}
            </div>
          ))}
        </div>

        {error && <div style={{ background: "#FFF5F5", border: "1.5px solid #FECACA", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#EF4444", fontSize: 13, fontWeight: 600 }}>⚠️ {error}</div>}

        <div style={{ background: "#fff", borderRadius: 24, padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #F0F0F0" }}>

          {/* ── Step 1: نوع العقار والغرض ── */}
          {currentStep === 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>ما نوع العقار?</h2>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>الغرض من الإعلان</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["بيع", "إيجار", "إيجار يومي"].map((p) => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, purpose: p })} style={{ flex: 1, padding: "14px", border: "2px solid", borderColor: form.purpose === p ? "#16a34a" : "#E5E7EB", borderRadius: 14, fontFamily: "'Cairo'", fontSize: 14, fontWeight: 700, background: form.purpose === p ? "#f0fdf4" : "#fff", color: form.purpose === p ? "#16a34a" : "#374151", cursor:"pointer" }}>
                      {p === "بيع" ? "🏷️ " : p === "إيجار" ? "🔑 " : "📅 "}{p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>نوع العقار</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "شقة", icon: "🏢" }, { label: "فيلا", icon: "🏡" }, { label: "دوبلكس", icon: "🏘️" },
                    { label: "أرض", icon: "🏗️" }, { label: "مكتب", icon: "💼" }, { label: "محل تجاري", icon: "🏪" },
                    { label: "استراحة", icon: "🌴" }, { label: "مستودع", icon: "🏭" }, { label: "عمارة", icon: "🏬" },
                    { label: "أخرى", icon: "🔍" },
                  ].map((t) => (
                    <button key={t.label} type="button" onClick={() => setForm({ ...form, type: t.label })} className="type-btn" style={{ padding: "16px 10px", border: "2px solid", borderColor: form.type === t.label ? "#16a34a" : "#E5E7EB", borderRadius: 14, fontFamily: "'Cairo'", fontSize: 13, fontWeight: 700, background: form.type === t.label ? "#f0fdf4" : "#fff", color: form.type === t.label ? "#16a34a" : "#374151", cursor:"pointer" }}>
                      <span style={{ fontSize: 28 }}>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: تفاصيل الإعلان الحية ── */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>تفاصيل العقار وعناصر التوثيق</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                <div>
                  <label style={labelStyle}>عنوان الإعلان <span style={{ color: "#EF4444" }}>*</span></label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="مثال: فيلا فاخرة للبيع في حي النرجس" style={inputStyle} />
                </div>

                {form.purpose === "إيجار يومي" ? (
                  <div style={{ padding: 18, background: "#F5F3FF", borderRadius: 16, border: "1px solid #DDD6FE" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#7C3AED", marginBottom: 12 }}>التراخيص السياحية (وزارة السياحة / بلدي)</h3>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ ...labelStyle, fontSize: 12 }}>رقم ترخيص الإيواء السياحي / مرافق الضيافة <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="tourismLicense" value={form.tourismLicense} onChange={handleChange} placeholder="أدخل رقم الترخيص السياحي المعتمد" style={inputStyle} />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 18, background: "#F8F9FB", borderRadius: 16, border: "1px solid #EAECF0" }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>التوثيق القانوني (الهيئة العامة للعقار)</h3>
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                      <button onClick={() => setHasLicense(true)} type="button" style={{ flex: 1, padding: 12, borderRadius: 12, border: "1.5px solid", borderColor: hasLicense ? "#16a34a" : "#E5E7EB", background: hasLicense ? "#f0fdf4" : "#fff", color: hasLicense ? "#16a34a" : "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>لدي رخصة إعلان</button>
                      <button onClick={() => setHasLicense(false)} type="button" style={{ flex: 1, padding: 12, borderRadius: 12, border: "1.5px solid", borderColor: !hasLicense ? "#16a34a" : "#E5E7EB", background: !hasLicense ? "#f0fdf4" : "#fff", color: !hasLicense ? "#16a34a" : "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>إصدار آلي (للمشتركين)</button>
                    </div>
                    {hasLicense ? (
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ ...labelStyle, fontSize: 12 }}>رقم رخصة الإعلان العقاري <span style={{ color: "#EF4444" }}>*</span></label>
                        <input name="regaNumber" value={form.regaNumber} onChange={handleChange} placeholder="مثال: 7100000000" style={inputStyle} />
                      </div>
                    ) : (
                      <div style={{ marginBottom: 14, padding: 12, background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", fontWeight: 600 }}>ℹ️ سيتم إصدار الرخصة آلياً من الهيئة فور إتمام عملية النشر.</div>
                    )}
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>رقم رخصة فال العقارية (للمسوقين والمكاتب)</label>
                      <input name="falNumber" value={form.falNumber} onChange={handleChange} placeholder="اختياري للمُلاك المستقلين" style={inputStyle} />
                    </div>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>وصف العقار التفصيلي <span style={{ color: "#EF4444" }}>*</span></label>
                  <textarea name="description" value={form.description} onChange={handleChange} placeholder="اكتب وصفاً تفصيلياً شاملاً ومميزات العقار البارزة..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                {form.purpose === "إيجار يومي" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>السعر في الأيام العادية / ليلة <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="price" value={form.price} onChange={handleChange} placeholder="مثال: 500" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>السعر في الويكند / ليلة <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="weekendPrice" value={form.weekendPrice} onChange={handleChange} placeholder="مثال: 800" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>المساحة الكلية (م²) <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="area" value={form.area} onChange={handleChange} placeholder="350" style={inputStyle} />
                    </div>
                  </div>
                ) : form.purpose === "إيجار" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>قيمة الإيجار (ر.س) <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="price" value={form.price} onChange={handleChange} placeholder="25,000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>دورية الدفع <span style={{ color: "#EF4444" }}>*</span></label>
                      <select name="rentPeriod" value={form.rentPeriod} onChange={handleChange} style={inputStyle}>
                        <option value="شهري">شهري</option>
                        <option value="ربع سنوي">كل 3 أشهر</option>
                        <option value="نصف سنوي">كل 6 أشهر</option>
                        <option value="سنوي">سنوي</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>المساحة (م²) <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="area" value={form.area} onChange={handleChange} placeholder="120" style={inputStyle} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>السعر الإجمالي للعقار (ر.س) <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="price" value={form.price} onChange={handleChange} placeholder="1,500,000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>المساحة الإجمالية (م²) <span style={{ color: "#EF4444" }}>*</span></label>
                      <input name="area" value={form.area} onChange={handleChange} placeholder="350" style={inputStyle} />
                    </div>
                  </div>
                )}

                {form.purpose === "إيجار يومي" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, padding: 14, background: "#F8F9FB", borderRadius: 12 }}>
                    <div>
                      <label style={labelStyle}>السعة القصوى (أفراد)</label>
                      <input name="maxCapacity" value={form.maxCapacity} onChange={handleChange} placeholder="مثال: 15" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>تأمين الأضرار المسترد</label>
                      <input name="securityDeposit" value={form.securityDeposit} onChange={handleChange} placeholder="مثال: 500" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>سياسة الإلغاء</label>
                      <select name="cancellationPolicy" value={form.cancellationPolicy} onChange={handleChange} style={inputStyle}>
                        <option value="مرن">مرن (استرداد كامل)</option>
                        <option value="متوسط">متوسط</option>
                        <option value="صارم">صارم (لا يوجد استرداد)</option>
                      </select>
                    </div>
                  </div>
                )}

                {form.purpose === "إيجار" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14, background: "#F8F9FB", borderRadius: 12 }}>
                    <div>
                      <label style={labelStyle}>مبلغ التأمين المسترد (ر.س)</label>
                      <input name="rentInsurance" value={form.rentInsurance} onChange={handleChange} placeholder="مثال: 2000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>هل الإيجار يشمل الخدمات (الكهرباء والماء)؟</label>
                      <select name="includesUtilities" value={form.includesUtilities} onChange={handleChange} style={inputStyle}>
                        <option value="لا">لا، لا يشمل</option>
                        <option value="نعم">نعم، شامل كافة الفواتير</option>
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                  {[
                    { label: "غرف النوم", name: "beds", options: ["", "1", "2", "3", "4", "5", "6", "7+"] },
                    { label: "الحمامات", name: "baths", options: ["", "1", "2", "3", "4", "5+"] },
                    { label: "الدور", name: "floor", options: ["", "أرضي", "1", "2", "3", "4", "5+"] },
                    { label: "عمر العقار", name: "age", options: ["", "جديد", "1-3", "3-5", "5-10", "+10"] },
                  ].map((f) => (
                    <div key={f.name}>
                      <label style={labelStyle}>{f.label}</label>
                      <select name={f.name} value={(form as any)[f.name]} onChange={handleChange} style={inputStyle}>
                        {f.options.map((n) => <option key={n}>{n || "اختر"}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div>
                  <label style={labelStyle}>المميزات والمرافق المتاحة</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {allFeatures.map((f) => (
                      <button key={f} type="button" onClick={() => toggleFeature(f)} className="feature-tag" style={{ borderColor: form.features.includes(f) ? "#16a34a" : "#E5E7EB", background: form.features.includes(f) ? "#f0fdf4" : "#fff", color: form.features.includes(f) ? "#16a34a" : "#374151" }}>
                        {form.features.includes(f) ? "✓ " : ""}{f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: الموقع الجغرافي ── */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>موقع العقار</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>المدينة <span style={{ color: "#EF4444" }}>*</span></label>
                  <select name="city" value={form.city} onChange={handleChange} style={inputStyle}>
                    {["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "تبوك", "أبها"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>العنوان التفصيلي والحي (يُحَدَّث آلياً من الخريطة)</label>
                  <input name="address" value={form.address} onChange={handleChange} placeholder="سيتم ملء هذا الحقل تلقائياً عند تحديد موقعك..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>حدد موقع العقار الجغرافي على الخريطة بدقة</label>
                  {selectedLocation && (
                    <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                      ✅ تم تحديد الإحداثيات الحية — {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                    </div>
                  )}
                  <MapPicker onSelect={handleMapSelect} city={form.city} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: الصور، بار التحميل، والتحكم بالغلاف المباشر ── */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>صور ومعارض العقار</h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>ارفع صور عقارك الحقيقية، واضغط يدويًا على خيار "تعيين كغلاف" لتحديد واجهة الإعلان</p>

              {uploading && (
                <div style={{ marginBottom: 22, background: "#fff", borderRadius: 14, padding: "14px", border: "1.5px solid #BBF7D0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>
                    <span>⏳ جاري رفع ومعالجة الصور إلى السيرفر...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: "100%", background: "#E5E7EB", borderRadius: 10, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${uploadProgress}%`, background: "#16a34a", height: "100%", transition: "width 0.2s ease-out" }} />
                  </div>
                </div>
              )}

              <div onClick={() => !uploading && fileInputRef.current?.click()} style={{ border: "2px dashed #D1FAE5", borderRadius: 20, padding: "48px 24px", textAlign: "center", background: "#F0FDF4", cursor: uploading ? "not-allowed" : "pointer", marginBottom: 20, opacity: uploading ? 0.6 : 1 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#16a34a" }}>اسحب الصور هنا أو اضغط للرفع</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>PNG, JPG, WEBP — الحد الأقصى 5MB لكل صورة</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} style={{ display: "none" }} />

              {uploadedImages.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="img-thumb" style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "1", border: i === 0 ? "3px solid #16a34a" : "2px solid #E5E7EB", boxShadow: i === 0 ? "0 4px 12px rgba(22,163,74,0.2)" : "none" }}>
                      <img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={() => removeImage(i)} style={{ position: "absolute", top: 6, left: 6, width: 24, height: 24, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, zIndex: 12 }}>×</button>
                      
                      {i === 0 ? (
                        <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, textAlign: "center", padding: "5px 0", zIndex: 11 }}>⭐ الغلاف الحالي</div>
                      ) : (
                        <button type="button" onClick={() => setAsCover(i)} style={{ position: "absolute", bottom: 0, right: 0, left: 0, background: "rgba(15,23,42,0.85)", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, textAlign: "center", padding: "6px 0", cursor: "pointer", zIndex: 11, fontFamily: "'Cairo'" }}>🖼️ تعيين كغلاف</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: المراجعة النهائية واختيار باقات النشر ── */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>مراجعة الإعلان وباقات النشر</h2>
              <div style={{ background: "#F8F9FB", borderRadius: 16, padding: "20px", marginBottom: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "الغرض من الإعلان", value: form.purpose }, { label: "نوع ومرفق العقار", value: form.type },
                    { label: "العنوان الرئيسي", value: form.title || "—" }, { label: "القيمة المالية المحددة", value: form.price ? `${form.price} ر.س` : "—" },
                    { label: "المساحة المستغلة", value: form.area ? `${form.area} م²` : "—" }, { label: "المدينة والحي الموثق", value: form.address || form.city },
                    { label: "إجمالي الصور المرفوعة", value: `${uploadedImages.length} صورة حية` }, { label: "التوثيق القانوني والتراخيص", value: form.purpose === "إيجار يومي" ? (form.tourismLicense ? `رقم ترخيص سياحي: ${form.tourismLicense}` : "لم يدخل") : (hasLicense ? (form.regaNumber || "—") : "سيتم الإصدار آلياً") },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px" }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>اختر باقة النشر המخصصة لعقارك</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { name: "مجاني", price: "0", features: ["30 يوم", "5 صور", "ظهور عادي"], color: "#6B7280", bg: "#F9FAFB" },
                    { name: "مميز", price: "99", features: ["90 يوم", "20 صورة", "ظهور مميز", "شارة مميز"], color: "#16a34a", bg: "#F0FDF4", recommended: true },
                    { name: "بريميم", price: "199", features: ["180 يوم", "30 صورة", "أعلى النتائج", "AI تحليل", "واتساب مباشر"], color: "#7C3AED", bg: "#F5F3FF" },
                  ].map((pkg) => (
                    <div key={pkg.name} onClick={() => setForm({ ...form, selectedPlan: pkg.name })} style={{ border: "2px solid", borderColor: form.selectedPlan === pkg.name ? pkg.color : "#E5E7EB", borderRadius: 16, padding: "18px", background: form.selectedPlan === pkg.name ? pkg.bg : "#fff", position: "relative", cursor: "pointer" }}>
                      {pkg.recommended && <div style={{ position: "absolute", top: -10, right: 16, background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>الأكثر طلباً</div>}
                      <div style={{ fontSize: 15, fontWeight: 800, color: pkg.color, marginBottom: 6 }}>{pkg.name}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>{pkg.price === "0" ? "مجاناً" : `${pkg.price} ر.س`}</div>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                        {pkg.features.map((f, j) => <li key={j}>✓ {f}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* هل تريد إضافة Reel؟ */}
              <div style={{ marginTop: 24, background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", borderRadius: 16, padding: "20px 24px", border: "1.5px solid #86EFAC" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 36 }}>🎬</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#052e16", marginBottom: 4 }}>هل تريد إضافة مقطع فيديو Reel؟</h3>
                    <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>أضف فيديو قصير لعقارك لزيادة المشاهدات وجذب المشترين بشكل أسرع</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (propertyId) {
                        router.push(`/reels/upload?property_id=${propertyId}`);
                      } else {
                        router.push("/reels/upload");
                      }
                    }}
                    style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
                    + أضف Reel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── أزرار التحكم بالتنقل المتقدمة الحرة (مع الحفظ التلقائي كمسودة عند الانتقال) ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
            <button type="button" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0} style={{ padding: "12px 24px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "#fff", color: "#374151", cursor: currentStep === 0 ? "not-allowed" : "pointer", opacity: currentStep === 0 ? 0.4 : 1, fontFamily: "Cairo" }}>← السابق</button>
            
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {steps.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === currentStep ? "#16a34a" : "#E5E7EB" }} />)}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {currentStep > 0 && (
                <button type="button" onClick={() => autoSaveDraft(currentStep)} disabled={submitting} style={{ padding: "12px 24px", border: "1.5px solid #D1D5DB", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "#F3F4F6", color: "#4B5563", cursor: "pointer", fontFamily: "Cairo" }}>
                  💾 حفظ كمسودة
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button type="button" onClick={() => autoSaveDraft(currentStep + 1)} style={{ padding: "12px 28px", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "#16a34a", color: "#fff", cursor: "pointer", fontFamily: "Cairo" }}>التالي ←</button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting} style={{ padding: "12px 28px", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, background: submitting ? "#86efac" : "#16a34a", color: "#fff", cursor: "pointer", fontFamily: "Cairo" }}>{submitting ? "جاري النشر..." : "نشر الإعلان 🚀"}</button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}