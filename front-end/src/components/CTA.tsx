import Link from "next/link";
import { LINKS } from "@/config/contracts";
import QRCode from "@/components/QRCode";

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-b from-emerald-50 via-emerald-50 to-emerald-100">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="mb-6 text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-800">
          Ready to Build the Future?
        </h2>
        <p className="mb-10 text-xl lg:text-2xl text-emerald-700 max-w-2xl mx-auto">
          Join thousands of users earning, staking, and owning their way to financial freedom.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/app"
            className="flex-1 sm:flex-none px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl
                      transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl
                      border border-emerald-600 hover:border-transparent"
          >
            Launch dApp
          </Link>
          <div className="flex-1 sm:flex-none space-x-4">
            <a
              href="https://reward.trestle.website"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-8 py-4 border-2 border-emerald-600 text-emerald-600 font-semibold rounded-xl
                        hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-300 transform hover:-translate-y-1
                        shadow-sm hover:shadow"
            >
              Reward Hub
            </a>
            <a
              href="https://testnet.trestle.website"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-8 py-4 border-2 border-emerald-600 text-emerald-600 font-semibold rounded-xl
                        hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-300 transform hover:-translate-y-1
                        shadow-sm hover:shadow"
            >
              Testnet Hub
            </a>
          </div>
          <a
            href={LINKS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl
                      transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl
                      border border-emerald-600 hover:border-transparent"
          >
            💬 Telegram
          </a>
        </div>
        <div className="mt-12 flex justify-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 inline-block">
            <QRCode value={SITE_URL} size={140} bgColor="ffffff" fgColor="059669" />
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-400">Scan the QR code to open on mobile</p>
      </div>
    </section>
  );
}

const SITE_URL = "https://trestle.website";