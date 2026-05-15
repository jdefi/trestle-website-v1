import { createSmartAccountClient, ENTRYPOINT_ADDRESS_V07 } from "@biconomy/sdk";
import { http } from "viem";
import { polygon } from "viem/chains";
import type { SmartAccountClient, WalletClient } from "@biconomy/sdk";

let smartAccountClient: SmartAccountClient | null = null;

/**
 * Initialize Biconomy Smart Account
 * @param signer - Wallet signer from wagmi
 * @returns SmartAccountClient
 */
export async function initBiconomy(signer: WalletClient): Promise<SmartAccountClient> {
  if (smartAccountClient) return smartAccountClient;

  const biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/paymaster/${process.env.NEXT_PUBLIC_BICONOMY_API_KEY}`;

  smartAccountClient = await createSmartAccountClient({
    signer,
    paymasterUrl: biconomyPaymasterUrl,
    entryPointAddress: ENTRYPOINT_ADDRESS_V07,
    bundlerUrl: "https://bundler.biconomy.io/api/v1/polygon/rpc",
  });

  return smartAccountClient;
}

/**
 * Get existing Biconomy smart account
 */
export function getSmartAccount(): SmartAccountClient | null {
  return smartAccountClient;
}

/**
 * Reset Biconomy instance
 */
export function resetBiconomy(): void {
  smartAccountClient = null;
}

/**
 * Execute gasless transaction via Biconomy
 * @param signer - Wallet signer
 * @param to - Contract address
 * @param data - Encoded function data
 * @returns Transaction hash
 */
export async function executeBiconomyTransaction(
  signer: WalletClient,
  to: `0x${string}`,
  data: `0x${string}`
): Promise<`0x${string}`> {
  const smartAccount = await initBiconomy(signer);

  const tx = await smartAccount.sendTransaction({
    to,
    data,
  });

  const receipt = await tx.wait();
  return receipt.transactionHash as `0x${string}`;
}