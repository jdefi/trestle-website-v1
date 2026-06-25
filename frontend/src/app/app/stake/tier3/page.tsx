"use client";

export default function VaultPage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">🏦 Vault: Governance Staking</h2>
      <p className="text-sm text-gray-500">Stake Governance tokens to earn protocol fee share and voting power.</p>

      <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 text-sm text-purple-700">
        <p className="font-medium">Loyalty Multipliers</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>1 month: 1x rewards</li>
          <li>6 months: 1.5x rewards</li>
          <li>1 year: 2x rewards</li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800 text-center space-y-2">
        <p className="font-semibold text-base">🚧 Coming Soon</p>
        <p>
          The Governance Vault is not yet deployed. Staking GOV tokens for fee
          share and voting power will be available in a future release.
        </p>
      </div>

      <button
        disabled
        className="w-full py-3 bg-purple-300 text-white rounded-lg font-medium cursor-not-allowed"
      >
        Stake GOV — Coming Soon
      </button>
    </div>
  );
}
