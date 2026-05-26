"use client";

import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import { type Address } from "viem";
import { CONTRACTS } from "@/config/contracts";

const ERC20_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], type: "function", stateMutability: "view" },
] as const;

const STAKING_ABI = [
  { inputs: [{ name: "amount", type: "uint256" }], name: "stake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "amount", type: "uint256" }], name: "unstake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "", type: "address" }], name: "stakedBalance", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalStaked", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "rewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const TIER3_ABI = [
  { inputs: [{ name: "assets", type: "uint256" }], name: "deposit", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "shares", type: "uint256" }], name: "withdraw", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalAssets", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const MARKETPLACE_ABI = [
  { inputs: [{ name: "listingId", type: "uint256" }], name: "buy", outputs: [], type: "function", stateMutability: "payable" },
  { inputs: [{ name: "listingId", type: "uint256" }], name: "getListing", outputs: [{ name: "seller", type: "address" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "listingCount", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const PLACEHOLDER = "0x...";
const isReal = (a: string) => a !== PLACEHOLDER && !a.startsWith("0x0000");

const hNOBT = CONTRACTS.amoy.hNOBT as Address;
const brt = CONTRACTS.amoy.broilerPlus as Address;
const tier1Addr = CONTRACTS.amoy.tier1Staking as Address;
const tier2Addr = CONTRACTS.amoy.tier2Staking as Address;
const tier3Addr = CONTRACTS.amoy.tier3Vault as Address;
const marketAddr = CONTRACTS.amoy.marketplaceCore as Address;

export function useContracts() {
  const { address, isConnected } = useAccount();
  const { data: native } = useBalance({ address });

  const { data: hNOBTBalance } = useReadContract({ abi: ERC20_ABI, address: hNOBT, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: brtBalance } = useReadContract({ abi: ERC20_ABI, address: brt, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });

  const { writeContractAsync } = useWriteContract();
  const write = (payload: Parameters<typeof writeContractAsync>[0]) =>
    writeContractAsync(payload as any);

  const stake = (addr: Address, abi: typeof STAKING_ABI, amount: string) =>
    write({ abi, address: addr, functionName: "stake", args: [amount] } as any);

  const unstake = (addr: Address, abi: typeof STAKING_ABI, amount: string) =>
    write({ abi, address: addr, functionName: "unstake", args: [amount] } as any);

  return {
    address,
    isConnected,
    nativeBalance: native ? (Number(native.value) / 1e18).toFixed(4) : "0",
    hNOBTBalance: hNOBTBalance?.toString() ?? "0",
    brtBalance: brtBalance?.toString() ?? "0",
    stakeTier1: (amt: string) => stake(tier1Addr, STAKING_ABI, amt),
    unstakeTier1: (amt: string) => unstake(tier1Addr, STAKING_ABI, amt),
    stakeTier2: (amt: string) => stake(tier2Addr, STAKING_ABI, amt),
    unstakeTier2: (amt: string) => unstake(tier2Addr, STAKING_ABI, amt),
    depositTier3: (amt: string) =>
      write({ abi: TIER3_ABI, address: tier3Addr, functionName: "deposit", args: [amt] } as any),
    buyListing: (id: number, value: string) =>
      write({ abi: MARKETPLACE_ABI, address: marketAddr, functionName: "buy", args: [BigInt(id)] } as any),
    marketplaceReady: isReal(marketAddr),
    marketAddr,
    marketABI: MARKETPLACE_ABI,
  };
}
