import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trestle dApp | Marketplace, Staking & Vault",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Compact top bar for dApp sections */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-emerald-600">← Trestle</Link>
          <a
            href="https://t.m/TrestlePro"
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
            { href: "/app/stake/tier1", label: "Tier 1", icon: "📈" },
            { href: "/app/stake/tier2", label: "Tier 2", icon: "📊" },
            { href: "/app/stake/tier3", label: "Tier 3", icon: "💎" },
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

      {/* Footer with QR */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="https://discord.gg/4dCCvnJYGT" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition">💎 Discord</a>
            <a href="https://t.m/TrestlePro" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition">💬 Telegram</a>
            <a href="mailto:contact@trestle.website" className="hover:text-emerald-500 transition">✉️ Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent("https://trestle.website/app")}&color=059669&bgcolor=ffffff&ecc=M`}
              alt="QR"
              className="rounded"
            />
            <span className="text-[10px] text-gray-400">Scan for mobile</span>
          </div>
        </div>
      </footer>
    </div>
  );
}