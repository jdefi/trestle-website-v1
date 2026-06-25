"use client";

import { useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";

export function useAutoSign() {
  const { address, isConnected, isReconnecting } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const signedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || isReconnecting || signedRef.current) return;
    const msg = `trestle:${address?.toLowerCase()}:${Date.now()}`;
    signMessageAsync({ message: msg }).then((sig) => {
      signedRef.current = true;
      try { sessionStorage.setItem("trestle_sig", sig); } catch {}
    }).catch(() => {});
  }, [isConnected, isReconnecting, address, signMessageAsync]);
}
