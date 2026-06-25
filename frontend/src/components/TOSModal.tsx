"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function TOSModal() {
  const [agreed, setAgreed] = useState(true);
  const [check, setCheck] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("trestle_agreed");
    if (stored !== "true") setAgreed(false);
  }, []);

  const handleAgree = () => {
    localStorage.setItem("trestle_agreed", "true");
    setAgreed(true);
  };

  if (agreed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">Decentralized Interface Notice</h2>
        </div>
        <div className="text-sm text-gray-600 space-y-3">
          <p>
            This is a decentralized interface. We do not control the underlying protocol or
            smart contracts. By continuing, you agree that we are not affiliated with
            Trestle Protocol (Celestia Bridge) and that you are compliant with your local laws.
          </p>
          <p className="text-xs text-gray-400">
            Read our <Link href="/tos" className="text-emerald-600 underline">Terms of Service</Link>{" "}
            and <Link href="/privacy" className="text-emerald-600 underline">Privacy Policy</Link>.
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={check} onChange={e => setCheck(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400" />
          <span className="text-sm text-gray-700">I understand and agree.</span>
        </label>
        <button onClick={handleAgree} disabled={!check}
          className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium
                     hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          Continue
        </button>
      </div>
    </div>
  );
}
