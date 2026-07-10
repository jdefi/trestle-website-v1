import type { Metadata } from "next";
import Link from "next/link";
import { LINKS } from "@/config/contracts";

export const metadata: Metadata = {
  title: "Trestle dApp | Stake, Mine & Vault",
  description: "Stake hNOBT, mine BRT/WPOL LP liquidity, and access the Governance Vault on Polygon.",
  openGraph: {
    title: "Trestle DeFi | dApp",
    description: "Stake hNOBT, mine BRT/WPOL LP liquidity, and access the Governance Vault on Polygon.",
    type: "website",
    url: "https://trestle.website",
    images: ["/assets/twitter_card.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@trestleDeFi",
    creator: "@trestleDeFi",
    title: "Trestle DeFi | dApp",
    description: "Stake hNOBT, mine BRT/WPOL LP liquidity, and access the Governance Vault on Polygon.",
    images: ["/assets/twitter_card.png"],
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Compact top bar for dApp sections */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-emerald-600">← Trestle</Link>
          <a
            href={LINKS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-emerald-600 transition flex items-center gap-1"
          >
            💬 Telegram <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { href: "/app", label: "Dashboard", icon: "🏠" },
            { href: "/app/marketplace", label: "Marketplace", icon: "🏪" },
            { href: "/app/stake", label: "Stake", icon: "📈" },
            { href: "/app/mine", label: "Mine", icon: "⛏️" },
            { href: "/app/vault", label: "Vault", icon: "🏦" },
            { href: "/app/withdraw", label: "Wallet", icon: "💰" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:border-emerald-400 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
        {children}
      </div>

      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="https://discord.gg/4dCCvnJYGT" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition">💎 Discord</a>
            <a href="mailto:contact@trestle.website" className="hover:text-emerald-500 transition">✉️ Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}