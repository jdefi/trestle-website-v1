"use client";

import { useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { useContracts } from "@/hooks/useContracts";
import { CONTRACTS } from "@/config/contracts";

const ERC20_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const READ_ABI = [
  { inputs: [{ name: "_account", type: "address" }], name: "getUserTotalWeightedBalance", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedSupply", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "briRewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "xgovPointRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_account", type: "address" }], name: "earnedXgovPoints", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const STAKE_READ_ABI = [
  { inputs: [{ type: "address" }, { type: "uint256" }], name: "userInfo", outputs: [
    { name: "amount", type: "uint256" },
    { name: "weightedAmount", type: "uint256" },
    { name: "lockEndTime", type: "uint256" },
    { name: "multiplier", type: "uint256" },
    { name: "stakeTime", type: "uint256" },
    { name: "briRewardDebtSnapshot", type: "uint256" },
    { name: "xgovPointsDebtSnapshot", type: "uint256" },
    { name: "withdrawn", type: "bool" },
  ], type: "function", stateMutability: "view" },
] as const;

const DURATIONS = [
  { label: "6 months", mult: "1.4x", lockPeriod: 1 },
  { label: "12 months", mult: "1.6x", lockPeriod: 2 },
  { label: "18 months", mult: "1.8x", lockPeriod: 3 },
];

const MAX_STAKES = 10;

const fmt = (n: string | number) => Number(n).toLocaleString("en-US");
const fmtDate = (ts: bigint) => new Date(Number(ts) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const multDisplay = (m: bigint) => (Number(m) / 10000).toFixed(1) + "x";

export default function MinePage() {
  const { address, isConnected } = useAccount();
  const { brtBalance, lpAllowance, stakeLP, approveLP, withdrawMine, earlyUnstakeMine } = useContracts();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<{ type: string; index: number } | null>(null);

  const copyAddr = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedAddr(label);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const mineAddr = CONTRACTS.mainnet.mineStaking as `0x${string}`;
  const lpAddr = CONTRACTS.mainnet.brtLP as `0x${string}`;

  const { data: rewardRate } = useReadContract({
    abi: READ_ABI, address: mineAddr, functionName: "briRewardRate",
    query: { refetchInterval: 3_600_000 },
  });
  const { data: xgovRateData } = useReadContract({
    abi: READ_ABI, address: mineAddr, functionName: "xgovPointRate",
    query: { refetchInterval: 3_600_000 },
  });
  const { data: stakedBal } = useReadContract({
    abi: READ_ABI, address: mineAddr, functionName: "getUserTotalWeightedBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3_600_000 },
  });
  const { data: totalStaked } = useReadContract({
    abi: READ_ABI, address: mineAddr, functionName: "totalWeightedSupply",
    query: { refetchInterval: 3_600_000 },
  });
  const { data: earnedXgov } = useReadContract({
    abi: READ_ABI, address: mineAddr, functionName: "earnedXgovPoints",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3_600_000 },
  });
  const { data: lpBalance } = useReadContract({
    abi: ERC20_ABI, address: lpAddr, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const brt = CONTRACTS.mainnet.broilerPlus;
  const brtLP = CONTRACTS.mainnet.brtLP;

  const userStaked = stakedBal ? BigInt(stakedBal.toString()) : 0n;
  const total = totalStaked ? BigInt(totalStaked.toString()) : 1n;
  const rate = rewardRate ? BigInt(rewardRate.toString()) : 0n;
  const xgovRate = xgovRateData ? BigInt(xgovRateData.toString()) : 0n;

  const share = total > 0n ? (userStaked * 10_000n) / total : 0n;
  const dailyTokens = (rate * 86400n * share) / 10_000n;
  const dailyDisplay = (Number(dailyTokens) / 1e9).toFixed(6);
  const pendingEstimate = (Number(dailyTokens * 3600n) / 1e9 / 24).toFixed(6);
  const dailyXgov = (xgovRate * 86400n * share) / 10_000n;
  const dailyXgovDisplay = (Number(dailyXgov) / 1e18).toFixed(2);
  const pendingXgov = earnedXgov ? (BigInt(earnedXgov.toString()) / 10n ** 18n).toString() : "0";

  const stakeCalls = address
    ? Array.from({ length: MAX_STAKES }, (_, i) => ({
        abi: STAKE_READ_ABI,
        address: mineAddr,
        functionName: "userInfo" as const,
        args: [address, BigInt(i)] as const,
      }))
    : [];

  const { data: rawStakes } = useReadContracts({
    contracts: stakeCalls,
    query: { enabled: !!address },
  });

  const stakes = (rawStakes || [])
    .map((r, i) => {
      if (!r || r.error || !r.result) return null;
      const [amount, weightedAmount, lockEndTime, multiplier, stakeTime, , , withdrawn] = r.result as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
      return { index: i, amount, weightedAmount, lockEndTime, multiplier, stakeTime, withdrawn };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const now = Math.floor(Date.now() / 1000);

  const parsedAmt = amount ? BigInt(Math.floor(parseFloat(amount) * 1e18)) : 0n;
  const allowanceAmt = BigInt(lpAllowance || "0");
  const approveNeeded = parsedAmt > 0n && parsedAmt > allowanceAmt;

  const handleApprove = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try {
      await approveLP(parsedAmt.toString());
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  const handleStake = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try {
      await stakeLP(parsedAmt.toString(), duration.lockPeriod);
      setAmount("");
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  const handleWithdraw = async (index: number) => {
    setBusyAction({ type: "withdraw", index });
    try {
      await withdrawMine(index);
    } catch (e: any) {
      alert(e.message);
    }
    setBusyAction(null);
  };

  const handleEarlyUnstake = async (index: number) => {
    setBusyAction({ type: "earlyUnstake", index });
    try {
      await earlyUnstakeMine(index);
    } catch (e: any) {
      alert(e.message);
    }
    setBusyAction(null);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
        <h2 className="text-xl font-bold text-blue-700">⛏️ Mine</h2>
        <p className="text-sm text-gray-500">Stake BRT/WPOL LP tokens to earn BRT mining rewards.</p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700 flex items-center gap-2">
          <span>🔒</span> 24h lockdown before early unstake (50% reward penalty). Withdraw after lock expiry has no penalty.
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700 flex items-center gap-2">
          <span>⚠️</span> BRT contract transfer tax applies on BRT reward transfers.
        </div>

        <div className="bg-white rounded-lg border p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">BRT (wallet):</span>
            <span className="font-semibold text-blue-600">{fmt((Number(brtBalance || "0") / 1e9).toFixed(4))} BRT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">BRT/WPOL LP:</span>
            <span className="font-semibold text-blue-600">{fmt((Number(lpBalance?.toString() || "0") / 1e18).toFixed(4))} LP</span>
          </div>
          {userStaked > 0n && (
            <div className="flex justify-between">
              <span className="text-gray-500">Weighted stake:</span>
              <span className="font-semibold">{fmt((Number(userStaked) / 1e18).toFixed(4))} LP</span>
            </div>
          )}
        </div>

        {stakes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your stakes</p>
            {stakes.map(s => {
              const unlocked = now >= Number(s.lockEndTime);
              const lockdownPassed = now >= Number(s.stakeTime) + 86400;
              const isBusy = busyAction?.index === s.index;
              return (
                <div key={s.index} className={`rounded-lg border p-3 text-xs ${s.withdrawn ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        #{s.index + 1} — {fmt((Number(s.amount) / 1e18).toFixed(2))} LP × {multDisplay(s.multiplier)}
                      </p>
                      <p className="text-gray-400">Unlocks {fmtDate(s.lockEndTime)}</p>
                    </div>
                    <span className={`shrink-0 font-medium text-[10px] px-2 py-0.5 rounded-full ${
                      s.withdrawn ? "bg-gray-200 text-gray-500" :
                      unlocked ? "bg-green-100 text-green-700" :
                      lockdownPassed ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {s.withdrawn ? "Withdrawn" : unlocked ? "Unlocked" : lockdownPassed ? "Locked" : "24h Lockdown"}
                    </span>
                  </div>
                  {!s.withdrawn && (
                    <div className="flex gap-2 mt-2">
                      {unlocked ? (
                        <button onClick={() => handleWithdraw(s.index)} disabled={!!busyAction}
                          className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg disabled:opacity-40 transition text-xs"
                        >{isBusy ? "Processing..." : "Withdraw"}</button>
                      ) : (
                        <button onClick={() => handleEarlyUnstake(s.index)} disabled={!!busyAction || !lockdownPassed}
                          className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg disabled:opacity-40 transition text-xs"
                        >{isBusy ? "Processing..." : lockdownPassed ? "Early Unstake (50% penalty)" : "🔒 Lockdown"}</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => setModalOpen(true)}
          disabled={!isConnected}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
        >
          {isConnected ? "Stake LP" : "Connect Wallet to Stake"}
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Walkthrough: Stake LP</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-xs font-mono">
              {([["BRT LP", brtLP], ["BRT", brt], ["Staking", mineAddr]] as const).map(([label, addr]) => (
                <button key={label} onClick={() => copyAddr(label, addr)} className="w-full flex justify-between items-center hover:bg-blue-100/50 rounded px-1 -mx-1 transition">
                  <span className="text-gray-500">{label}:</span>
                  <span className="text-gray-700">{addr.slice(0, 8)}...{addr.slice(-6)}{copiedAddr === label ? " ✅" : " 📋"}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-gray-700 font-medium">Step 1: Select lock period</p>
              <select
                value={duration.label}
                onChange={e => setDuration(DURATIONS.find(d => d.label === e.target.value)!)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              >
                {DURATIONS.map(d => (
                  <option key={d.label} value={d.label}>{d.label} — {d.mult} multiplier</option>
                ))}
              </select>
              <div className="flex gap-1 text-[10px] text-gray-400">
                {DURATIONS.map(d => (
                  <span key={d.label} className="bg-gray-50 px-1.5 py-0.5 rounded">{d.label}={d.mult}</span>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-gray-700 font-medium">Step 2: Enter LP amount</p>
              <input
                type="number"
                placeholder="LP token amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
              <p className="text-[11px] text-gray-400">Available: {fmt((Number(lpBalance?.toString() || "0") / 1e18).toFixed(4))} BRT/WPOL LP</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Est. daily BRT rewards:</span>
                <span className="font-medium text-blue-600">{fmt(dailyDisplay)} BRT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Est. pending BRT:</span>
                <span className="font-medium text-blue-600">{fmt(pendingEstimate)} BRT</span>
              </div>
              <div className="border-t border-gray-200 pt-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. daily xGov points:</span>
                  <span className="font-medium text-purple-600">{fmt(dailyXgovDisplay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending xGov points:</span>
                  <span className="font-medium text-purple-600">{fmt(pendingXgov)}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-right">Updates every hour</p>
            </div>

            {approveNeeded ? (
              <button
                onClick={handleApprove}
                disabled={busy}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
              >
                {busy ? "Approving..." : "Approve LP"}
              </button>
            ) : (
              <button
                onClick={handleStake}
                disabled={!amount || busy}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
              >
                {busy ? "Staking..." : "Confirm Stake"}
              </button>
            )}
            {approveNeeded && (
              <p className="text-[11px] text-amber-600 text-center">You must approve the contract to spend your LP tokens before staking.</p>
            )}

            <p className="text-[11px] text-gray-400 text-center">⚠️ BRT contract transfer tax applies on BRT reward transfers.</p>
            <p className="text-[11px] text-gray-400 text-center">🔒 Early unstake before lock ends: 50% reward penalty + 24h minimum lockdown.</p>
          </div>
        </div>
      )}
    </div>
  );
}
