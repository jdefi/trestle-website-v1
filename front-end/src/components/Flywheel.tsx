export default function Flywheel() {
  return (
    <section id="flywheel" className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          The <span className="text-emerald-500">Economic Flywheel</span>
        </h2>
        <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
          Three tokens driving growth, liquidity, and value capture in a self-sustaining loop.
        </p>

        <div className="mt-16 flex justify-center">
          <svg viewBox="0 0 600 600" className="w-full max-w-lg h-auto">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>

            <circle cx="300" cy="300" r="220" fill="none" stroke="#e5e7eb" strokeWidth="2" />
            <circle cx="300" cy="300" r="140" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="6 4" />

            <polygon points="300,80 300,120 340,100" fill="#10b981" opacity="0.3" />
            <polygon points="300,520 300,480 260,500" fill="#8b5cf6" opacity="0.3" />
            <polygon points="520,300 480,300 500,260" fill="#3b82f6" opacity="0.3" />

            <g>
              <circle cx="300" cy="100" r="48" fill="url(#g1)" />
              <text x="300" y="94" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">hNOBT</text>
              <text x="300" y="110" textAnchor="middle" fill="white" fontSize="10">Community Growth</text>
            </g>

            <g>
              <circle cx="500" cy="300" r="48" fill="url(#g2)" />
              <text x="500" y="294" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">BroilerPlus</text>
              <text x="500" y="310" textAnchor="middle" fill="white" fontSize="10">Liquidity Anchor</text>
            </g>

            <g>
              <circle cx="300" cy="500" r="48" fill="url(#g3)" />
              <text x="300" y="494" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Governance</text>
              <text x="300" y="510" textAnchor="middle" fill="white" fontSize="10">Value Capture</text>
            </g>

            <g opacity="0.6">
              <path d="M340,140 Q420,200 460,270" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arrow1)" />
              <text x="420" y="190" fontSize="11" fill="#10b981" fontWeight="600">Stake → Mine BRT</text>
            </g>
            <g opacity="0.6">
              <path d="M460,340 Q420,400 340,460" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />
              <text x="420" y="410" fontSize="11" fill="#3b82f6" fontWeight="600">LP Stake → Rewards</text>
            </g>
            <g opacity="0.6">
              <path d="M260,460 Q180,400 140,340" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="6 4" />
              <text x="170" y="410" fontSize="11" fill="#8b5cf6" fontWeight="600">Fee Sharing + Vote</text>
            </g>
            <g opacity="0.6">
              <path d="M140,260 Q180,200 260,140" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="6 4" />
              <text x="170" y="190" fontSize="11" fill="#8b5cf6" fontWeight="600">Earn via Tasks</text>
            </g>
          </svg>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4 text-sm text-gray-500 max-w-3xl mx-auto">
          <div className="p-4 bg-white rounded-xl border">
            <p className="font-semibold text-gray-900">1. Earn</p>
            <p className="mt-1">Complete tasks & referrals in Telegram Mini-App to earn hNOBT.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border">
            <p className="font-semibold text-gray-900">2. Stake</p>
            <p className="mt-1">Stake hNOBT to mine BroilerPlus. Provide BRT LP liquidity for higher yields.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border">
            <p className="font-semibold text-gray-900">3. Govern</p>
            <p className="mt-1">Deposit BRT LP into Governor Vault to earn governance tokens + fee shares.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
