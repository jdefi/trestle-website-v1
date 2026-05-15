"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

const SITE_URL = "https://trestle.website";

export default function QRCode({
  value = SITE_URL,
  size = 180,
  bgColor = "ffffff",
  fgColor = "059669",
}: {
  value?: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}) {
  return (
    <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 inline-block">
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=${fgColor}&bgcolor=${bgColor}&ecc=M`}
        alt="QR Code"
        width={size}
        height={size}
        className="rounded-lg"
      />
      <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
        Scan to open on mobile
      </p>
    </div>
  );
}

export function useWalletSign() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (isConnected && address && !signed) {
      signMessageAsync({
        message: `Welcome to Trestle Protocol! This message confirms your identity. Nonce: ${Date.now()}`,
      })
        .then(() => setSigned(true))
        .catch(() => {});
    }
  }, [isConnected, address, signed, signMessageAsync]);

  return { signed };
}