import { Link } from "wouter";
import { Home, List, Calendar, Menu } from "lucide-react";

export function Header() {
  return (
    <header>
      {/* Header Top */}
      <div className="bg-white py-2.5 border-b-[3px] border-[#00ab67]">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <img src="/Absher_indvidual_logo.svg" alt="أبشر" className="h-[50px]" />
              <div className="w-px h-10 bg-[#e0e0e0]"></div>
              <img src="/vission-logo.png" alt="رؤية 2030" className="h-[50px]" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-semibold">محمد أحمد الغامدي</div>
                <div className="text-[13px] text-[#707070]">1088******</div>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00cc7b] to-[#00ab67] flex items-center justify-center text-white font-bold">
                م
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Nav Bar */}
      <nav className="bg-[#00ab67] py-3">
        <div className="max-w-[1200px] mx-auto px-5">
          <ul className="flex gap-6 list-none">
            <li>
              <Link href="/" className="text-white no-underline py-2 px-4 rounded-md flex items-center gap-2 hover:bg-white/20">
                <Home className="w-4 h-4" />
                الرئيسية
              </Link>
            </li>
            <li>
              <Link href="/" className="text-white no-underline py-2 px-4 rounded-md flex items-center gap-2 hover:bg-white/20">
                <List className="w-4 h-4" />
                خدماتي
              </Link>
            </li>
            <li>
              <Link href="/" className="text-white no-underline py-2 px-4 rounded-md flex items-center gap-2 bg-white/20">
                <Menu className="w-4 h-4" />
                مساعد التأشيرات
              </Link>
            </li>
            <li>
              <Link href="/" className="text-white no-underline py-2 px-4 rounded-md flex items-center gap-2 hover:bg-white/20">
                <Calendar className="w-4 h-4" />
                المواعيد
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Breadcrumb */}
      <div className="bg-white py-4 border-b border-[#e0e0e0]">
        <div className="max-w-[1200px] mx-auto px-5">
          <ul className="flex gap-2.5 list-none text-sm">
            <li>
              <Link href="/" className="text-[#00ab67] no-underline">الرئيسية</Link>
              <span className="mr-2.5 text-[#707070]">/</span>
            </li>
            <li>
              <Link href="/" className="text-[#00ab67] no-underline">الخدمات</Link>
              <span className="mr-2.5 text-[#707070]">/</span>
            </li>
            <li>
              <span>مساعد التأشيرات</span>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
