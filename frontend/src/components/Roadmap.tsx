const phases = [
  {
    phase: "Phase 1",
    title: "Foundation",
    date: "Q1-Q3 2025",
    items: [
      { text: "Telegram Mini-App with social login", status: "completed" as const },
      { text: "hNOBT & BroilerPlus live on Polygon", status: "completed" as const },
      { text: "Airdrop & referral programs", status: "completed" as const },
    ],
  },
  {
    phase: "Phase 2",
    title: "Marketplace & RWA",
    date: "Q3 2025 - Q1/Q2 2026",
    items: [
      { text: "Decentralized marketplace live", status: "deploying" as const },
      { text: "Fractional RWA tokenization", status: "pending" as const },
      { text: "Chainlink oracle integration", status: "completed" as const },
      { text: "Multi-chain expansion", status: "completed" as const },
    ],
  },
  {
    phase: "Phase 3",
    title: "The Flywheel",
    date: "Q2 2026",
    items: [
      { text: "Stake hNOBT, mine BRT via LP staking", status: "completed" as const },
      { text: "BroilerPlus LP mining program", status: "completed" as const },
      { text: "Governor Vaults (Tier 3)", status: "deploying" as const },
      { text: "Kleros escrow integration", status: "pending" as const },
    ],
  },
  {
    phase: "Phase 4",
    title: "Scaling",
    date: "2027+",
    items: [
      { text: "Cross-chain bridges", status: "pending" as const },
      { text: "Institutional RWA partnerships", status: "pending" as const },
      { text: "AI-powered freelancer tools", status: "completed" as const },
      { text: "Self-sustaining economic flywheel", status: "pending" as const },
    ],
  },
];

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500",
  deploying: "bg-amber-400",
  pending: "bg-gray-300",
};

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
                    <li key={item.text} className="flex items-start gap-3 text-sm text-gray-600">
                      <div className={"flex-shrink-0 w-3 h-3 rounded-full mt-0.5 " + statusColors[item.status]} />
                      <span>
                        {item.text}
                        {item.status === "deploying" && (
                          <span className="ml-2 inline-block text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Coming Soon</span>
                        )}
                      </span>
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
