"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token && pathname !== "/") {
      router.replace("/");
      return;
    }
    if (token && pathname === "/") {
      router.replace("/dashboard");
      return;
    }
    setOk(true);
  }, [pathname, router]);

  if (!ok) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>;
  return <>{children}</>;
}
