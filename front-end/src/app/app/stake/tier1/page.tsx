"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "@/hooks/useContracts";

export default function Tier1Page() {
  const account = useActiveAccount();
  const isConnected = !!account;
  const { hNOBTBalance, stakeTier1 } = useContracts();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const handleStake = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try { await stakeTier1(amount); setAmount(""); }
    catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Tier 1: Stake hNOBT</h2>
      <p className="text-sm text-gray-500">Stake hNOBT to earn BroilerPlus. Dynamic APR.</p>
      <div className="bg-white rounded-xl border p-4 text-sm">
        <span className="text-gray-500">Your hNOBT: </span>
        <span className="font-medium">{(BigInt(hNOBTBalance || "0") / 10n ** 18n).toString()} hNOBT</span>
      </div>
      {!isConnected ? (
        <p className="text-gray-400 text-sm">Connect wallet to stake.</p>
      ) : (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border rounded-lg text-sm" />
          <button onClick={handleStake} disabled={!amount || busy}
            className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50">
            {busy ? "Staking..." : "Stake hNOBT"}
          </button>
        </div>
      )}
    </div>
  );
}
