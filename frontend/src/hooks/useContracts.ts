"use client";

import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import { type Address } from "viem";
import { CONTRACTS } from "@/config/contracts";

const ERC20_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], type: "function", stateMutability: "view" },
] as const;

const TIER1_ABI = [
  { inputs: [{ name: "_amount", type: "uint256" }, { name: "_lockPeriod", type: "uint8" }], name: "stake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_account", type: "address" }], name: "userWeightedStake", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedStake", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "rewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_index", type: "uint256" }], name: "withdraw", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_index", type: "uint256" }], name: "earlyUnstake", outputs: [], type: "function", stateMutability: "nonpayable" },
] as const;

const TIER2_ABI = [
  { inputs: [{ name: "_amount", type: "uint256" }, { name: "_lockPeriod", type: "uint8" }, { name: "_referrer", type: "address" }], name: "stake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_account", type: "address" }], name: "getUserTotalWeightedBalance", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedSupply", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "briRewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_stakeIndex", type: "uint256" }], name: "withdraw", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_stakeIndex", type: "uint256" }], name: "earlyUnstake", outputs: [], type: "function", stateMutability: "nonpayable" },
] as const;

const MARKETPLACE_ABI = [
  { inputs: [{ name: "listingId", type: "uint256" }], name: "buy", outputs: [], type: "function", stateMutability: "payable" },
  { inputs: [{ name: "listingId", type: "uint256" }], name: "getListing", outputs: [{ name: "seller", type: "address" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "listingCount", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const PLACEHOLDER = "0x...";
const isReal = (a: string) => a !== PLACEHOLDER && !a.startsWith("0x0000");

const hNOBT = CONTRACTS.mainnet.hNOBT as Address;
const brt = CONTRACTS.mainnet.broilerPlus as Address;
const brtLP = CONTRACTS.mainnet.brtLP as Address;
const tier1Addr = CONTRACTS.mainnet.tier1Staking as Address;
const tier2Addr = CONTRACTS.mainnet.tier2Staking as Address;
const tier3Addr = CONTRACTS.mainnet.tier3Staking as Address;
const marketAddr = CONTRACTS.mainnet.marketplaceCore as Address;

export function useContracts() {
  const { address, isConnected } = useAccount();
  const { data: native } = useBalance({ address });

  const { data: hNOBTBalance } = useReadContract({ abi: ERC20_ABI, address: hNOBT, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: brtBalance } = useReadContract({ abi: ERC20_ABI, address: brt, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: brtLPBalance } = useReadContract({ abi: ERC20_ABI, address: brtLP, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });

  const { writeContractAsync } = useWriteContract();

  return {
    address,
    isConnected,
    nativeBalance: native ? (Number(native.value) / 1e18).toFixed(4) : "0",
    hNOBTBalance: hNOBTBalance?.toString() ?? "0",
    brtBalance: brtBalance?.toString() ?? "0",
    brtLPBalance: brtLPBalance?.toString() ?? "0",
    stakeTier1: (amt: string, lockPeriod: number) =>
      writeContractAsync({ abi: TIER1_ABI, address: tier1Addr, functionName: "stake", args: [BigInt(amt), lockPeriod] } as any),
    withdrawTier1: (index: number) =>
      writeContractAsync({ abi: TIER1_ABI, address: tier1Addr, functionName: "withdraw", args: [BigInt(index)] } as any),
    earlyUnstakeTier1: (index: number) =>
      writeContractAsync({ abi: TIER1_ABI, address: tier1Addr, functionName: "earlyUnstake", args: [BigInt(index)] } as any),
    stakeTier2: (amt: string, lockPeriod: number) =>
      writeContractAsync({ abi: TIER2_ABI, address: tier2Addr, functionName: "stake", args: [BigInt(amt), lockPeriod, "0x0000000000000000000000000000000000000000"] } as any),
    withdrawTier2: (index: number) =>
      writeContractAsync({ abi: TIER2_ABI, address: tier2Addr, functionName: "withdraw", args: [BigInt(index)] } as any),
    earlyUnstakeTier2: (index: number) =>
      writeContractAsync({ abi: TIER2_ABI, address: tier2Addr, functionName: "earlyUnstake", args: [BigInt(index)] } as any),
    depositTier3: (amt: string) =>
      writeContractAsync({ abi: TIER1_ABI, address: tier3Addr, functionName: "stake", args: [BigInt(amt), 1] } as any),
    buyListing: (id: number, value: string) =>
      writeContractAsync({ abi: MARKETPLACE_ABI, address: marketAddr, functionName: "buy", args: [BigInt(id)] } as any),
    marketplaceReady: isReal(marketAddr),
    marketAddr,
    marketABI: MARKETPLACE_ABI,
    tier1Addr,
    tier2Addr,
    TIER1_ABI,
    TIER2_ABI,
  };
}
