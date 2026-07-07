"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { parseAbiItem } from "viem";
import { useContracts } from "@/hooks/useContracts";
import { CONTRACTS } from "@/config/contracts";
import { config } from "@/config/web3";
import { polygon } from "viem/chains";

const fmt = (n: string | number) => Number(n).toLocaleString("en-US");
const multDisplay = (m: bigint) => (Number(m) / 10000).toFixed(m === 10000n ? 0 : 2).replace(/\.?0+$/, "") + "x";
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

const READ_ABI = [
  { inputs: [{ name: "_account", type: "address" }], name: "userWeightedStake", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedStake", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "rewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_account", type: "address" }], name: "earnedNet", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const STAKE_MULTS = [10000, 12500, 15000];
const STAKE_PERIODS = [90 * 86400, 180 * 86400, 365 * 86400];
const V1_DEPLOY_BLOCK = 89365000n;
const STAKE_STAKED = parseAbiItem("event Staked(address indexed user, uint256 index, uint256 amount, uint8 lockPeriod)");
const STAKE_WITHDRAWN = parseAbiItem("event Withdrawn(address indexed user, uint256 index, uint256 amount)");
const STAKE_EARLY = parseAbiItem("event EarlyUnstaked(address indexed user, uint256 index, uint256 amount, uint256 rewardPenalty)");

async function fetchV1Logs(client: any, event: any, addr: `0x${string}`, user: `0x${string}`, from: bigint, to: bigint) {
  for (const batchSize of [0n, 100000n, 50000n, 10000n]) {
    try {
      if (batchSize === 0n) {
        return await client.getLogs({ address: addr, event, args: { user }, fromBlock: from, toBlock: to });
      }
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

const DURATIONS = [
  { label: "3 months", mult: "1x", lockPeriod: 1 },
  { label: "6 months", mult: "1.25x", lockPeriod: 2 },
  { label: "12 months", mult: "1.5x", lockPeriod: 3 },
];

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const { hNOBTBalance, claimReward, withdrawV1Stake, earlyUnstakeV1Stake, claimV1Reward, hNOBTCoreAllowance, hNobtCoreAddr, approveCoreHnobt, stakeCoreHnobt } = useContracts();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<{ type: string; index: number } | null>(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const copyAddr = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedAddr(label);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const { data: coreRewardRate } = useReadContract({
    abi: READ_ABI, address: hNobtCoreAddr, functionName: "rewardRate",
    query: { refetchInterval: 3_600_000 },
  });
  const { data: coreStakedBal } = useReadContract({
    abi: READ_ABI, address: hNobtCoreAddr, functionName: "userWeightedStake",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3_600_000 },
  });
  const { data: coreTotalStaked } = useReadContract({
    abi: READ_ABI, address: hNobtCoreAddr, functionName: "totalWeightedStake",
    query: { refetchInterval: 3_600_000 },
  });
  const { data: corePendingBrt } = useReadContract({
    abi: READ_ABI, address: hNobtCoreAddr, functionName: "earnedNet",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const hNOBT = CONTRACTS.mainnet.hNOBT;
  const brt = CONTRACTS.mainnet.broilerPlus;

  const parsedAmt = amount ? BigInt(Math.floor(parseFloat(amount) * 1e18)) : 0n;
  const allowanceAmt = BigInt(hNOBTCoreAllowance || "0");
  const approveNeeded = parsedAmt > 0n && parsedAmt > allowanceAmt;

  const handleApprove = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try {
      await approveCoreHnobt(parsedAmt.toString());
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  const handleStake = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try {
      await stakeCoreHnobt(parsedAmt.toString(), duration.lockPeriod);
      setAmount("");
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  const handleClaimReward = async () => {
    setBusy(true);
    try {
      await claimReward();
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  const v1Addr = CONTRACTS.mainnet.stakeStakingV1 as `0x${string}`;
  const [v1Stakes, setV1Stakes] = useState<any[]>([]);
  const [v1Loading, setV1Loading] = useState(false);

  useEffect(() => {
    if (!address) { setV1Stakes([]); return; }
    let cancelled = false;
    const fetchV1 = async () => {
      setV1Loading(true);
      try {
        const client = getPublicClient(config, { chainId: polygon.id });
        if (!client) { console.warn("no public client"); return; }
        const latestBlock = await client.getBlockNumber();
        if (cancelled) return;
        const stakedLogs = await fetchV1Logs(client, STAKE_STAKED, v1Addr, address, V1_DEPLOY_BLOCK, latestBlock);
        if (cancelled) return;
        const inactiveLogs = await fetchV1Logs(client, STAKE_WITHDRAWN, v1Addr, address, V1_DEPLOY_BLOCK, latestBlock);
        if (cancelled) return;
        const earlyLogs = await fetchV1Logs(client, STAKE_EARLY, v1Addr, address, V1_DEPLOY_BLOCK, latestBlock);
        if (cancelled) return;
        const inactiveIndices = new Set([...inactiveLogs, ...earlyLogs].map((l: any) => Number(l.args.index)));
        const blockSet = new Set<bigint>(stakedLogs.map((l: any) => l.blockNumber).filter((b: any) => b != null));
        const blockTs = new Map<string, number>();
        await Promise.all([...blockSet].map(async (bn: bigint) => {
          if (!blockTs.has(bn.toString())) {
            const b = await client.getBlock({ blockNumber: bn });
            blockTs.set(bn.toString(), Number(b.timestamp));
          }
        }));
        const stakes = stakedLogs
          .filter((l: any) => !inactiveIndices.has(Number(l.args.index)))
          .map((l: any) => {
            const idx = Number(l.args.index);
            const amount = l.args.amount as bigint;
            const lockPeriod = Number(l.args.lockPeriod);
            const ts = blockTs.get((l as any).blockNumber!.toString()) || 0;
            const mult = lockPeriod >= 1 && lockPeriod <= 3 ? STAKE_MULTS[lockPeriod - 1] : STAKE_MULTS[0];
            const period = lockPeriod >= 1 && lockPeriod <= 3 ? STAKE_PERIODS[lockPeriod - 1] : STAKE_PERIODS[0];
            return { index: idx, amount, lockEndTime: BigInt(ts + period), lockMultiplier: BigInt(mult), stakeTime: BigInt(ts), withdrawn: false };
          });
        if (!cancelled) setV1Stakes(stakes);
      } catch (e: any) { console.error("V1 fetch error:", e); }
      finally { if (!cancelled) setV1Loading(false); }
    };
    fetchV1();
    return () => { cancelled = true; };
  }, [address, v1Addr]);

  const handleV1Withdraw = async (index: number) => {
    setBusyAction({ type: "v1-withdraw", index });
    try {
      await withdrawV1Stake(index);
    } catch (e: any) {
      alert(e.message);
    }
    setBusyAction(null);
  };

  const handleV1EarlyUnstake = async (index: number) => {
    setBusyAction({ type: "v1-earlyUnstake", index });
    try {
      await earlyUnstakeV1Stake(index);
    } catch (e: any) {
      alert(e.message);
    }
    setBusyAction(null);
  };

  const handleV1Claim = async () => {
    setBusy(true);
    try {
      await claimV1Reward();
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-purple-700">✨ Core Staking</h2>
        </div>
        <p className="text-sm text-gray-500">Stake hNOBT into the core contract. BRT rewards, same lock multipliers.</p>

        <div className="bg-white rounded-lg border p-3 text-sm space-y-1">
          {coreStakedBal && BigInt(coreStakedBal.toString()) > 0n && (
            <div className="flex justify-between">
              <span className="text-gray-500">Weighted stake:</span>
              <span className="font-semibold text-purple-700">{fmt((Number(coreStakedBal) / 1e18).toFixed(4))} hNOBT</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Core contract:</span>
            <button onClick={() => copyAddr("Core", hNobtCoreAddr)} className="text-purple-600 hover:text-purple-800 font-mono text-xs">
              {hNobtCoreAddr.slice(0, 8)}...{hNobtCoreAddr.slice(-6)}{copiedAddr === "Core" ? " ✅" : " 📋"}
            </button>
          </div>
        </div>

        {Number(corePendingBrt || 0) > 0 && (
          <button onClick={handleClaimReward} disabled={busy}
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg disabled:opacity-40 transition text-xs"
          >{busy ? "Processing..." : `Claim ${(Number(corePendingBrt || 0) / 1e9).toFixed(6)} BRT Rewards`}</button>
        )}

        <button
          onClick={() => setModalOpen(true)}
          disabled={!isConnected}
          className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
        >
          {isConnected ? "Stake into Core" : "Connect Wallet to Stake"}
        </button>

      </div>

      {address && (
        <div className="bg-white rounded-xl border border-amber-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-amber-700">⚠️ V1 Legacy Stakes</h3>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Legacy</span>
          </div>
          {v1Stakes.length > 0 && (<div className="space-y-3">
            <p className="text-xs text-gray-500">Legacy stakes from the original V1 contract. Withdraw or early-unstake below.</p>
            <button onClick={handleV1Claim} disabled={busy} className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg disabled:opacity-40 transition text-xs">Claim V1 Rewards</button>
            <div className="space-y-2">
              {v1Stakes.map(s => {
                const unlocked = now >= Number(s.lockEndTime);
                const lockdownPassed = now >= Number(s.stakeTime) + 86400;
                const isBusy = busyAction?.index === s.index;
                const lockdownRemaining = Math.max(0, Number(s.stakeTime) + 86400 - now);
                const lockRemaining = Math.max(0, Number(s.lockEndTime) - now);
                return (
                  <div key={s.index} className={`rounded-lg border p-3 text-xs ${s.withdrawn ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-medium">
                          #{s.index + 1} — {fmt((Number(s.amount) / 1e18).toFixed(2))} hNOBT × {multDisplay(s.lockMultiplier)}
                        </p>
                        <p className="text-gray-400">
                          {s.withdrawn ? "Withdrawn" : unlocked ? "Unlocked" : lockdownPassed ? `Unlocks in ${formatCountdown(lockRemaining)}` : `Lockdown ${formatCountdown(lockdownRemaining)}`}
                        </p>
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
                    {!s.withdrawn && unlocked && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleV1Withdraw(s.index)} disabled={!!busyAction}
                          className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg disabled:opacity-40 transition text-xs"
                        >{isBusy ? "Processing..." : "Withdraw"}</button>
                      </div>
                    )}
                    {!s.withdrawn && !unlocked && lockdownPassed && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleV1EarlyUnstake(s.index)} disabled={!!busyAction}
                          className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg disabled:opacity-40 transition text-xs"
                        >{isBusy ? "Processing..." : "Early Unstake (50% penalty)"}</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>)}
          {v1Stakes.length === 0 && (
            <p className="text-xs text-gray-500">No active V1 stakes found for this wallet.</p>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Stake hNOBT into Core</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 space-y-1 text-xs font-mono">
              <p className="text-[10px] text-gray-400 mb-1">Core contract</p>
              {([
                ["hNOBT", hNOBT],
                ["BRT", brt],
                ["Core Staking", hNobtCoreAddr],
              ] as const).map(([label, addr]) => (
                <button key={label} onClick={() => copyAddr(label, addr)} className="w-full flex justify-between items-center hover:bg-black/5 rounded px-1 -mx-1 transition">
                  <span className="text-gray-500">{label}:</span>
                  <span className="text-gray-700">{addr.slice(0, 8)}...{addr.slice(-6)}{copiedAddr === label ? " ✅" : " 📋"}</span>
                </button>
              ))}
              <p className="text-[10px] text-gray-400 mt-1">Legacy V1: 0xdc2b...4b6d</p>
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
              <p className="text-gray-700 font-medium">Step 2: Enter amount</p>
              <input
                type="number"
                placeholder="hNOBT amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
              />
              <p className="text-[11px] text-gray-400">Available: {fmt((Number(hNOBTBalance || "0") / 1e18).toFixed(4))} hNOBT</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pending BRT:</span>
                <span className="font-medium text-emerald-600">{fmt((Number(corePendingBrt || 0) / 1e9).toFixed(6))} BRT</span>
              </div>
              <p className="text-[10px] text-gray-400 text-right">Updates every hour</p>
            </div>

            {approveNeeded ? (
              <button
                onClick={handleApprove}
                disabled={busy}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
              >
                {busy ? "Approving..." : "Approve hNOBT"}
              </button>
            ) : (
              <button
                onClick={handleStake}
                disabled={!amount || busy}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
              >
                {busy ? "Staking..." : "Confirm Stake"}
              </button>
            )}
            {approveNeeded && (
              <p className="text-[11px] text-amber-600 text-center">You must approve the contract to spend your hNOBT before staking.</p>
            )}

            <p className="text-[11px] text-gray-400 text-center">⚠️ BRT contract transfer tax applies on BRT reward transfers.</p>
            <p className="text-[11px] text-gray-400 text-center">🔒 Early unstake before lock ends: 50% reward penalty + 24h minimum lockdown.</p>
          </div>
        </div>
      )}
    </div>
  );
}
