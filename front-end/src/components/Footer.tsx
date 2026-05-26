"use client";

import { useState } from "react";
import Link from "next/link";
import { LINKS } from "@/config/contracts";
import Icon from "./Icon";
import QRCode from "./QRCode";

export default function Footer() {
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-6 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-3">Trestle</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#features" className="hover:text-emerald-400 transition-colors">Features</Link></li>
            <li><Link href="/#tokens" className="hover:text-emerald-400 transition-colors">Tokenomics</Link></li>
            <li><Link href="/#roadmap" className="hover:text-emerald-400 transition-colors">Roadmap</Link></li>
            <li><a href={LINKS.docs} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Docs</a></li>
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
            <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">GitHub</a>
          </div>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a></li>
          </ul>
          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-[10px] text-gray-500">© {new Date().getFullYear()} Trestle DeFi</p>
          </div>
        </div>
        <div className="flex items-start justify-end">
          <button
            onClick={() => setQrOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="text-lg">📱</span>
            <span>Open on Mobile</span>
          </button>
        </div>
      </div>
      {qrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Open Trestle on mobile</span>
              <button
                onClick={() => setQrOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
            <QRCode
              value="https://trestle.website"
              size={350}
              altText="Scan QR code to open Trestle on mobile device"
            />
          </div>
        </div>
      )}
    </footer>
  );
}