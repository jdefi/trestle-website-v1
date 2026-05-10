const phases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    date: "Q1-Q2 2025",
    items: ["Telegram Mini-App with social login", "hNOBT & BroilerPlus live on Polygon", "Account Abstraction (ERC-4337)", "Airdrop & referral programs"],
  },
  {
    phase: "Phase 2",
    title: "The Flywheel",
    date: "Q3-Q4 2025",
    items: ["hNOBT staking → mine BroilerPlus", "BroilerPlus LP mining program", "Governor Vaults (Tier 3)", "Kleros escrow integration"],
  },
  {
    phase: "Phase 3",
    title: "Marketplace & RWA",
    date: "2026",
    items: ["Decentralized marketplace live", "Fractional RWA tokenization", "Chainlink oracle integration", "Multi-chain expansion"],
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
    <section id="roadmap" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">Roadmap</h2>
        <p className="mt-4 text-gray-500 text-center max-w-2xl mx-auto">
          Milestone-driven development prioritizing security over speed.
        </p>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((p, i) => (
            <div key={p.phase} className="relative">
              <div className="p-6 bg-white rounded-2xl border border-gray-100 h-full">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  {p.phase}
                </span>
                <h3 className="mt-3 text-lg font-bold text-gray-900">{p.title}</h3>
                <p className="text-xs text-gray-400 font-medium">{p.date}</p>
                <ul className="mt-4 space-y-2">
                  {p.items.map((item) => (
                    <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">&#10003;</span>
                      {item}
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
