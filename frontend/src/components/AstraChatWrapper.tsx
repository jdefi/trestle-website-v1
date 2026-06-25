"use client";

import dynamic from "next/dynamic";

const AstraChat = dynamic(() => import("@/components/AstraChat"), { ssr: false });

export default function AstraChatWrapper() {
  return <AstraChat />;
}
