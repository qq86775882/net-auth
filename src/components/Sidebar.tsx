"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Box, Ticket, ScrollText, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "浠〃鐩?, icon: LayoutDashboard },
  { href: "/software", label: "杞欢绠＄悊", icon: Box },
  { href: "/cards", label: "鍗″瘑绠＄悊", icon: Ticket },
  { href: "/logs", label: "楠岃瘉鏃ュ織", icon: ScrollText },
  { href: "/settings", label: "绯荤粺璁剧疆", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("admin_token");
    router.replace("/");
  };

  return (
    <aside className="w-56 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-slate-700">
        <h1 className="text-lg font-bold tracking-wide">馃攼 缃戠粶楠岃瘉绯荤粺</h1>
        <p className="text-xs text-slate-400 mt-1">杞欢鎺堟潈绠＄悊骞冲彴</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={18} />
          閫€鍑虹櫥褰?
        </button>
      </div>
    </aside>
  );
}
