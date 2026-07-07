"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { isAddress, parseAbiItem } from "viem";
import { useContracts } from "@/hooks/useContracts";
import { CONTRACTS, DEFAULT_REFERRER } from "@/config/contracts";
import { config } from "@/config/web3";
import { polygon } from "viem/chains";

const ERC20_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const READ_ABI = [
  { inputs: [{ name: "_account", type: "address" }], name: "getUserTotalWeightedBalance", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedSupply", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "briRewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "xgovPointRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_account", type: "address" }], name: "earnedXgovPoints", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_account", type: "address" }], name: "earnedBriNet", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const MINE_MULTS = [14000, 16000, 18000];
const MINE_PERIODS = [180 * 86400, 360 * 86400, 540 * 86400];
const V1_DEPLOY_BLOCK = 89365000n;
const STAKE_STAKED = parseAbiItem("event Staked(address indexed user, uint256 index, uint256 amount, uint256 weightedAmount)");
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
  { label: "6 months", mult: "1.4x", lockPeriod: 1 },
  { label: "12 months", mult: "1.6x", lockPeriod: 2 },
  { label: "18 months", mult: "1.8x", lockPeriod: 3 },
];

const fmt = (n: string | number) => Number(n).toLocaleString("en-US");
const fmtDate = (ts: bigint) => new Date(Number(ts) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const multDisplay = (m: bigint) => (Number(m) / 10000).toFixed(1) + "x";
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

export default function MinePage() {
  const { address, isConnected } = useAccount();
  const { brtBalance, claimRewards, withdrawV1Mine, earlyUnstakeV1Mine, claimV1MineRewards, lpCoreAllowance, broilerCoreAddr, approveCoreLP, stakeCoreLP } = useContracts();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [referrer, setReferrer] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && isAddress(ref)) {
      setReferrer(ref);
    } else {
      setReferrer(DEFAULT_REFERRER);
    }
  }, []);
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

  const lpAddr = CONTRACTS.mainnet.brtLP as `0x${string}`;

  const { data: coreBriRate } = useReadContract({
    abi: READ_ABI, address: broilerCoreAddr, functionName: "briRewardRate",
    query: { refetchInterval: 3_600_000 },
  });
  const { data: coreXgovRate } = useReadContract({
    abi: READ_ABI, address: broilerCoreAddr, functionName: "xgovPointRate",
    query: { refetchInterval: 3_600_000 },
  });
  const { data: coreStakedBal } = useReadContract({
    abi: READ_ABI, address: broilerCoreAddr, functionName: "getUserTotalWeightedBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3_600_000 },
  });
  const { data: coreTotalStaked } = useReadContract({
    abi: READ_ABI, address: broilerCoreAddr, functionName: "totalWeightedSupply",
    query: { refetchInterval: 3_600_000 },
  });
  const { data: coreEarnedXgov } = useReadContract({
    abi: READ_ABI, address: broilerCoreAddr, functionName: "earnedXgovPoints",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3_600_000 },
  });
  const { data: coreEarnedBrt } = useReadContract({
    abi: READ_ABI, address: broilerCoreAddr, functionName: "earnedBriNet",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: lpBalance } = useReadContract({
    abi: ERC20_ABI, address: lpAddr, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const brt = CONTRACTS.mainnet.broilerPlus;
  const brtLP = CONTRACTS.mainnet.brtLP;

  const parsedAmt = amount ? BigInt(Math.floor(parseFloat(amount) * 1e18)) : 0n;
  const allowanceAmt = BigInt(lpCoreAllowance || "0");
  const approveNeeded = parsedAmt > 0n && parsedAmt > allowanceAmt;

  const handleApprove = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try {
      await approveCoreLP(parsedAmt.toString());
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  const handleStake = async () => {
    if (!amount || busy) return;
    setBusy(true);
    try {
      await stakeCoreLP(parsedAmt.toString(), duration.lockPeriod, referrer || DEFAULT_REFERRER);
      setAmount("");
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  const handleClaimRewards = async () => {
    setBusy(true);
    try {
      await claimRewards();
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  const v1Addr = CONTRACTS.mainnet.mineStakingV1 as `0x${string}`;
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
            const weighted = l.args.weightedAmount as bigint;
            const ts = blockTs.get((l as any).blockNumber!.toString()) || 0;
            const cm = Number(weighted * 10000n / amount);
            let mult = MINE_MULTS[0], period = MINE_PERIODS[0];
            if (cm >= 17000) { mult = MINE_MULTS[2]; period = MINE_PERIODS[2]; }
            else if (cm >= 15000) { mult = MINE_MULTS[1]; period = MINE_PERIODS[1]; }
            return { index: idx, amount, lockEndTime: BigInt(ts + period), multiplier: BigInt(mult), stakeTime: BigInt(ts), withdrawn: false };
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
      await withdrawV1Mine(index);
    } catch (e: any) {
      alert(e.message);
    }
    setBusyAction(null);
  };

  const handleV1EarlyUnstake = async (index: number) => {
    setBusyAction({ type: "v1-earlyUnstake", index });
    try {
      await earlyUnstakeV1Mine(index);
    } catch (e: any) {
      alert(e.message);
    }
    setBusyAction(null);
  };

  const handleV1Claim = async () => {
    setBusy(true);
    try {
      await claimV1MineRewards();
    } catch (e: any) {
      alert(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-purple-700">⛏️ Core Mining</h2>
        </div>
        <p className="text-sm text-gray-500">Stake BRT/WPOL LP into the core contract. Earn BRT rewards + xGov points.</p>

        <div className="bg-white rounded-lg border p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">BRT (wallet):</span>
            <span className="font-semibold text-purple-600">{fmt((Number(brtBalance || "0") / 1e9).toFixed(4))} BRT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">BRT/WPOL LP:</span>
            <span className="font-semibold text-purple-600">{fmt((Number(lpBalance?.toString() || "0") / 1e18).toFixed(4))} LP</span>
          </div>
          {coreStakedBal && BigInt(coreStakedBal.toString()) > 0n && (
            <div className="flex justify-between">
              <span className="text-gray-500">Weighted stake:</span>
              <span className="font-semibold">{fmt((Number(coreStakedBal) / 1e18).toFixed(4))} LP</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Core contract:</span>
            <button onClick={() => copyAddr("Core", broilerCoreAddr)} className="text-purple-600 hover:text-purple-800 font-mono text-xs">
              {broilerCoreAddr.slice(0, 8)}...{broilerCoreAddr.slice(-6)}{copiedAddr === "Core" ? " ✅" : " 📋"}
            </button>
          </div>
        </div>

        {(Number(coreEarnedBrt || 0) > 0 || Number(coreEarnedXgov || 0) > 0) && (
          <button onClick={handleClaimRewards} disabled={busy}
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg disabled:opacity-40 transition text-xs"
          >{busy ? "Processing..." : `Claim ${(Number(coreEarnedBrt || 0) / 1e9).toFixed(6)} BRT + ${(Number(coreEarnedXgov || 0) / 1e18).toFixed(2)} xGov`}</button>
        )}

        <button
          onClick={() => setModalOpen(true)}
          disabled={!isConnected}
          className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl disabled:opacity-40 transition"
        >
          {isConnected ? "Stake LP into Core" : "Connect Wallet to Stake"}
        </button>

      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Stake LP into Core Mining</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 space-y-1 text-xs font-mono">
              <p className="text-[10px] text-gray-400 mb-1">Core contract</p>
              {([
                ["BRT LP", brtLP],
                ["BRT", brt],
                ["Core Mining", broilerCoreAddr],
              ] as const).map(([label, addr]) => (
                <button key={label} onClick={() => copyAddr(label, addr)} className="w-full flex justify-between items-center hover:bg-black/5 rounded px-1 -mx-1 transition">
                  <span className="text-gray-500">{label}:</span>
                  <span className="text-gray-700">{addr.slice(0, 8)}...{addr.slice(-6)}{copiedAddr === label ? " ✅" : " 📋"}</span>
                </button>
              ))}
              <p className="text-[10px] text-gray-400 mt-1">Legacy V1: 0x2140...F3c0</p>
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
              <p className="text-gray-700 font-medium">Step 2: Referrer (optional)</p>
              <input
                type="text"
                placeholder="0x... or leave empty"
                value={referrer}
                onChange={e => setReferrer(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono"
              />
              {referrer && !isAddress(referrer) && (
                <p className="text-[11px] text-red-500">Invalid address</p>
              )}
              <p className="text-[10px] text-gray-400">Auto-filled from referral link. Default: {DEFAULT_REFERRER.slice(0, 8)}...{DEFAULT_REFERRER.slice(-4)}</p>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-gray-700 font-medium">Step 3: Enter LP amount</p>
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
                <span className="text-gray-500">Pending BRT:</span>
                <span className="font-medium text-purple-600">{fmt((Number(coreEarnedBrt || 0) / 1e9).toFixed(6))} BRT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pending xGov points:</span>
                <span className="font-medium text-purple-600">{fmt((Number(coreEarnedXgov || 0) / 1e18).toFixed(2))}</span>
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
                          #{s.index + 1} — {fmt((Number(s.amount) / 1e18).toFixed(2))} LP × {multDisplay(s.multiplier)}
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
    </div>
    );
  }
