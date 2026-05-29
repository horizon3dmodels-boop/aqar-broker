import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // أضفنا استدعاء النافبار هنا
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "عقار بروكر | منصة العقارات السعودية",
  description: "منصة عقارية سعودية متكاملة للبيع والإيجار والمقاولين والمهندسين",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* النافبار الآن ثابت في كل الموقع */}
        <Navbar /> 
        
        <main className="flex-grow">
          {children}
        </main>

        <Footer />
        <SupportWidget />
      </body>
    </html>
  );
}