import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LumenPay Lite",
  description: "A multi-wallet Stellar Testnet payment tracker for Yellow Belt Level 2.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
