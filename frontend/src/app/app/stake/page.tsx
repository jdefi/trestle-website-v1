"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { parseAbiItem } from "viem";
import { useContracts, LOCKDOWN_24H_SECONDS } from "@/hooks/useContracts";
import { CONTRACTS, DEPLOY_BLOCKS } from "@/config/contracts";
import { config } from "@/config/web3";
import { polygon } from "viem/chains";
import toast from "react-hot-toast";
import { copyToClipboard } from "@/lib/clipboard";

const fmt = (n: string | number) => Number(n).toLocaleString("en-US");

const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return "";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

const LOCK_PERIODS: Record<number, { label: string; duration: number; mult: string }> = {
  1: { label: "3 months", duration: 90 * 86400, mult: "1x" },
  2: { label: "6 months", duration: 180 * 86400, mult: "1.25x" },
  3: { label: "12 months", duration: 365 * 86400, mult: "1.5x" },
};

const READ_ABI = [
  { inputs: [{ name: "_account", type: "address" }], name: "userWeightedStake", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedStake", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "rewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const STAKE_STAKED = parseAbiItem("event Staked(address indexed user, uint256 index, uint256 amount, uint8 lockPeriod)");
const STAKE_WITHDRAWN = parseAbiItem("event Withdrawn(address indexed user, uint256 index, uint256 amount)");
const STAKE_EARLY = parseAbiItem("event EarlyUnstaked(address indexed user, uint256 index, uint256 amount, uint256 rewardPenalty)");

const DEPLOY_BLOCK = DEPLOY_BLOCKS.hNobtCoreStaking;

const DURATIONS = [
  { label: "3 months", mult: "1x", lockPeriod: 1 },
  { label: "6 months", mult: "1.25x", lockPeriod: 2 },
  { label: "12 months", mult: "1.5x", lockPeriod: 3 },
];

async function fetchLogsBatched(client: any, event: any, addr: `0x${string}`, user: `0x${string}`, from: bigint, to: bigint) {
  for (const batchSize of [0n, 100000n, 50000n, 10000n]) {
    try {
      if (batchSize === 0n) return await client.getLogs({ address: addr, event, args: { user }, fromBlock: from, toBlock: to });
      const all: any[] = [];
      let f = from;
      while (f <= to) {
        const ct = f + batchSize - 1n > to ? to : f + batchSize - 1n;
        all.push(...(await client.getLogs({ address: addr, event, args: { user }, fromBlock: f, toBlock: ct })));
        f = ct + 1n;
      }
      return all;
    } catch { continue; }
  }
  return [];
}

interface StakeInfo {
  index: number;
  amount: bigint;
  lockEndTime: bigint;
  lockPeriod: number;
  stakeTime: bigint;
  withdrawn: boolean;
  label: string;
  multiplier: string;
}

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const { hNOBTBalance, claimRewardStake, withdrawStake, earlyUnstakeStake, hNOBTCoreAllowance, hNobtCoreAddr, approveCoreHnobt, stakeCoreHnobt } = useContracts();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [stakes, setStakes] = useState<StakeInfo[]>([]);
  const [stakesLoading, setStakesLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<{ type: string; index: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const copyAddr = async (label: string, value: string) => {
    await copyToClipboard(value);
    setCopiedAddr(label);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const { data: coreStakedBal } = useReadContract({
    abi: READ_ABI, address: hNobtCoreAddr, functionName: "userWeightedStake",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 60_000 },
  });
  const { data: corePendingBrt } = useReadContract({
    abi: READ_ABI, address: hNobtCoreAddr, functionName: "earned",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const hNOBT = CONTRACTS.mainnet.hNOBT;
  const isStaked = coreStakedBal && BigInt(coreStakedBal.toString()) > 0n;

  useEffect(() => {
    if (!address) { setStakes([]); return; }
    let cancelled = false;
    const fetchStakes = async () => {
      setStakesLoading(true);
      try {
        const client = getPublicClient(config, { chainId: polygon.id });
        if (!client) return;
        const latestBlock = await client.getBlockNumber();
        if (cancelled) return;
        const stakedLogs = await fetchLogsBatched(client, STAKE_STAKED, hNobtCoreAddr, address, DEPLOY_BLOCK, latestBlock);
        if (cancelled) return;
        const withdrawnLogs = await fetchLogsBatched(client, STAKE_WITHDRAWN, hNobtCoreAddr, address, DEPLOY_BLOCK, latestBlock);
        if (cancelled) return;
        const earlyLogs = await fetchLogsBatched(client, STAKE_EARLY, hNobtCoreAddr, address, DEPLOY_BLOCK, latestBlock);
        if (cancelled) return;
        const inactiveIndices = new Set([...withdrawnLogs, ...earlyLogs].map((l: any) => Number(l.args.index)));
        const blockSet = new Set<bigint>(stakedLogs.map((l: any) => l.blockNumber).filter((b: any) => b != null));
        const blockTs = new Map<string, number>();
        await Promise.all([...blockSet].map(async (bn: bigint) => {
          if (!blockTs.has(bn.toString())) {
            const b = await client.getBlock({ blockNumber: bn });
            blockTs.set(bn.toString(), Number(b.timestamp));
          }
        }));
        const parsed = stakedLogs
          .filter((l: any) => !inactiveIndices.has(Number(l.args.index)))
          .map((l: any) => {
            const idx = Number(l.args.index);
            const lp = Number(l.args.lockPeriod) as 1 | 2 | 3;
            const period = LOCK_PERIODS[lp] || LOCK_PERIODS[1];
            const ts = blockTs.get(l.blockNumber!.toString()) || 0;
            return {
              index: idx,
              amount: l.args.amount as bigint,
              lockEndTime: BigInt(ts + period.duration),
              lockPeriod: lp,
              stakeTime: BigInt(ts),
              withdrawn: false,
              label: period.label,
              multiplier: period.mult,
            };
          });
        if (!cancelled) setStakes(parsed);
      } catch (e: any) { console.error("fetch stakes error:", e); }
      finally { if (!cancelled) setStakesLoading(false); }
    };
    fetchStakes();
    return () => { cancelled = true; };
  }, [address, hNobtCoreAddr]);

  const parsedAmt = amount ? BigInt(Math.floor(parseFloat(amount) * 1e18)) : 0n;
  const allowanceAmt = BigInt(hNOBTCoreAllowance || "0");
  const approveNeeded = parsedAmt > 0n && parsedAmt > allowanceAmt;

  const handleApprove = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try { await approveCoreHnobt(parsedAmt.toString()); }
    catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  const handleStake = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try {
      await stakeCoreHnobt(parsedAmt.toString(), duration.lockPeriod);
      setAmount(""); setModalOpen(false);
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  const handleClaimReward = async () => {
    setBusy(true);
    try { await claimRewardStake(); }
    catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  const handleWithdraw = async (index: number) => {
    setBusyAction({ type: "withdraw", index });
    try { await withdrawStake(index); }
    catch (e: any) { toast.error(e.message); }
    setBusyAction(null);
  };

  const handleEarlyUnstake = async (index: number) => {
    setBusyAction({ type: "earlyUnstake", index });
    try { await earlyUnstakeStake(index); }
    catch (e: any) { toast.error(e.message); }
    setBusyAction(null);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-green-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-green-700">Stake hNOBT</h2>
        </div>

        <div className="bg-white rounded-lg border p-3 text-sm space-y-1">
          {isStaked && (
            <div className="flex justify-between">
              <span className="text-gray-500">Weighted stake:</span>
              <span className="font-semibold text-green-700">{fmt((Number(coreStakedBal) / 1e18).toFixed(4))} hNOBT</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Pending BRT:</span>
            <span className="font-semibold text-emerald-600">{fmt((Number(corePendingBrt || 0) / 1e9).toFixed(6))} BRT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Core contract:</span>
            <button onClick={() => copyAddr("Core", hNobtCoreAddr)} className="text-green-600 hover:text-green-800 font-mono text-xs">
              {hNobtCoreAddr.slice(0, 8)}...{hNobtCoreAddr.slice(-6)}{copiedAddr === "Core" ? " ✅" : " 📋"}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleClaimReward} disabled={busy}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg disabled:opacity-40 transition text-xs"
          >{busy ? "Processing..." : `Claim ${(Number(corePendingBrt || 0) / 1e9).toFixed(6)} BRT`}</button>
          <button onClick={() => setModalOpen(true)} disabled={!isConnected}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
          >{isConnected ? "Stake" : "Connect Wallet"}</button>
        </div>

        {stakes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-green-800">Your Stakes</h3>
            {stakes.map(s => {
              const unlocked = now >= Number(s.lockEndTime);
              const lockdownEnd = Number(s.stakeTime) + LOCKDOWN_24H_SECONDS;
              const lockdownRemaining = Math.max(0, lockdownEnd - now);
              const lockdownPassed = lockdownRemaining === 0;
              const busyKey = `${busyAction?.type}:${busyAction?.index}`;
              const isBusy = busyKey === `withdraw:${s.index}` || busyKey === `earlyUnstake:${s.index}`;
              const lockRemaining = Math.max(0, Number(s.lockEndTime) - now);
              return (
                <div key={s.index} className="rounded-lg border p-3 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-medium">#{s.index} — {fmt((Number(s.amount) / 1e18).toFixed(4))} hNOBT × {s.multiplier}</p>
                      <p className="text-gray-400">{s.label} lock</p>
                    </div>
                    <span className={`shrink-0 font-medium text-[10px] px-2 py-0.5 rounded-full ${
                      unlocked ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {unlocked ? "Unlocked" : formatCountdown(lockRemaining)}
                    </span>
                  </div>
                  {!unlocked && !lockdownPassed && (
                    <p className="text-center text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-1.5">🔒 24h lockdown ends in {formatCountdown(lockdownRemaining)} — early unstake locked</p>
                  )}
                  {!unlocked && lockdownPassed && (
                    <button onClick={() => handleEarlyUnstake(s.index)} disabled={!!busyAction}
                      className="w-full py-1.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg disabled:opacity-40 transition text-xs"
                    >{isBusy ? "Processing..." : "Early Unstake (50% penalty)"}</button>
                  )}
                  {unlocked && (
                    <button onClick={() => handleWithdraw(s.index)} disabled={!!busyAction}
                      className="w-full py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-40 transition text-xs"
                    >{isBusy ? "Processing..." : "Withdraw"}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {stakesLoading && <p className="text-xs text-gray-400 text-center">Loading stakes...</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Stake hNOBT</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-green-50 rounded-lg p-3 space-y-1 text-xs font-mono">
              <p className="text-[10px] text-gray-400 mb-1">Contracts</p>
              {([
                ["hNOBT", hNOBT],
                ["Core Staking", hNobtCoreAddr],
              ] as const).map(([label, addr]) => (
                <button key={label} onClick={() => copyAddr(label, addr)} className="w-full flex justify-between items-center hover:bg-black/5 rounded px-1 -mx-1 transition">
                  <span className="text-gray-500">{label}:</span>
                  <span className="text-gray-700">{addr.slice(0, 8)}...{addr.slice(-6)}{copiedAddr === label ? " ✅" : " 📋"}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-gray-700 font-medium">Step 1: Select lock period</p>
              <select value={duration.label} onChange={e => setDuration(DURATIONS.find(d => d.label === e.target.value)!)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              >{DURATIONS.map(d => (
                <option key={d.label} value={d.label}>{d.label} — {d.mult} multiplier</option>
              ))}</select>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-gray-700 font-medium">Step 2: Enter amount</p>
              <input type="number" placeholder="hNOBT amount" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              <p className="text-[11px] text-gray-400">Available: {fmt((Number(hNOBTBalance || "0") / 1e18).toFixed(4))} hNOBT</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pending BRT:</span>
                <span className="font-medium text-emerald-600">{fmt((Number(corePendingBrt || 0) / 1e9).toFixed(6))} BRT</span>
              </div>
            </div>

            {approveNeeded ? (
              <button onClick={handleApprove} disabled={busy}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
              >{busy ? "Approving..." : "Approve hNOBT"}</button>
            ) : (
              <button onClick={handleStake} disabled={!amount || busy}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
              >{busy ? "Staking..." : "Confirm Stake"}</button>
            )}
            {approveNeeded && (
              <p className="text-[11px] text-amber-600 text-center">Approve the contract to spend your hNOBT first.</p>
            )}
            <p className="text-[11px] text-gray-400 text-center">🔒 Early unstake: 50% reward penalty + 24h minimum lockdown.</p>
          </div>
        </div>
      )}
    </div>
  );
}
