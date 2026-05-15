import Link from "next/link";
import { useState } from "react";
import W3mButton from "./W3mButton";
import { Icon } from "./Icon";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#tokens", label: "Tokens" },
  { href: "/#roadmap", label: "Roadmap" },
  { href: "/app", label: "App" },
  { href: "https://docs.trestleprotocol.io", label: "Docs", external: true },
  { href: "https://reward.trestle.website", label: "Reward Hub", external: true },
  { href: "https://testnet.trestle.website", label: "Testnet", external: true },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-emerald-600 shrink-0">
            <Icon name="logo" size={28} />
            <span>Trestle</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <W3mButton />
            <a
              href="https://t.m/TrestlePro"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon name="telegram" size={16} />
              <span className="hidden lg:inline">Telegram</span>
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-emerald-600 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <a
              href="https://t.m/TrestlePro"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              💬 Telegram
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}