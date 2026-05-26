"use client";

import { useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";

export default function W3mButton() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleSignMessage = async () => {
    if (!address) return;
    try {
      await signMessageAsync({
        message: `Welcome to Trestle DeFi! By signing this message, you confirm your identity and agree to our Terms of Service. Nonce: ${Date.now()}`,
      });
    } catch {
      // Silently ignore — user may reject
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      handleSignMessage();
    }
  }, [isConnected, address]);

  return (
    <div className="flex items-center gap-2">
      <w3m-button balance="show" />
    </div>
  );
}
