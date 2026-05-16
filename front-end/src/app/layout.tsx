import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AstraChat from "@/components/AstraChatWrapper";

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
  description:
    "A decentralized marketplace for freelancers, digital assets, and RWAs. Built with Next.js, Telegram Mini-Apps, and Polygon/EVM integration.",
  keywords: ["decentralized marketplace", "web3 freelancer", "RWA tokenization", "DeFi", "crypto staking"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Trestle DeFi",
    description: "A decentralized marketplace for freelancers, digital assets, and RWAs. Built with Next.js, Telegram Mini-Apps, and Polygon/EVM integration.",
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
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
          {/* <AstraChat /> */}
        </Providers>
      </body>
    </html>
  );
}