"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useContracts } from "@/hooks/useContracts";
import QRCode from "@/components/QRCode";
import { copyToClipboard } from "@/lib/clipboard";

const fmt = (n: string | number) => Number(n).toLocaleString("en-US");

export default function AppDashboard() {
  const { address, isConnected } = useAccount();
  const { nativeBalance, hNOBTBalance, brtBalance, brtLPBalance } = useContracts();

  const [showRefModal, setShowRefModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const REF_BASE = "https://trestle.website/verify?ref=";
  const refLink = address ? `${REF_BASE}${address}` : "";
  const maskedRefLink = address ? `${REF_BASE}mask_${btoa(address).slice(0, 12)}` : "";

  const copyRef = async (field: string, value: string) => {
    if (!value) return;
    await copyToClipboard(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {!isConnected ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <h2 className="text-xl font-semibold text-gray-700">Connect your wallet</h2>
          <p className="text-sm text-gray-400 mt-2 mb-4">
            to access the Trestle dApp
          </p>
          <div className="flex justify-center">
            <div className="bg-gray-50 rounded-xl p-4 max-w-sm">
              <QRCode value="https://trestle.website/app" size={140} />
              <p className="text-[10px] text-gray-400 mt-2 font-medium">
                Scan with mobile wallet to connect
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-emerald-500 rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80">Your Portfolio</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span>MATIC</span>
                <span className="font-bold">{fmt(nativeBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>hNOBT</span>
                <span className="font-bold">
                  {fmt((Number(hNOBTBalance || "0") / 1e18).toFixed(4))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>BRT</span>
                <span className="font-bold">
                  {fmt((Number(brtBalance || "0") / 1e9).toFixed(4))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>BRT/WPOL LP</span>
                <span className="font-bold">
                  {fmt((Number(brtLPBalance || "0") / 1e18).toFixed(4))}
                </span>
              </div>
            </div>
            <p className="text-xs opacity-60 mt-3">
              {address?.slice(0, 8)}...{address?.slice(-6)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Referral Links</h3>
              <button onClick={() => setShowRefModal(true)} className="text-xs text-emerald-600 underline">View</button>
            </div>
          </div>

          {showRefModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowRefModal(false)}>
              <div className="bg-white rounded-xl p-4 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="font-semibold mb-1">Referral Links</h3>
                <p className="text-xs text-gray-500 mb-3">Share these links — new users get source-based bonus multipliers.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block">Full address ref</label>
                    <div className="flex gap-2">
                      <input readOnly value={refLink} className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono bg-gray-50" />
                      <button onClick={() => copyRef("full", refLink)} className="px-2 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 shrink-0">
                        {copiedField === "full" ? "Done" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 mb-1 block">Masked address ref</label>
                    <div className="flex gap-2">
                      <input readOnly value={maskedRefLink} className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono bg-gray-50" />
                      <button onClick={() => copyRef("masked", maskedRefLink)} className="px-2 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 shrink-0">
                        {copiedField === "masked" ? "Done" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowRefModal(false)} className="mt-4 w-full py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition">Close</button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Stake",
                desc: "Stake hNOBT to earn BRT rewards",
                href: "/app/stake",
                color: "border-emerald-200 bg-emerald-50",
              },
              {
                title: "Mine",
                desc: "Stake BRT/WPOL LP to mine BRT",
                href: "/app/mine",
                color: "border-blue-200 bg-blue-50",
              },
              {
                title: "Vault",
                desc: "Governance token staking & vault",
                href: "/app/vault",
                color: "border-purple-200 bg-purple-50",
              },
            ].map((card) => (
              <a
                key={card.title}
                href={card.href}
                className={`p-4 rounded-xl border ${card.color} hover:shadow-md transition-shadow`}
              >
                <h3 className="font-semibold text-gray-900">{card.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
              </a>
            ))}
          </div>


        </>
      )}
    </div>
  );
}