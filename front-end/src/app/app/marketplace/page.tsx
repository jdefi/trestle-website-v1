"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { useContracts } from "@/hooks/useContracts";

export default function MarketplacePage() {
  const { isConnected } = useAccount();
  const { buyListing, marketplaceReady, marketAddr, marketABI } = useContracts();
  const [busy, setBusy] = useState<number | null>(null);

  const { data: count } = useReadContract({
    abi: marketABI,
    address: marketAddr,
    functionName: "listingCount",
    query: { enabled: marketplaceReady },
  });
  const listingCount = Number(count || 0);

  const buy = async (id: number, price: string) => {
    setBusy(id);
    try { await buyListing(id, price); }
    catch (e: any) { alert(e.message); }
    setBusy(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Marketplace</h2>
      {!isConnected ? (
        <p className="text-gray-500 text-sm">Connect wallet to browse listings.</p>
      ) : listingCount === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          <p>No listings yet. Be the first seller!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: listingCount }, (_, i) => i + 1).map((id) => (
            <ListingCard key={id} id={id} addr={marketAddr} abi={marketABI} onBuy={buy} busy={busy === id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ id, addr, abi, onBuy, busy }: { id: number; addr: `0x${string}`; abi: readonly any[]; onBuy: (id: number, price: string) => void; busy: boolean }) {
  const { data } = useReadContract({
    abi,
    address: addr,
    functionName: "getListing",
    args: [BigInt(id)],
    query: { enabled: true },
  });

  if (!data) return null;
  const listing = data as [string, bigint, boolean];
  const [seller, price, active] = listing;
  if (!active) return null;

  return (
    <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Listing #{id}</p>
        <p className="text-xs text-gray-500">Seller: {seller.slice(0, 6)}...{seller.slice(-4)}</p>
        <p className="text-sm font-semibold text-emerald-600 mt-1">{Number(price) / 1e18} MATIC</p>
      </div>
      <button onClick={() => onBuy(id, (Number(price) / 1e18).toString())} disabled={busy}
        className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50">
        {busy ? "Buying..." : "Buy"}
      </button>
    </div>
  );
}
