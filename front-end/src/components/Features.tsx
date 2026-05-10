import Link from "next/link";

const features = [
  {
    title: "Zero-Friction Onboarding",
    desc: "Join via Telegram or Gmail. Account Abstraction (ERC-4337) removes seed phrases forever.",
    icon: "⚡",
  },
  {
    title: "Three-Tier Staking",
    desc: "hNOBT → BroilerPlus → Governance. Each tier unlocks greater rewards and protocol ownership.",
    icon: "🏗️",
  },
  {
    title: "Milestone Escrow",
    desc: "Smart contract-based escrow for freelancers. Funds released only on verified completion.",
    icon: "🔒",
  },
  {
    title: "2.5% Marketplace Fee",
    desc: "40% to stakers, 40% to treasury, 20% buyback & burn. Sustainable real yield model.",
    icon: "📊",
  },
  {
    title: "Fractional RWA",
    desc: "Tokenize and trade fractional shares of real estate, bonds, and institutional-grade assets.",
    icon: "🏠",
  },
  {
    title: "Loyalty Multipliers",
    desc: "Governor Vault rewards up to 2x for diamond hands. 1mo = 1x, 6mo = 1.5x, 1yr = 2x.",
    icon: "💎",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
          Built for the{" "}
          <span className="text-emerald-500">Next Generation</span> of Commerce
        </h2>
        <p className="mt-4 text-gray-500 text-center max-w-2xl mx-auto">
          Trestle combines battle-tested liquidity (since 2021) with modern DeFi infrastructure
          to create a self-sustaining economic flywheel.
        </p>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-emerald-100 transition-all"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
