import { Amiri, Tajawal } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

export const metadata = {
  title: "مركز تحفيظ القرآن الكريم",
  description: "متابعة الحضور والاشتراكات لطلاب حلقات التحفيظ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${tajawal.variable}`}>
      <body className="font-body antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
