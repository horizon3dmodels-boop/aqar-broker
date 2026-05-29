export async function getLocationByIP(): Promise<{ lat: number; lng: number; city: string; country: string }> {
  // أولاً جرب GPS
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        city: "",
        country: "",
      };
    } catch {}
  }

  // إذا رفض GPS — استخدم IP
  try {
    const cached = localStorage.getItem('userLocation');
    if (cached) return JSON.parse(cached);

    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const location = {
      lat: data.latitude || 24.7136,
      lng: data.longitude || 46.6753,
      city: data.city || "",
      country: data.country_name || "",
    };
    localStorage.setItem('userLocation', JSON.stringify(location));
    return location;
  } catch {}

  // fallback — الرياض
  return { lat: 24.7136, lng: 46.6753, city: "الرياض", country: "السعودية" };
}
