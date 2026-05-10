import Link from "next/link";
import { LINKS } from "@/config/contracts";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-3">Protocol</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#features" className="hover:text-emerald-400">Features</Link></li>
            <li><Link href="/#tokens" className="hover:text-emerald-400">Tokenomics</Link></li>
            <li><Link href="/#roadmap" className="hover:text-emerald-400">Roadmap</Link></li>
            <li><a href={LINKS.docs} className="hover:text-emerald-400">Docs</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">App</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/app" className="hover:text-emerald-400">Dashboard</Link></li>
            <li><Link href="/app/marketplace" className="hover:text-emerald-400">Marketplace</Link></li>
            <li><Link href="/app/stake" className="hover:text-emerald-400">Staking</Link></li>
            <li><Link href="/app/vault" className="hover:text-emerald-400">Vault</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Community</h3>
          <ul className="space-y-2 text-sm">
            <li><a href={LINKS.telegram} className="hover:text-emerald-400">Telegram</a></li>
            <li><a href={LINKS.twitter} className="hover:text-emerald-400">Twitter / X</a></li>
            <li><a href={LINKS.github} className="hover:text-emerald-400">GitHub</a></li>
            <li><a href={LINKS.telegramApp} className="hover:text-emerald-400">Mini-App</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-emerald-400">Terms</a></li>
            <li><a href="#" className="hover:text-emerald-400">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-6 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Trestle Protocol. All rights reserved.</p>
      </div>
    </footer>
  );
}
