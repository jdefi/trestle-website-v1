import Link from "next/link";

const features = [
  {
    title: "Zero-Friction Onboarding",
    desc: "Join via Telegram or Gmail. Account Abstraction (ERC-4337) removes seed phrases forever.",
    icon: "⚡",
    color: "emerald",
  },
  {
    title: "Three-Tier Staking",
    desc: "hNOBT → BroilerPlus → Governance. Each tier unlocks greater rewards and protocol ownership.",
    icon: "🏗️",
    color: "blue",
  },
  {
    title: "Milestone Escrow",
    desc: "Smart contract-based escrow for freelancers. Funds released only on verified completion.",
    icon: "🔒",
    color: "emerald",
  },
  {
    title: "2.5% Marketplace Fee",
    desc: "40% to stakers, 40% to treasury, 20% buyback & burn. Sustainable real yield model.",
    icon: "📊",
    color: "blue",
  },
  {
    title: "Fractional RWA",
    desc: "Tokenize and trade fractional shares of real estate, bonds, and institutional-grade assets.",
    icon: "🏠",
    color: "purple",
  },
  {
    title: "Loyalty Multipliers",
    desc: "Governor Vault rewards up to 2x for diamond hands. 1mo = 1x, 6mo = 1.5x, 1yr = 2x.",
    icon: "💎",
    color: "emerald",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="mb-6 text-3xl md:text-4xl font-bold text-center text-gray-900">
          Built for the{" "}
          <span className="text-emerald-600">Next Generation</span> of Commerce
        </h2>
        <p className="mb-12 text-gray-500 text-center max-w-2xl mx-auto">
          Trestle combines battle-tested liquidity (since 2021) with modern DeFi infrastructure
          to create a self-sustaining economic flywheel.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-emerald-100 
                        transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="mb-6">
                <span className={`w-12 h-12 flex items-center justify-center rounded-full 
                            ${f.color === "emerald" ? "bg-emerald-100 text-emerald-600" : 
                             f.color === "blue" ? "bg-blue-100 text-blue-600" : 
                            "bg-purple-100 text-purple-600"} transition-transform duration-300 group-hover:scale-110`}>
                  {f.icon}
                </span>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
