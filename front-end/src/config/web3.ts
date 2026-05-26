import { http } from "wagmi";
import { fallback } from "viem";
import { polygon } from "wagmi/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

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

const polygonTransports = [
  http("https://polygon-rpc.com", { retryCount: 2, retryDelay: 500 }),
  http("https://polygon.llamarpc.com", { retryCount: 2, retryDelay: 500 }),
  http("https://rpc.ankr.com/polygon", { retryCount: 2, retryDelay: 500 }),
  http("https://polygon.drpc.org", { retryCount: 2, retryDelay: 500 }),
  process.env.NEXT_PUBLIC_BLOCKSCOUT_API ? http(process.env.NEXT_PUBLIC_BLOCKSCOUT_API, { retryCount: 2, retryDelay: 500 }) : null,
].filter(Boolean) as ReturnType<typeof http>[];

const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId,
  networks: [polygon],
  transports: {
    [polygon.id]: fallback(polygonTransports, { rank: true }),
  },
});

export const config = wagmiAdapter.wagmiConfig;

// Get the correct URL based on environment
const getMetadataUrl = () => {
  if (typeof window !== "undefined") {
    // Client-side: use current window location
    return window.location.origin;
  }
  
  // Server-side: check for Vercel or localhost
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default for local development
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [polygon],
  metadata: {
    name: "Trestle DeFi",
    description: "Trestle DeFi Platform",
    url: getMetadataUrl(),
    icons: ["/favicon.ico"],
  },
  features: {
    email: true,
    socials: ["google", "github", "discord"],
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-color-mix": "#059669",
    "--w3m-color-mix-strength": 20,
  },
});
