"use client";

import { useEffect, useRef } from "react";

export default function W3mButton() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!customElements.get("w3m-button")) {
      import("@web3modal/ui");
    }
    const btn = document.createElement("w3m-button");
    ref.current.innerHTML = "";
    ref.current.appendChild(btn);
  }, []);

  return <div ref={ref} />;
}
