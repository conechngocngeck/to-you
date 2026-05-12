import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "To you 🍾",
  description: "Một lá thư bí ẩn đang trôi dọc dòng sông, chờ bạn mở ra...",
  openGraph: {
    title: "To you",
    description: "Một lá thư bí ẩn đang trôi dọc dòng sông, chờ bạn mở ra...",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
