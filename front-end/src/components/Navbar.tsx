"use client";

import Link from "next/link";
import { useState } from "react";
import W3mButton from "./W3mButton";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            Trestle
          </Link>

           <div className="hidden md:flex items-center gap-8">
             <Link href="/#features" className="text-sm text-gray-600 hover:text-emerald-600">Features</Link>
             <Link href="/#tokens" className="text-sm text-gray-600 hover:text-emerald-600">Tokens</Link>
             <Link href="/#roadmap" className="text-sm text-gray-600 hover:text-emerald-600">Roadmap</Link>
             <Link href="/app" className="text-sm text-gray-600 hover:text-emerald-600">App</Link>
             <a href="https://docs.trestleprotocol.io" className="text-sm text-gray-600 hover:text-emerald-600">Docs</a>
             <a href="https://reward.trestle.website" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-emerald-600">Reward Hub</a>
             <a href="https://testnet.trestle.website" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-emerald-600">Testnet Hub</a>
           </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <W3mButton />
              <a
                href="https://t.me/trestle_bot/app"
                target="_blank"
                className="px-4 py-2 border border-emerald-500 text-emerald-600 text-sm font-medium rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Telegram App
              </a>
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-500 hover:text-emerald-600">
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
           <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
             <Link href="/#features" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-emerald-600">Features</Link>
             <Link href="/#tokens" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-emerald-600">Tokens</Link>
             <Link href="/#roadmap" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-emerald-600">Roadmap</Link>
             <Link href="/app" onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 hover:text-emerald-600">App</Link>
             <a href="https://docs.trestleprotocol.io" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-600 hover:text-emerald-600">Docs</a>
             <a href="https://reward.trestle.website" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-600 hover:text-emerald-600">Reward Hub</a>
             <a href="https://testnet.trestle.website" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-600 hover:text-emerald-600">Testnet Hub</a>
             <hr className="border-gray-100" />
             <W3mButton />
             <a
               href="https://t.me/trestle_bot/app"
               target="_blank"
               className="inline-block px-4 py-2 border border-emerald-500 text-emerald-600 text-sm font-medium rounded-xl hover:bg-emerald-50 transition-colors"
             >
               Telegram App
             </a>
           </div>
         )}
      </div>
    </nav>
  );
}
