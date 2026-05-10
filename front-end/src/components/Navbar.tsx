"use client";

import Link from "next/link";
import { ConnectButton } from "thirdweb/react";
import { client, chain, wallets } from "@/config/web3";
import { useState } from "react";

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
          </div>

          <div className="flex items-center gap-3">
            <ConnectButton
              client={client}
              chain={chain}
              wallets={wallets}
              theme="light"
              connectButton={{ className: "!text-sm !py-2 !px-4 !h-auto !min-h-0 !rounded-xl" }}
            />
            <a
              href="https://t.me/trestle_bot/app"
              target="_blank"
              className="hidden sm:inline-flex px-4 py-2 border border-emerald-500 text-emerald-600 text-sm font-medium rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Telegram App
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
