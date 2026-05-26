import { createSmartAccountClient } from "@biconomy/sdk";
import { http } from "viem";
import { polygon } from "viem/chains";

let smartAccountClient: any = null;

/**
 * Initialize Biconomy Smart Account
 * @param signer - Wallet signer from wagmi
 * @returns SmartAccountClient
 */
export async function initBiconomy(signer: any) {
  if (smartAccountClient) return smartAccountClient;

  smartAccountClient = await createSmartAccountClient({
    signer,
    chain: polygon,
    transport: http("https://polygon.llamarpc.com"),
    bundlerTransport: http("https://bundler.biconomy.io/api/v1/polygon/rpc"),
    paymaster: true,
  });

  return smartAccountClient;
}

/**
 * Get existing Biconomy smart account
 */
export function getSmartAccount() {
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
  signer: any,
  to: `0x${string}`,
  data: `0x${string}`
): Promise<`0x${string}`> {
  const smartAccount = await initBiconomy(signer);

  const tx = await smartAccount.sendTransaction({
    chain: polygon,
    to,
    data,
  });

  return tx as `0x${string}`;
}