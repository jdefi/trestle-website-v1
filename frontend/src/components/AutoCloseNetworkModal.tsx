"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

export default function AutoCloseNetworkModal() {
  const { chainId } = useAccount();
  const { close } = useAppKit();
  const wasWrongChain = useRef(false);

  useEffect(() => {
    if (chainId && chainId !== 137) {
      wasWrongChain.current = true;
    }
    if (chainId === 137 && wasWrongChain.current) {
      wasWrongChain.current = false;
      close();
    }
  }, [chainId, close]);

  return null;
}
