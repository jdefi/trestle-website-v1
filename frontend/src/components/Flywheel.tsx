export default function Flywheel() {
  return (
    <section id="flywheel" className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="mb-8 text-3xl md:text-4xl font-bold text-gray-900">
          The <span className="text-emerald-600">Economic Flywheel</span>
        </h2>
        <p className="mb-12 text-gray-500 max-w-2xl mx-auto">
          Three tokens driving growth, liquidity, and value capture in a self-sustaining loop.
        </p>

        <div className="mt-12 flex justify-center">
          <svg viewBox="0 0 700 700" className="w-full max-w-xl h-auto">
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

            <circle cx="350" cy="350" r="280" fill="none" stroke="#e5e7eb" strokeWidth="2" />
            <circle cx="350" cy="350" r="180" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="8 6" />

            <polygon points="350,100 350,150 400,125" fill="#10b981" opacity="0.2" />
            <polygon points="350,600 350,550 300,575" fill="#8b5cf6" opacity="0.2" />
            <polygon points="600,350 550,350 575,300" fill="#3b82f6" opacity="0.2" />

            <g>
              <circle cx="350" cy="120" r="60" fill="url(#g1)" />
              <text x="350" y="115" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">hNOBT</text>
              <text x="350" y="135" textAnchor="middle" fill="white" fontSize="12">Community Growth</text>
            </g>

            <g>
              <circle cx="580" cy="350" r="60" fill="url(#g2)" />
              <text x="580" y="345" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">BroilerPlus</text>
              <text x="580" y="365" textAnchor="middle" fill="white" fontSize="11">Liquidity Anchor</text>
            </g>

            <g>
              <circle cx="350" cy="580" r="60" fill="url(#g3)" />
              <text x="350" y="575" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Governance</text>
              <text x="350" y="595" textAnchor="middle" fill="white" fontSize="11">Value Capture</text>
            </g>

            <g opacity="0.7">
              <path d="M410,180 Q490,240 550,310" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="8 6" markerEnd="url(#arrow1)" />
              <text x="500" y="230" fontSize="13" fill="#10b981" fontWeight="600">Stake → Mine BRT</text>
            </g>
            <g opacity="0.7">
              <path d="M550,420 Q490,480 410,540" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="8 6" />
              <text x="450" y="480" fontSize="13" fill="#3b82f6" fontWeight="600">LP Stake → Rewards</text>
            </g>
            <g opacity="0.7">
              <path d="M290,540 Q210,480 150,420" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="8 6" />
              <text x="180" y="480" fontSize="13" fill="#8b5cf6" fontWeight="600">Fee Sharing + Vote</text>
            </g>
            <g opacity="0.7">
              <path d="M150,280 Q210,220 290,160" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="8 6" />
              <text x="180" y="220" fontSize="13" fill="#8b5cf6" fontWeight="600">Earn via Tasks</text>
            </g>

            <defs>
              <marker id="arrow1" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
              </marker>
            </defs>
          </svg>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6 text-base text-gray-500 max-w-3xl mx-auto">
          <div className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all duration-300">
            <p className="mb-3 font-semibold text-gray-900 text-xl">1. Earn</p>
            <p>Complete tasks & referrals in Telegram Mini-App to earn hNOBT.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all duration-300">
            <p className="mb-3 font-semibold text-gray-900 text-xl">2. Stake</p>
            <p>Stake hNOBT to mine BroilerPlus. Provide BRT LP liquidity for higher yields.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all duration-300">
            <p className="mb-3 font-semibold text-gray-900 text-xl">3. Govern</p>
            <p>Deposit BRT LP into Governor Vault to earn governance tokens + fee shares.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
