"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

export default function W3mButton() {
  const ref = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();

  useEffect(() => {
    // Initialize web3modal button on mount and when connection state changes
    if (!ref.current) return;

    // Clear previous content
    ref.current.innerHTML = '';

    // Create web3modal button element
    const btn = document.createElement("w3m-button");
    ref.current.appendChild(btn);

    // If we have a web3modal instance, we can trigger it to show
    // But typically, just having the element in DOM is enough for it to work
  }, [isConnected]); // Re-run effect if connection state changes

  return <div ref={ref} />;
}
