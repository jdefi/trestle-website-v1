import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AstraChatWrapper from "@/components/AstraChatWrapper";
import TOSModal from "@/components/TOSModal";

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
    "Trestle DeFi bridges blockchain with real-world utility. Earn, stake, and own through a three-tier ecosystem powered by hNOBT, BroilerPlus, and Governance tokens.",
  keywords: ["decentralized marketplace", "web3 freelancer", "RWA tokenization", "DeFi", "crypto staking"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <AstraChatWrapper />
          <TOSModal />
        </Providers>
      </body>
    </html>
  );
}