import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-100" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-full mb-8">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live on Polygon Amoy Testnet
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
          The{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
            Economic Bridge
          </span>{" "}
          Between Digital Labor & Real-World Assets
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
          Earn through freelance work, stake to secure liquidity, and own fractional shares of
          real-world assets — all within a single decentralized ecosystem.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/app"
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all"
          >
            Launch dApp
          </Link>
          <a
            href="https://t.me/trestle_bot/app"
            target="_blank"
            className="px-8 py-3.5 border-2 border-emerald-500 text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all"
          >
            Open Telegram Mini-App
          </a>
          <Link
            href="/#features"
            className="px-8 py-3.5 text-gray-500 font-semibold rounded-xl hover:text-gray-700 transition-all"
          >
            Learn More &rarr;
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            ["$2.5M+", "Trading Volume"],
            ["50K+", "Community Members"],
            ["2021", "Battle-Tested Liquidity"],
          ].map(([stat, label]) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stat}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
