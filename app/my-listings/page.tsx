"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function MyListingsPage() {
  // بيانات وهمية لإعلانات المستخدم (سيتم ربطها لاحقاً بـ Supabase)
  const [listings, setListings] = useState([
    { id: 1, title: "فيلا مودرن للبيع", location: "حي النرجس، الرياض", price: "2,500,000", status: "نشط", views: 142, date: "2026-05-10", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80" },
    { id: 2, title: "شقة فاخرة للإيجار", location: "حي الملقا، الرياض", price: "85,000", status: "قيد المراجعة", views: 0, date: "2026-05-12", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80" },
  ]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] font-['Cairo'] pb-20 text-right">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');`}</style>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 mt-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900">إعلاناتي العقارية</h1>
            <p className="text-gray-500 font-bold mt-1">أدر عقاراتك المنشورة وتابع أداءها</p>
          </div>
          <a href="/add-property" className="bg-sky-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-sky-700 transition-all">+ إضافة جديد</a>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[32px] border-2 border-gray-50 shadow-sm flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 h-36 rounded-2xl overflow-hidden shrink-0">
                <img src={item.img} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black text-gray-900">{item.title}</h3>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black ${item.status === 'نشط' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-gray-500 font-bold text-sm mb-4">📍 {item.location}</p>
                <div className="flex flex-wrap gap-6 text-sm font-bold text-gray-400">
                  <span>💰 {item.price} ر.س</span>
                  <span>👁️ {item.views} مشاهدة</span>
                  <span>📅 {item.date}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none bg-gray-50 text-gray-700 px-5 py-3 rounded-xl font-black border border-gray-100 hover:bg-gray-100 transition-all text-sm">تعديل</button>
                <button className="flex-1 md:flex-none bg-red-50 text-red-600 px-5 py-3 rounded-xl font-black border border-red-100 hover:bg-red-600 hover:text-white transition-all text-sm">حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}