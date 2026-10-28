import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Noto_Sans_SC } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

// Huninn 只用拉丁字母和数字（台湾字形，不用它显示汉字）
const huninn = localFont({
  src: "./fonts/huninn-latin.woff2",
  variable: "--font-huninn",
  weight: "400",
});

// 汉字用简体字形的思源黑体
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "灶记 CookedBook",
  description: "记下你做过、还能再做的菜谱本",
};

export const viewport: Viewport = {
  themeColor: "#FFFCF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${huninn.variable} ${notoSansSC.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
