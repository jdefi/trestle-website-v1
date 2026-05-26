"use client";

import { useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";

export default function W3mButton() {
  const ref = useRef<HTMLDivElement>(null);
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
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const btn = document.createElement("w3m-button");
    ref.current.appendChild(btn);
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && address) {
      handleSignMessage();
    }
  }, [isConnected, address]);

  return (
    <div className="flex items-center gap-2">
      <div ref={ref} />
    </div>
  );
}