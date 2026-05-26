import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import MobileQrButton from "@/components/MobileQrButton";
import AstraChat from "@/components/AstraChat";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: {
    default: "Trestle DeFi | Decentralized Marketplace",
    template: "%s | Trestle DeFi",
  },
  description: "A self-sustaining economic bridge between the gig economy and real-world assets.",
  openGraph: {
    title: "Trestle DeFi",
    description: "A self-sustaining economic bridge between the gig economy and real-world assets.",
    type: "website",
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://trestle.website"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>
          <Navbar />
          <MobileQrButton />
          <main>{children}</main>
          <Footer />
          <AstraChat />
        </Providers>
      </body>
    </html>
  );
}