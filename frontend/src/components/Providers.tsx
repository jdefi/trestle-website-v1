"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { config, projectId } from "@/config/web3";
import { useEffect, useRef } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      createWeb3Modal({
        wagmiConfig: config,
        projectId,
        themeMode: "light",
        themeVariables: {
          "--w3m-color-mix": "#059669",
          "--w3m-color-mix-strength": 20,
        },
        walletFeatures: {
          onramp: false,
          swap: false,
          send: false,
          receive: false,
        },
      });
      initialized.current = true;
    }
  }, [config, projectId]);

  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}