import { MockDataProvider } from "@/context/MockDataContext";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

// ... (existing metadata and viewport omitted for brevity)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Bebas+Neue&display=swap"
        />
      </head>
      <body>
        <ToastProvider>
          <MockDataProvider>{children}</MockDataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
