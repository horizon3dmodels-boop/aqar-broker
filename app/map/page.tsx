'use client';
import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/lib/supabaseClient';
import { getLocationByIP } from '@/lib/getLocationByIP';

let mapboxgl: any;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
}

const TABS = [
  { key: 'بيع', label: 'للبيع', color: '#2563EB' },
  { key: 'إيجار', label: 'للإيجار', color: '#16a34a' },
  { key: 'إيجار يومي', label: 'إيجار يومي', color: '#F59E0B' },
  { key: 'مشاريع', label: 'المشاريع', color: '#7C3AED' },
];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('بيع');
  
  // State الإحداثيات الديناميكية (الافتراضية: الرياض)
  const [userLocation, setUserLocation] = useState({ lat: 24.7136, lng: 46.6753 });

  // 1. جلب إحداثيات المستخدم الحية عبر الـ IP فور تحميل الصفحة
  useEffect(() => {
    getLocationByIP().then((loc) => {
      if (loc && loc.lat && loc.lng) {
        setUserLocation({ lat: loc.lat, lng: loc.lng });
      }
    });
  }, []);

  // 2. إنشاء وتهيئة الخريطة لأول مرة مع فحص الطبقات بشكل آمن
  useEffect(() => {
    if (map.current || !mapboxgl) return;
    
    mapboxgl.setRTLTextPlugin(
      'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
      () => {}, true
    );

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation.lng, userLocation.lat], // استخدام الإحداثيات الديناميكية
      zoom: 11,
      language: 'ar',
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.current.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'top-left');
    
    map.current.on('load', () => {
      const layers = ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label', 'road-label-simple'];
      
      // فحص وجود الطبقة برمجياً لحظر مشكلة الشاشة الحمراء نهائياً
      layers.forEach(layer => { 
        if (map.current && map.current.getLayer(layer)) {
          try { 
            map.current.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); 
          } catch (e) {} 
        }
      });
      
      setLoading(false);
    });
  }, []);

  // 3. تحديث سنترة الخريطة ديناميكياً فور وصول الإحداثيات الحقيقية من الدالة
  useEffect(() => {
    if (map.current) {
      map.current.setCenter([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation]);

  // 4. معالجة وجلب الـ Markers بناءً على التاب النشط
  useEffect(() => {
    if (loading || !map.current) return;

    // احذف الـ markers القديمة لعدم تكرار العناصر
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const fetchMarkers = async () => {
      if (activeTab === 'مشاريع') {
        const { data } = await supabase
          .from('projects')
          .select('id, name, city, latitude, longitude, images')
          .not('latitude', 'is', null);

        (data || []).forEach((project) => {
          const el = document.createElement('div');
          el.style.cssText = `background:#7C3AED;color:white;padding:6px 12px;border-radius:20px;font-family:Cairo,sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);`;
          el.innerHTML = project.name;
          const marker = new mapboxgl.Marker(el)
            .setLngLat([project.longitude, project.latitude])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div dir="rtl" style="font-family:'Cairo',sans-serif;padding:8px;min-width:200px">
                <img src="${project.images?.[0] || ''}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>
                <div style="font-weight:800;font-size:14px;color:#0f172a;margin-bottom:4px">${project.name}</div>
                <div style="color:#6B7280;font-size:12px;margin-bottom:8px">📍 ${project.city}</div>
                <a href="/projects/${project.id}" style="display:block;text-align:center;margin-top:10px;background:#7C3AED;color:white;padding:10px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">عرض المشروع</a>
              </div>
            `))
            .addTo(map.current!);
          markersRef.current.push(marker);
        });
        return;
      }

      const { data } = await supabase
        .from('properties')
        .select('id, title, price, type, purpose, city, district, images, latitude, longitude')
        .eq('status', 'active')
        .eq('purpose', activeTab)
        .not('latitude', 'is', null);

      const tabColor = TABS.find(t => t.key === activeTab)?.color || '#2563EB';

      (data || []).forEach((property) => {
        const el = document.createElement('div');
        // تم تصحيح سطر الـ Style هنا وإرجاعه لأصله بدقة لمنع خطأ undefined
        el.style.cssText = `background:${tabColor};color:white;padding:6px 12px;border-radius:20px;font-family:Cairo,sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);`;
        el.innerHTML = `${Number(property.price)?.toLocaleString()} ر.س`;
        const marker = new mapboxgl.Marker(el)
          .setLngLat([property.longitude, property.latitude])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div dir="rtl" style="font-family:'Cairo',sans-serif;padding:8px;min-width:200px">
              <img src="${property.images?.[0] || ''}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>
              <div style="font-weight:800;font-size:14px;color:#0f172a;margin-bottom:4px">${property.title}</div>
              <div style="color:#6B7280;font-size:12px;margin-bottom:8px">📍 ${property.district}، ${property.city}</div>
              <div style="font-weight:900;color:${tabColor};font-size:16px">${Number(property.price)?.toLocaleString()} ر.س</div>
              <a href="/properties/${property.id}" style="display:block;text-align:center;margin-top:10px;background:${tabColor};color:white;padding:10px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">عرض التفاصيل</a>
            </div>
          `))
          .addTo(map.current!);
        markersRef.current.push(marker);
      });
    };

    fetchMarkers();
  }, [loading, activeTab]);

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", height: "calc(100vh - 64px)", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap');`}</style>

      {/* التابات العائمة */}
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: "#fff", borderRadius: 14, padding: 6, display: "flex", gap: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
            fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700,
            background: activeTab === tab.key ? tab.color : "transparent",
            color: activeTab === tab.key ? "#fff" : "#6B7280",
            transition: "all 0.2s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "Cairo", fontSize: 16, fontWeight: 600, color: "#4B5563", zIndex: 10 }}>
          جاري تحميل الخريطة...
        </div>
      )}
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}