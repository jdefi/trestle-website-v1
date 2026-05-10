const tokens = [
  {
    tier: "Tier 1",
    name: "hNOBT",
    role: "Community Growth",
    supply: "1,000,000,000",
    distribution: "100% via tasks, referrals & campaigns",
    utility: "Stake to mine BroilerPlus. Gate to the ecosystem.",
    color: "emerald",
    extras: [],
  },
  {
    tier: "Tier 2",
    name: "BroilerPlus (BRT)",
    role: "Liquidity Anchor",
    supply: "1,000,000,000,000,000 (1 Quadrillion)",
    distribution: "Active on Polygon since 2021",
    utility: "Core marketplace currency. LP staking for rewards.",
    color: "blue",
    extras: [
      "5% tax on every transfer (use 6-7% slippage on DEX)",
      "BRT/WMATIC LP: 0xc445b18b3ff85e0691fe416ad91e456f8697b166",
    ],
  },
  {
    tier: "Tier 3",
    name: "Governance Token",
    role: "Value Capture",
    supply: "1,000,000",
    distribution: "Earned exclusively via Tier 3 staking",
    utility: "Fee sharing + protocol voting. Fixed max supply.",
    color: "purple",
    extras: [],
  },
];

export default function Tokens() {
  return (
    <section id="tokens" className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">
          Three Tokens.{" "}
          <span className="text-emerald-500">One Flywheel.</span>
        </h2>
        <p className="mt-4 text-gray-500 text-center max-w-2xl mx-auto">
          A unique triple-token system designed to reward activity, stability, and ownership.
        </p>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {tokens.map((t) => (
            <div
              key={t.name}
              className={`p-6 rounded-2xl border bg-white hover:shadow-lg transition-all`}
            >
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  t.color === "emerald"
                    ? "bg-emerald-100 text-emerald-700"
                    : t.color === "blue"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {t.tier}
              </span>
              <h3 className="mt-4 text-2xl font-bold text-gray-900">{t.name}</h3>
              <p className="text-sm text-gray-500 font-medium">{t.role}</p>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><span className="font-medium text-gray-900">Supply:</span> {t.supply}</p>
                <p><span className="font-medium text-gray-900">Distribution:</span> {t.distribution}</p>
                <p><span className="font-medium text-gray-900">Utility:</span> {t.utility}</p>
                {t.extras.map((e, i) => (
                  <p key={i} className="text-xs text-gray-400 italic">{e}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
