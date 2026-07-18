"use client";

import { useEffect, useState, useRef } from "react";
import QRCodeLib from "qrcode";
import { SITE_URL } from "@/config/contracts";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const externalUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=${fgColor}&bgcolor=${bgColor}&ecc=M`;

    const img = new Image();
    img.onload = () => setImgSrc(externalUrl);
    img.onerror = () => {
      setFallback(true);
      if (canvasRef.current) {
        QRCodeLib.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
        });
      }
    };
    img.src = externalUrl;
  }, [value, size, fgColor, bgColor]);

  return (
    <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 inline-block">
      {fallback ? (
        <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />
      ) : imgSrc ? (
        <img
          src={imgSrc}
          alt="QR Code"
          width={size}
          height={size}
          className="rounded-lg"
        />
      ) : (
        <div style={{ width: size, height: size }} className="rounded-lg bg-gray-50 animate-pulse" />
      )}
      <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
        Scan to open on mobile
      </p>
    </div>
  );
}
