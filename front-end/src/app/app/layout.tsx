import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trestle dApp | Marketplace, Staking & Vault",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Link href="/app" className="px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:border-emerald-400 whitespace-nowrap">Dashboard</Link>
          <Link href="/app/marketplace" className="px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:border-emerald-400 whitespace-nowrap">Marketplace</Link>
          <Link href="/app/stake/tier1" className="px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:border-emerald-400 whitespace-nowrap">Tier 1</Link>
          <Link href="/app/stake/tier2" className="px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:border-emerald-400 whitespace-nowrap">Tier 2</Link>
          <Link href="/app/stake/tier3" className="px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:border-emerald-400 whitespace-nowrap">Tier 3</Link>
          <Link href="/app/withdraw" className="px-4 py-2 text-sm font-medium rounded-lg bg-white border hover:border-emerald-400 whitespace-nowrap">Wallet</Link>
        </div>
        {children}
      </div>
    </div>
  );
}
