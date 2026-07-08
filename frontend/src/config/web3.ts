import { http } from "viem";
import { fallback } from "viem";
import { polygon } from "viem/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const polygonTransports = [
  http("https://polygon-bor-rpc.publicnode.com", { retryCount: 3, retryDelay: 1000 }),
  http("https://rpc.ankr.com/polygon", { retryCount: 3, retryDelay: 1000 }),
  http("https://1rpc.io/matic", { retryCount: 3, retryDelay: 1000 }),
  http("https://polygon.drpc.org", { retryCount: 3, retryDelay: 1000 }),
];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [polygon],
  transports: {
    [polygon.id]: fallback(polygonTransports, { rank: true }),
  },
  ssr: true,
});

export const config = wagmiAdapter.wagmiConfig;

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [polygon],
  defaultNetwork: polygon,
  enableReconnect: false,
  metadata: {
    name: "Trestle DeFi",
    description: "Trestle DeFi — Stake, Earn, and Own",
    url: "https://trestle.website",
    icons: ["/favicon.ico"],
  },
  allowUnsupportedChain: true,
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

export { polygon };
