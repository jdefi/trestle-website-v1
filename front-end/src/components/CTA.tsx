import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="p-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Build the Future?
          </h2>
          <p className="mt-4 text-emerald-100 max-w-xl mx-auto">
            Join thousands of users earning, staking, and owning their way to financial freedom.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="px-8 py-3.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-all"
            >
              Launch dApp
            </Link>
            <a
              href="/app"
              className="px-8 py-3.5 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Reward Hub
            </a>
            <a
              href="https://t.me/trestle_bot/app"
              target="_blank"
              className="px-8 py-3.5 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              Telegram Mini-App
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
