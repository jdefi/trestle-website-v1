"use client";

import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import { type Address } from "viem";
import { CONTRACTS } from "@/config/contracts";

const ERC20_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], type: "function", stateMutability: "nonpayable" },
] as const;

const STAKE_ABI = [
  { inputs: [{ name: "_amount", type: "uint256" }, { name: "_lockPeriod", type: "uint8" }], name: "stake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_account", type: "address" }], name: "userWeightedStake", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedStake", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "rewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_index", type: "uint256" }], name: "withdraw", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_index", type: "uint256" }], name: "earlyUnstake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [], name: "claimReward", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_account", type: "address" }], name: "earnedNet", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_newContract", type: "address" }, { name: "_index", type: "uint256" }], name: "migrateTo", outputs: [], type: "function", stateMutability: "nonpayable" },
] as const;

const MINE_ABI = [
  { inputs: [{ name: "_amount", type: "uint256" }, { name: "_lockPeriod", type: "uint8" }, { name: "_referrer", type: "address" }], name: "stake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_account", type: "address" }], name: "getUserTotalWeightedBalance", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedSupply", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "briRewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_stakeIndex", type: "uint256" }], name: "withdraw", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_stakeIndex", type: "uint256" }], name: "earlyUnstake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [], name: "claimRewards", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_account", type: "address" }], name: "earnedBriNet", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_newContract", type: "address" }, { name: "_stakeIndex", type: "uint256" }], name: "migrateTo", outputs: [], type: "function", stateMutability: "nonpayable" },
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
const vaultAddr = CONTRACTS.mainnet.vaultStaking as Address;
const marketAddr = CONTRACTS.mainnet.marketplaceCore as Address;
const stakeV1Addr = CONTRACTS.mainnet.stakeStakingV1 as Address;
const mineV1Addr = CONTRACTS.mainnet.mineStakingV1 as Address;
const hNobtCoreAddr = CONTRACTS.mainnet.hNobtCoreStaking as Address;
const broilerCoreAddr = CONTRACTS.mainnet.broilerCoreStaking as Address;

export function useContracts() {
  const { address, isConnected } = useAccount();
  const { data: native } = useBalance({ address });

  const { data: hNOBTBalance } = useReadContract({ abi: ERC20_ABI, address: hNOBT, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: brtBalance } = useReadContract({ abi: ERC20_ABI, address: brt, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: brtLPBalance } = useReadContract({ abi: ERC20_ABI, address: brtLP, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });

  const { writeContractAsync } = useWriteContract();

  const { data: hNOBTCoreAllowance } = useReadContract({ abi: ERC20_ABI, address: hNOBT, functionName: "allowance", args: address ? [address, hNobtCoreAddr] : undefined, query: { enabled: !!address } });
  const { data: lpCoreAllowance } = useReadContract({ abi: ERC20_ABI, address: brtLP, functionName: "allowance", args: address ? [address, broilerCoreAddr] : undefined, query: { enabled: !!address } });

  return {
    address,
    isConnected,
    nativeBalance: native ? (Number(native.value) / 1e18).toFixed(4) : "0",
    hNOBTBalance: hNOBTBalance?.toString() ?? "0",
    brtBalance: brtBalance?.toString() ?? "0",
    brtLPBalance: brtLPBalance?.toString() ?? "0",
    claimReward: () =>
      writeContractAsync({ abi: STAKE_ABI, address: hNobtCoreAddr, functionName: "claimReward", args: [] } as any),
    claimRewards: () =>
      writeContractAsync({ abi: MINE_ABI, address: broilerCoreAddr, functionName: "claimRewards", args: [] } as any),
    withdrawV1Stake: (index: number) =>
      writeContractAsync({ abi: STAKE_ABI, address: stakeV1Addr, functionName: "withdraw", args: [BigInt(index)] } as any),
    earlyUnstakeV1Stake: (index: number) =>
      writeContractAsync({ abi: STAKE_ABI, address: stakeV1Addr, functionName: "earlyUnstake", args: [BigInt(index)] } as any),
    claimV1Reward: () =>
      writeContractAsync({ abi: STAKE_ABI, address: stakeV1Addr, functionName: "claimReward", args: [] } as any),
    withdrawV1Mine: (index: number) =>
      writeContractAsync({ abi: MINE_ABI, address: mineV1Addr, functionName: "withdraw", args: [BigInt(index)] } as any),
    earlyUnstakeV1Mine: (index: number) =>
      writeContractAsync({ abi: MINE_ABI, address: mineV1Addr, functionName: "earlyUnstake", args: [BigInt(index)] } as any),
    claimV1MineRewards: () =>
      writeContractAsync({ abi: MINE_ABI, address: mineV1Addr, functionName: "claimRewards", args: [] } as any),
    migrateV1Stake: (index: number) =>
      writeContractAsync({ abi: STAKE_ABI, address: stakeV1Addr, functionName: "migrateTo", args: [hNobtCoreAddr, BigInt(index)] } as any),
    migrateV1Mine: (index: number) =>
      writeContractAsync({ abi: MINE_ABI, address: mineV1Addr, functionName: "migrateTo", args: [broilerCoreAddr, BigInt(index)] } as any),
    depositVault: (amt: string) =>
      writeContractAsync({ abi: STAKE_ABI, address: vaultAddr, functionName: "stake", args: [BigInt(amt), 1] } as any),
    buyListing: (id: number, value: string) =>
      writeContractAsync({ abi: MARKETPLACE_ABI, address: marketAddr, functionName: "buy", args: [BigInt(id)] } as any),
    approveCoreHnobt: (amt: string) =>
      writeContractAsync({ abi: ERC20_ABI, address: hNOBT, functionName: "approve", args: [hNobtCoreAddr, BigInt(amt)] } as any),
    stakeCoreHnobt: (amt: string, lockPeriod: number) =>
      writeContractAsync({ abi: STAKE_ABI, address: hNobtCoreAddr, functionName: "stake", args: [BigInt(amt), lockPeriod] } as any),
    approveCoreLP: (amt: string) =>
      writeContractAsync({ abi: ERC20_ABI, address: brtLP, functionName: "approve", args: [broilerCoreAddr, BigInt(amt)] } as any),
    stakeCoreLP: (amt: string, lockPeriod: number, referrer?: string) =>
      writeContractAsync({ abi: MINE_ABI, address: broilerCoreAddr, functionName: "stake", args: [BigInt(amt), lockPeriod, referrer || "0x0000000000000000000000000000000000000000"] } as any),
    marketplaceReady: isReal(marketAddr),
    marketAddr,
    marketABI: MARKETPLACE_ABI,
    hNobtCoreAddr,
    broilerCoreAddr,
    hNOBT,
    brtLP,
    hNOBTCoreAllowance: hNOBTCoreAllowance?.toString() ?? "0",
    lpCoreAllowance: lpCoreAllowance?.toString() ?? "0",
    STAKE_ABI,
    MINE_ABI,
  };
}
