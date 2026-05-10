import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TreMindChat from "@/components/TreMindChatWrapper";

export const metadata: Metadata = {
  title: "Trestle Protocol | Decentralized Marketplace for Digital Assets, Freelancers & RWA",
  description:
    "Trestle Protocol bridges DeFi with real-world utility. Earn, stake, and own through a three-tier ecosystem powered by hNOBT, BroilerPlus, and Governance tokens.",
  keywords: ["decentralized marketplace", "web3 freelancer", "RWA tokenization", "DeFi", "crypto staking"],
  openGraph: {
    title: "Trestle Protocol",
    description: "A self-sustaining economic bridge between the gig economy and real-world assets.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <TreMindChat />
        </Providers>
      </body>
    </html>
  );
}
