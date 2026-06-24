import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LumenPay Lite",
  description: "A Stellar Testnet payment dApp for LumenPay White Belt Level 1."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
