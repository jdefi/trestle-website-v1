import { http, createConfig } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";
import { authConnector } from "@web3modal/wagmi";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const config = createConfig({
  chains: [polygon, polygonAmoy],
  connectors: [
    walletConnect({ projectId, showQrModal: false }),
    injected(),
    authConnector({
      options: { projectId },
      email: true,
      socials: ["google", "github", "discord", "x"],
      showWallets: true,
      walletFeatures: true,
    }),
  ],
  transports: {
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology", { retryCount: 3, retryDelay: 1000 }),
    [polygon.id]: http("https://polygon.llamarpc.com", { retryCount: 3, retryDelay: 1000 }),
  },
});
