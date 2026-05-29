"use client";
import Navbar from "@/components/Navbar";

export default function FavoritesPage() {
  const favorites = [
    { id: 1, title: "شاليه هادئ بمسبح", price: "1,200", type: "إيجار يومي", img: "https://images.unsplash.com/photo-1580587771525-78b9bed3bafc?w=400&q=80" },
    { id: 2, title: "أرض سكنية - الملقا", price: "4,200,000", type: "للبيع", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] font-['Cairo'] pb-20 text-right">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 mt-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">العقارات المفضلة</h1>
        <p className="text-gray-500 font-bold mb-10">قائمة العقارات التي قمت بحفظها.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {favorites.map((item) => (
            <div key={item.id} className="bg-white rounded-[35px] overflow-hidden border-2 border-gray-50 shadow-sm hover:shadow-xl transition-all group">
              <div className="h-56 relative">
                <img src={item.img} className="w-full h-full object-cover" alt="" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-2 rounded-full text-red-500 shadow-md">❤️</div>
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                  {item.type}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                <div className="text-2xl font-black text-sky-600">{item.price} <span className="text-xs font-bold text-gray-400">ر.س</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}