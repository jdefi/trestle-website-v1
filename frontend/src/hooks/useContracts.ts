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
  { inputs: [{ name: "_account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "LOCKDOWN_24H", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "LOCK_3M", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "LOCK_6M", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "LOCK_12M", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

const MINE_ABI = [
  { inputs: [{ name: "_amount", type: "uint256" }, { name: "_lockPeriod", type: "uint8" }, { name: "_referrer", type: "address" }], name: "stake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_account", type: "address" }], name: "getUserTotalWeightedBalance", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "totalWeightedSupply", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "briRewardRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "xgovPointRate", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_stakeIndex", type: "uint256" }], name: "withdraw", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_stakeIndex", type: "uint256" }], name: "earlyUnstake", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [], name: "claimRewards", outputs: [], type: "function", stateMutability: "nonpayable" },
  { inputs: [{ name: "_account", type: "address" }], name: "earnedBriNet", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [{ name: "_account", type: "address" }], name: "earnedXgovPoints", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "LOCKDOWN_24H", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

export const LOCKDOWN_24H_SECONDS = 86400;

const hNOBT = CONTRACTS.mainnet.hNOBT as Address;
const brt = CONTRACTS.mainnet.broilerPlus as Address;
const brtLP = CONTRACTS.mainnet.brtLP as Address;
const hNobtCoreAddr = CONTRACTS.mainnet.hNobtCoreStaking as Address;
const broilerCoreAddr = CONTRACTS.mainnet.broilerCoreStaking as Address;

export function useContracts() {
  const { address, isConnected } = useAccount();
  const { data: native } = useBalance({ address });

  const { data: hNOBTBalance } = useReadContract({ abi: ERC20_ABI, address: hNOBT, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: brtBalance } = useReadContract({ abi: ERC20_ABI, address: brt, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: brtLPBalance } = useReadContract({ abi: ERC20_ABI, address: brtLP, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });

  const { writeContractAsync } = useWriteContract();

  const { data: hNOBTCoreAllowance } = useReadContract({ abi: ERC20_ABI, address: hNOBT, functionName: "allowance", args: address ? [address, hNobtCoreAddr] : undefined, query: { enabled: !!address, refetchInterval: 5000 } });
  const { data: lpCoreAllowance } = useReadContract({ abi: ERC20_ABI, address: brtLP, functionName: "allowance", args: address ? [address, broilerCoreAddr] : undefined, query: { enabled: !!address, refetchInterval: 5000 } });

  return {
    address,
    isConnected,
    nativeBalance: native ? (Number(native.value) / 1e18).toFixed(4) : "0",
    hNOBTBalance: hNOBTBalance?.toString() ?? "0",
    brtBalance: brtBalance?.toString() ?? "0",
    brtLPBalance: brtLPBalance?.toString() ?? "0",
    claimRewardStake: () =>
      writeContractAsync({ abi: STAKE_ABI, address: hNobtCoreAddr, functionName: "claimReward", args: [] } as any),
    claimRewardsMine: () =>
      writeContractAsync({ abi: MINE_ABI, address: broilerCoreAddr, functionName: "claimRewards", args: [] } as any),
    withdrawStake: (index: number) =>
      writeContractAsync({ abi: STAKE_ABI, address: hNobtCoreAddr, functionName: "withdraw", args: [BigInt(index)] } as any),
    earlyUnstakeStake: (index: number) =>
      writeContractAsync({ abi: STAKE_ABI, address: hNobtCoreAddr, functionName: "earlyUnstake", args: [BigInt(index)] } as any),
    withdrawMine: (index: number) =>
      writeContractAsync({ abi: MINE_ABI, address: broilerCoreAddr, functionName: "withdraw", args: [BigInt(index)] } as any),
    earlyUnstakeMine: (index: number) =>
      writeContractAsync({ abi: MINE_ABI, address: broilerCoreAddr, functionName: "earlyUnstake", args: [BigInt(index)] } as any),
    approveCoreHnobt: (amt: string) =>
      writeContractAsync({ abi: ERC20_ABI, address: hNOBT, functionName: "approve", args: [hNobtCoreAddr, BigInt(amt)] } as any),
    stakeCoreHnobt: (amt: string, lockPeriod: number) =>
      writeContractAsync({ abi: STAKE_ABI, address: hNobtCoreAddr, functionName: "stake", args: [BigInt(amt), lockPeriod] } as any),
    approveCoreLP: (amt: string) =>
      writeContractAsync({ abi: ERC20_ABI, address: brtLP, functionName: "approve", args: [broilerCoreAddr, BigInt(amt)] } as any),
    stakeCoreLP: (amt: string, lockPeriod: number, referrer?: string) =>
      writeContractAsync({ abi: MINE_ABI, address: broilerCoreAddr, functionName: "stake", args: [BigInt(amt), lockPeriod, referrer || "0x0000000000000000000000000000000000000000"] } as any),
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
