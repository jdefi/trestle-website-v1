const phases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    date: "Q1-Q3 2025",
    items: ["Telegram Mini-App with social login", "hNOBT & BroilerPlus live on Polygon", "Account Abstraction (ERC-4337)", "Airdrop & referral programs"],
  },
  {
    phase: "Phase 2",
    title: "Marketplace & RWA",
    date: "Q3 2025 - Q1/Q2 2026",
    items: ["Decentralized marketplace live", "Fractional RWA tokenization", "Chainlink oracle integration", "Multi-chain expansion"],
  },
  {
    phase: "Phase 3",
    title: "The Flywheel",
    date: "Q2 2026",
    items: ["hNOBT staking → mine BroilerPlus", "BroilerPlus LP mining program", "Governor Vaults (Tier 3)", "Kleros escrow integration"],
  },
  {
    phase: "Phase 4",
    title: "Scaling",
    date: "2027+",
    items: ["Cross-chain bridges", "Institutional RWA partnerships", "AI-powered freelancer tools", "Self-sustaining economic flywheel"],
  },
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="py-20 bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="mb-8 text-3xl md:text-4xl font-bold text-center text-gray-900">
          Roadmap
        </h2>
        <p className="mb-16 text-gray-500 text-center max-w-2xl mx-auto">
          Milestone-driven development prioritizing security over speed.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((p, i) => (
            <div key={p.phase} className="relative group">
              <div className={`p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-emerald-100 
                            transition-all duration-300 transform hover:-translate-y-1`}>
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-full">
                  {p.phase}
                </span>
                <h3 className="mt-5 text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-xs text-gray-400 font-medium">{p.date}</p>
                <ul className="mt-6 space-y-3">
                  {p.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                      <div className="flex-shrink-0 w-3 h-3 bg-emerald-500 rounded-full mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
