import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { CustomCursor } from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "PARKX — Mumbai's Urban Parking Network",
  description:
    "Real-time Mumbai parking infrastructure connecting drivers, society parking bays, and gate security with atomic lock hold and sub-15s QR clearance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-parkx-black text-slate-100 antialiased selection:bg-parkx-pink selection:text-white font-sans">
        <Providers>
          <CustomCursor />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
