import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sellora — Sell Simply. Grow Everywhere.",
  description:
    "Turn your WhatsApp & Instagram into a complete online store. Sell products, take orders, manage customers and grow — without coding.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
