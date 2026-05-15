"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useContracts } from "@/hooks/useContracts";

export default function Tier2Page() {
  const { isConnected } = useAccount();
  const { brtBalance, stakeTier2 } = useContracts();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const handleStake = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try { await stakeTier2(amount); setAmount(""); }
    catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Tier 2: LP Staking</h2>
      <p className="text-sm text-gray-500">Stake BroilerPlus LP tokens to earn mining rewards.</p>
      <div className="bg-white rounded-xl border p-4 text-sm">
        <span className="text-gray-500">Your BRT: </span>
        <span className="font-medium">{(BigInt(brtBalance || "0") / 10n ** 18n).toString()} BRT</span>
      </div>
      {!isConnected ? (
        <p className="text-gray-400 text-sm">Connect wallet to stake.</p>
      ) : (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <input type="number" placeholder="LP Token Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border rounded-lg text-sm" />
          <button onClick={handleStake} disabled={!amount || busy}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50">
            {busy ? "Staking..." : "Stake LP"}
          </button>
        </div>
      )}
    </div>
  );
}
