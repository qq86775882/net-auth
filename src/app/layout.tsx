import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "网络验证系统",
  description: "软件授权管理平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
