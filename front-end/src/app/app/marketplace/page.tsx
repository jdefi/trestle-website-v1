"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "@/hooks/useContracts";
import { getContract } from "thirdweb";
import { useReadContract } from "thirdweb/react";
import { client, chain } from "@/config/web3";
import { CONTRACTS } from "@/config/contracts";
import { treMindChat } from "@/lib/treMind";

const MARKETPLACE_ABI = [
  { inputs: [{ name: "listingId", type: "uint256" }], name: "getListing", outputs: [{ name: "seller", type: "address" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }], type: "function", stateMutability: "view" },
  { inputs: [], name: "listingCount", outputs: [{ name: "", type: "uint256" }], type: "function", stateMutability: "view" },
] as const;

export default function MarketplacePage() {
  const account = useActiveAccount();
  const isConnected = !!account;
  const { buyListing } = useContracts();
  const [busy, setBusy] = useState<number | null>(null);

  const mc = getContract({ client, chain, address: CONTRACTS.amoy.marketplaceCore, abi: MARKETPLACE_ABI });
  const { data: count } = useReadContract({ contract: mc, method: "listingCount" });
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
            <ListingCard key={id} id={id} onBuy={buy} busy={busy === id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ id, onBuy, busy }: { id: number; onBuy: (id: number, price: string) => void; busy: boolean }) {
  const mc = getContract({ client, chain, address: CONTRACTS.amoy.marketplaceCore, abi: MARKETPLACE_ABI });
  const { data } = useReadContract({ contract: mc, method: "getListing", params: [BigInt(id)] });

  if (!data || !(data as any)[2]) return null;
  const [seller, price, active] = data as [string, bigint, boolean];
  if (!active) return null;

  return (
    <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Listing #{id}</p>
        <p className="text-xs text-gray-500">Seller: {seller.slice(0, 6)}...{seller.slice(-4)}</p>
        <p className="text-sm font-semibold text-emerald-600 mt-1">{price.toString()} wei</p>
      </div>
      <button onClick={() => onBuy(id, price.toString())} disabled={busy}
        className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50">
        {busy ? "Buying..." : "Buy"}
      </button>
    </div>
  );
}
