"use client";

import { getContract } from "thirdweb";
import { useActiveAccount, useReadContract, useSendTransaction, useWalletBalance } from "thirdweb/react";
import { client, chain } from "@/config/web3";
import { CONTRACTS } from "@/config/contracts";
import { prepareContractCall } from "thirdweb";

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

const hNOBT = () => getContract({ client, chain, address: CONTRACTS.amoy.hNOBT, abi: ERC20_ABI });
const brt = () => getContract({ client, chain, address: CONTRACTS.amoy.broilerPlus, abi: ERC20_ABI });
const tier1 = () => getContract({ client, chain, address: CONTRACTS.amoy.tier1Staking, abi: STAKING_ABI });
const tier2 = () => getContract({ client, chain, address: CONTRACTS.amoy.tier2Staking, abi: STAKING_ABI });
const tier3 = () => getContract({ client, chain, address: CONTRACTS.amoy.tier3Vault, abi: TIER3_ABI });
const marketplace = () => getContract({ client, chain, address: CONTRACTS.amoy.marketplaceCore, abi: MARKETPLACE_ABI });

export function useContracts() {
  const account = useActiveAccount();
  const { mutate: sendTx } = useSendTransaction();
  const { data: nativeBalance } = useWalletBalance({ address: account?.address, chain, client });
  const addr = account?.address;
  const { data: hNOBTBalance } = useReadContract({ contract: hNOBT(), method: "balanceOf", params: addr ? [addr] : ([] as any) });
  const { data: brtBalance } = useReadContract({ contract: brt(), method: "balanceOf", params: addr ? [addr] : ([] as any) });

  const stake = async (contract: ReturnType<typeof getContract>, amount: string) => {
    const tx = await (prepareContractCall as any)({ contract: contract as any, method: "stake", params: [amount] });
    await (sendTx as any)(tx);
  };

  const unstake = async (contract: ReturnType<typeof getContract>, amount: string) => {
    const tx = await (prepareContractCall as any)({ contract: contract as any, method: "unstake", params: [amount] });
    await (sendTx as any)(tx);
  };

  const buyListing = async (listingId: number, value: string) => {
    const tx = await (prepareContractCall as any)({ contract: marketplace() as any, method: "buy", params: [BigInt(listingId)], value: BigInt(value) });
    await (sendTx as any)(tx);
  };

  return {
    address: account?.address,
    isConnected: !!account,
    nativeBalance: nativeBalance?.displayValue ?? "0",
    hNOBTBalance: hNOBTBalance?.toString() ?? "0",
    brtBalance: brtBalance?.toString() ?? "0",
    stakeTier1: (amt: string) => stake(tier1(), amt),
    stakeTier2: (amt: string) => stake(tier2(), amt),
    stakeTier3: (amt: string) => stake(tier3(), amt),
    unstakeTier1: (amt: string) => unstake(tier1(), amt),
    unstakeTier2: (amt: string) => unstake(tier2(), amt),
    unstakeTier3: (amt: string) => unstake(tier3(), amt),
    depositTier3: async (amt: string) => {
      const tx = await (prepareContractCall as any)({ contract: tier3() as any, method: "deposit", params: [amt] });
      await (sendTx as any)(tx);
    },
    buyListing,
  };
}
