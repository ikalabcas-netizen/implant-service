import type { Metadata } from "next";
import { Bai_Jamjuree, Inter } from "next/font/google";
import "./globals.css";

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Implant Service Center",
  description: "He thong quan ly dich vu cam ghep Implant nha khoa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${baiJamjuree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
