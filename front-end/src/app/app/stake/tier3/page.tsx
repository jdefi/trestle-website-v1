"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useContracts } from "@/hooks/useContracts";

export default function Tier3Page() {
  const { isConnected } = useAccount();
  const { depositTier3 } = useContracts();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const handleDeposit = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try { await depositTier3(amount); setAmount(""); }
    catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Tier 3: Governor Vault</h2>
      <p className="text-sm text-gray-500">ERC-4626 vault. Deposit LP, earn Governance tokens + fee share.</p>

      <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 text-sm text-purple-700">
        <p className="font-medium">Loyalty Multipliers</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>1 month: 1x GOV rewards</li>
          <li>6 months: 1.5x GOV rewards</li>
          <li>1 year: 2x GOV rewards</li>
        </ul>
      </div>

      {!isConnected ? (
        <p className="text-gray-400 text-sm">Connect wallet to enter vault.</p>
      ) : (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <input type="number" placeholder="LP Token Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border rounded-lg text-sm" />
          <button onClick={handleDeposit} disabled={!amount || busy}
            className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium disabled:opacity-50">
            {busy ? "Depositing..." : "Deposit LP"}
          </button>
        </div>
      )}
    </div>
  );
}
