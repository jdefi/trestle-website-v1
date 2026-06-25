"use client";

import "@reown/appkit/react";
import { useAutoSign } from "@/hooks/useAutoSign";

export default function W3mButton() {
  useAutoSign();

  return (
    <div className="flex items-center gap-2">
      <w3m-button balance="show" />
    </div>
  );
}
