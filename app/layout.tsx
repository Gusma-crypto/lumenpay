import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LumenPay Lite",
  description: "A multi-wallet Stellar Testnet payment tracker for Yellow Belt Level 2."
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
