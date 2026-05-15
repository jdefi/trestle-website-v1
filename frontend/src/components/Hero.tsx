import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-20 md:pt-28 pb-16 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-100" />
      <div className="absolute top-16 right-0 w-80 h-80 bg-emerald-300/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-200/25 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-sm rounded-full mb-6">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live on Polygon Amoy Testnet
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 max-w-3xl mx-auto leading-tight mb-6">
          The{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
            Economic Bridge
          </span>{" "}
          Between Digital Labor &amp; Real-World Assets
        </h1>

        <p className="mt-4 text-base md:text-lg text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
          Earn through freelance work, stake to secure liquidity, and own fractional shares of
          real-world assets — all within a single decentralized ecosystem.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
          <Link
            href="/app"
            className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl
                      transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl
                      border border-emerald-600 hover:border-transparent"
          >
            Launch dApp
          </Link>
          <a
            href="https://t.m/TrestlePro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-6 py-3 border-2 border-emerald-600 text-emerald-600 font-semibold rounded-xl
                      hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-300 transform hover:-translate-y-1
                      shadow-sm hover:shadow"
          >
            💬 Open Telegram
          </a>
          <Link
            href="#features"
            className="flex-1 sm:flex-none px-6 py-3 text-gray-600 font-semibold rounded-xl hover:text-gray-800
                      transition-all duration-200 hover:bg-gray-50"
          >
            Learn More &rarr;
          </Link>
        </div>

        {/* QR Code below hero on desktop */}
        <div className="hidden md:block mt-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 inline-block">
            <QRCode value="https://trestle.website" size={150} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {[
            ["$2.5M+", "Trading Volume"],
            ["50K+", "Community Members"],
            ["2021", "Battle-Tested Liquidity"],
          ].map(([stat, label]) => (
            <div key={label} className="text-center p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all">
              <p className="text-2xl font-bold text-gray-900">{stat}</p>
              <p className="text-sm text-gray-500 mt-2">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}