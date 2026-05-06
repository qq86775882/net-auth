import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "缃戠粶楠岃瘉绯荤粺",
  description: "杞欢鎺堟潈绠＄悊骞冲彴",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
