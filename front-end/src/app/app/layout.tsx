import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-emerald-600">← Trestle</Link>
          <a href="https://t.me/TrestleDeFi" target="_blank" rel="noopener noreferrer"
             className="text-xs text-gray-500 hover:text-emerald-600 transition flex items-center gap-1">
            💬 Telegram Support
          </a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { href: "/app", label: "Dashboard", icon: "🏠" },
            { href: "/app/marketplace", label: "Marketplace", icon: "🏪" },
            { href: "/app/stake", label: "Stake", icon: "📈" },
            { href: "/app/mine", label: "Mine", icon: "⛏️" },
            { href: "/app/vault", label: "Vault", icon: "💎" },
            { href: "/app/withdraw", label: "Wallet", icon: "💰" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:border-emerald-400 whitespace-nowrap transition-colors flex items-center gap-1">
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
