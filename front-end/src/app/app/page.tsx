"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "@/hooks/useContracts";
import { LINKS } from "@/config/contracts";

export default function AppDashboard() {
  const account = useActiveAccount();
  const isConnected = !!account;
  const address = account?.address;
  const { nativeBalance, hNOBTBalance, brtBalance } = useContracts();

  const [copied, setCopied] = useState(false);
  const refLink = address ? `${window.location.origin}/verify?ref=${address}` : "";

  const copyRef = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {!isConnected ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <h2 className="text-xl font-semibold text-gray-700">Connect your wallet</h2>
          <p className="text-sm text-gray-400 mt-2">to access the Trestle dApp</p>
        </div>
      ) : (
        <>
          <div className="bg-emerald-500 rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80">Your Portfolio</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span>MATIC</span>
                <span className="font-bold">{parseFloat(nativeBalance).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>hNOBT</span>
                <span className="font-bold">{(BigInt(hNOBTBalance || "0") / 10n ** 18n).toString()}</span>
              </div>
              <div className="flex justify-between">
                <span>BRT</span>
                <span className="font-bold">{(BigInt(brtBalance || "0") / 10n ** 18n).toString()}</span>
              </div>
            </div>
            <p className="text-xs opacity-60 mt-3">
              {address?.slice(0, 8)}...{address?.slice(-6)}
            </p>
          </div>

          {/* Referral */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-sm mb-2">Referral Link</h3>
            <p className="text-xs text-gray-500 mb-2">Share this link — new users get source-based bonus multipliers.</p>
            <div className="flex gap-2">
              <input readOnly value={refLink} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50" />
              <button onClick={copyRef} className="px-3 py-2 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 shrink-0">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Tier 1: hNOBT Staking", desc: "Stake hNOBT to mine BroilerPlus", href: "/app/stake/tier1", color: "border-emerald-200 bg-emerald-50" },
              { title: "Tier 2: LP Staking", desc: "Provide liquidity and earn rewards", href: "/app/stake/tier2", color: "border-blue-200 bg-blue-50" },
              { title: "Tier 3: Governor Vault", desc: "Earn governance tokens + fee share", href: "/app/stake/tier3", color: "border-purple-200 bg-purple-50" },
            ].map((card) => (
              <a key={card.title} href={card.href} className={`p-4 rounded-xl border ${card.color} hover:shadow-md transition-shadow`}>
                <h3 className="font-semibold text-gray-900">{card.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
              </a>
            ))}
          </div>

          {/* Telegram Mini App Link */}
          <a href={LINKS.telegramApp} target="_blank"
            className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-300 transition">
            <div>
              <h3 className="font-semibold text-sm">Telegram Mini App</h3>
              <p className="text-xs text-gray-500 mt-1">Open the Trestle marketplace in Telegram</p>
            </div>
            <span className="text-2xl">💬</span>
          </a>
        </>
      )}
    </div>
  );
}
