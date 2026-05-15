import Link from "next/link";
import { LINKS } from "@/config/contracts";
import QRCode from "@/components/QRCode";
import { Icon } from "./Icon";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-3">Protocol</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#features" className="hover:text-emerald-400 transition-colors">Features</Link></li>
            <li><Link href="/#tokens" className="hover:text-emerald-400 transition-colors">Tokenomics</Link></li>
            <li><Link href="/#roadmap" className="hover:text-emerald-400 transition-colors">Roadmap</Link></li>
            <li><a href="https://docs.trestleprotocol.io" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Docs</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">App</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/app" className="hover:text-emerald-400 transition-colors">Dashboard</Link></li>
            <li><Link href="/app/marketplace" className="hover:text-emerald-400 transition-colors">Marketplace</Link></li>
            <li><Link href="/app/stake" className="hover:text-emerald-400 transition-colors">Staking</Link></li>
            <li><Link href="/app/vault" className="hover:text-emerald-400 transition-colors">Vault</Link></li>
          </ul>
        </div>
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-white font-semibold mb-3">Community</h3>
          <ul className="space-y-2 text-sm">
            <li><a href={LINKS.discord} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><Icon name="discord" size={14} /> Discord</a></li>
            <li><a href={LINKS.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><Icon name="telegram" size={14} /> Telegram</a></li>
            <li><a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><Icon name="github" size={14} /> GitHub</a></li>
            <li><a href={LINKS.docs} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><Icon name="globe" size={14} /> Docs</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Connect</h3>
          <div className="flex flex-col gap-2 text-sm">
            <a href={LINKS.discord} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Discord</a>
            <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Telegram</a>
            <a href="mailto:contact@trestle.website" className="hover:text-emerald-400 transition-colors">contact@trestle.website</a>
            <a href="https://github.com/Trestle-Protocol" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">GitHub</a>
          </div>
          <div className="mt-3">
            <QRCode value="https://trestle.website" size={140} />
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a></li>
          </ul>
          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-[10px] text-gray-500">© {new Date().getFullYear()} Trestle Protocol</p>
          </div>
        </div>
      </div>
    </footer>
  );
}