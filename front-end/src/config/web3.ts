import { http, createConfig } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
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

export const config = createConfig({
  chains: [polygon, polygonAmoy],
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
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology", {
      retryCount: 3,
      retryDelay: 1000,
    }),
    [polygon.id]: http("https://polygon.llamarpc.com", {
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});