"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import QRCode from "./QRCode";

export default function W3mButton() {
  const ref = useRef<HTMLDivElement>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleSignMessage = async () => {
    if (!address) return;
    try {
      await signMessageAsync({
        message: `Welcome to Trestle Protocol! By signing this message, you confirm your identity and agree to our Terms of Service. Nonce: ${Date.now()}`,
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
      {isConnected && (
        <>
          <button
            onClick={() => setQrOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <span className="text-base">📱</span>
            <span className="hidden lg:inline">Mobile</span>
          </button>
          {qrOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                 onClick={() => setQrOpen(false)}>
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100"
                   onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Open on mobile</span>
                  <button onClick={() => setQrOpen(false)}
                          className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>
                <QRCode value={typeof window !== "undefined" ? window.location.href : "https://trestle.website"} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}