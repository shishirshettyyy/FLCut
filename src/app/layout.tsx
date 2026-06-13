import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLCut - URL Shortener",
  description:
    "FLCut is the Finite Loop Club URL shortener. Shorten long links instantly and track them in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
