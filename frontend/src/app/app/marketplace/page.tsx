"use client";

export default function MarketplacePage() {
  return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-4">
      <span className="text-5xl">🏪</span>
      <h2 className="text-2xl font-bold text-gray-900">Marketplace — Coming Soon</h2>
      <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
        The Trestle marketplace will go live after the security audit and testnet are complete.
        Stay tuned for peer-to-peer trading, milestone escrow, and fractional RWA tokenization.
      </p>
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-sm text-emerald-700 inline-block">
        Follow us on{" "}
        <a href="https://t.me/trestleDeFi" target="_blank" rel="noopener noreferrer" className="underline font-medium">
          Telegram
        </a>{" "}
        for launch announcements.
      </div>
    </div>
  );
}
