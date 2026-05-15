"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { useContracts } from "@/hooks/useContracts";

export default function WithdrawPage() {
  const { address, isConnected } = useAccount();
  const { data: native } = useBalance({ address });
  const { hNOBTBalance, brtBalance } = useContracts();
  const [busy, setBusy] = useState<string | null>(null);

  const nativeBalance = native ? (Number(native.value) / 1e18).toFixed(4) : "0";

  const withdrawNative = async () => {
    setBusy("matic");
    try {
      const amount = prompt("Enter MATIC amount to withdraw (in wei):", "0");
      if (!amount) return;
      alert("MATIC withdrawal via wallet interaction coming soon");
    } catch (e: any) { alert(e.message); }
    setBusy(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Wallet</h2>
      {!isConnected ? (
        <p className="text-gray-400 text-sm">Connect wallet to view balance.</p>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">MATIC</span><span className="font-medium">{nativeBalance}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">hNOBT</span><span className="font-medium">{(BigInt(hNOBTBalance || "0") / 10n ** 18n).toString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">BRT</span><span className="font-medium">{(BigInt(brtBalance || "0") / 10n ** 18n).toString()}</span></div>
          </div>
          <button onClick={withdrawNative} disabled={busy === "matic"}
            className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50">
            {busy === "matic" ? "Processing..." : "Withdraw MATIC"}
          </button>
          <button disabled
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium opacity-50 cursor-not-allowed">
            Withdraw Tokens (coming soon)
          </button>
        </div>
      )}
    </div>
  );
}
