"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/config/web3";
import AutoCloseNetworkModal from "./AutoCloseNetworkModal";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <AutoCloseNetworkModal />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
