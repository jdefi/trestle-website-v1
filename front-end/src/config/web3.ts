import { http, createConfig } from "wagmi";
import { fallback } from "viem";
import { polygon } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";
import { authConnector } from "@web3modal/wagmi";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

// Biconomy configuration for gasless transactions
export const biconomyConfig = {
  apiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY || "",
  contractAddresses: [
    process.env.NEXT_PUBLIC_DISTRIBUTOR_ADDRESS || "",
  ],
  strictMode: true,
};

export const biconomyPaymaster = biconomyConfig.apiKey
  ? `https://paymaster.biconomy.io/api/v1/paymaster/${biconomyConfig.apiKey}`
  : "";

// Polygon mainnet RPC providers with fallback for load balancing
const polygonTransports = [
  http("https://polygon-rpc.com", { retryCount: 2, retryDelay: 500 }),
  http("https://polygon.llamarpc.com", { retryCount: 2, retryDelay: 500 }),
  http("https://rpc.ankr.com/polygon", { retryCount: 2, retryDelay: 500 }),
  http("https://polygon.drpc.org", { retryCount: 2, retryDelay: 500 }),
  process.env.NEXT_PUBLIC_BLOCKSCOUT_API ? http(process.env.NEXT_PUBLIC_BLOCKSCOUT_API, { retryCount: 2, retryDelay: 500 }) : null,
].filter(Boolean) as ReturnType<typeof http>[];

export const config = createConfig({
  chains: [polygon],
  connectors: [
    walletConnect({ projectId, showQrModal: false }),
    injected(),
    authConnector({
      options: { projectId },
      email: true,
      socials: ["google", "github", "discord"],
      showWallets: true,
      walletFeatures: true,
    }),
  ],
  transports: {
    [polygon.id]: fallback(polygonTransports, { rank: true }),
  },
});