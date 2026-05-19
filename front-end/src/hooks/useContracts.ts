"use client";

import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import { polygon } from "wagmi/chains";
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

const getContractAddresses = () => {
  return {
    marketAddr: CONTRACTS.polygon.marketplaceCore as Address,
    tier1Addr: CONTRACTS.polygon.tier1Staking as Address,
    tier2Addr: CONTRACTS.polygon.tier2Staking as Address,
    tier3Addr: CONTRACTS.polygon.tier3Vault as Address,
  };
};

export function useContracts() {
  const { address, isConnected } = useAccount();
  const { data: native } = useBalance({ address, chainId: polygon.id });
  const contracts = getContractAddresses();

  // Query tokens on the wallet's connected chain
  const { data: hNOBTBalance, error: hNOBTErr } = useReadContract({ 
    abi: ERC20_ABI, 
    address: CONTRACTS.polygon.hNOBT as Address, 
    functionName: "balanceOf", 
    args: address ? [address] : undefined, 
    chainId: polygon.id, 
    query: { enabled: !!address && isReal(CONTRACTS.polygon.hNOBT) } 
  });
  const { data: brtBalance, error: brtErr } = useReadContract({ 
    abi: ERC20_ABI, 
    address: CONTRACTS.polygon.broilerPlus as Address, 
    functionName: "balanceOf", 
    args: address ? [address] : undefined, 
    chainId: polygon.id, 
    query: { enabled: !!address && isReal(CONTRACTS.polygon.broilerPlus) } 
  });

  if (hNOBTErr) console.error("hNOBT balance error:", hNOBTErr);
  if (brtErr) console.error("BRT balance error:", brtErr);

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
    stakeTier1: (amt: string) => stake(contracts.tier1Addr, STAKING_ABI, amt),
    unstakeTier1: (amt: string) => unstake(contracts.tier1Addr, STAKING_ABI, amt),
    stakeTier2: (amt: string) => stake(contracts.tier2Addr, STAKING_ABI, amt),
    unstakeTier2: (amt: string) => unstake(contracts.tier2Addr, STAKING_ABI, amt),
    depositTier3: (amt: string) =>
      write({ abi: TIER3_ABI, address: contracts.tier3Addr, functionName: "deposit", args: [amt] } as any),
    buyListing: (id: number, value: string) =>
      write({ abi: MARKETPLACE_ABI, address: contracts.marketAddr, functionName: "buy", args: [BigInt(id)] } as any),
    marketplaceReady: isReal(contracts.marketAddr),
    marketAddr: contracts.marketAddr,
    marketABI: MARKETPLACE_ABI,
  };
}
