"use client";

import dynamic from "next/dynamic";

const TreMindChat = dynamic(() => import("@/components/TreMindChat"), { ssr: false });

export default function TreMindChatWrapper() {
  return <TreMindChat />;
}
