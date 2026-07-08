"use client";

import { useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";

const KEY = "trestle_signed";

export function useAutoSign() {
  const { address, isConnected, isReconnecting } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isConnected || isReconnecting) return;
    if (!address) return;
    try {
      if (sessionStorage.getItem(KEY) === address.toLowerCase()) return;
    } catch { return; }
    try { sessionStorage.setItem(KEY, address.toLowerCase()); } catch {}
    const msg = `trestle:${address.toLowerCase()}:${Date.now()}`;
    signMessageAsync({ message: msg }).then((sig) => {
      try {
        sessionStorage.setItem("trestle_sig", sig);
      } catch {}
    }).catch(() => {});
  }, [isConnected, isReconnecting, address, signMessageAsync]);
}
