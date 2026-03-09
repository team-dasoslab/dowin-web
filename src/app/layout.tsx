import { MockDataProvider } from "@/context/MockDataContext";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WIG Scoreboard",
  description: "가장 중요한 목표에 집중하세요 (Linear Light Aesthetic)",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Bebas+Neue&display=swap"
        />
      </head>
      <body>
        <MockDataProvider>{children}</MockDataProvider>
      </body>
    </html>
  );
}
