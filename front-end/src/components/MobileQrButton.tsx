"use client";

import { useState } from "react";

export default function MobileQrButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center px-4 pt-20 pb-6">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <span className="text-lg">📱</span>
          <span>Open on Mobile</span>
        </button>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Open Trestle on mobile</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent("https://trestle.website")}&color=059669&bgcolor=ffffff&ecc=M`}
              alt="Scan QR code to open Trestle on mobile device"
              className="w-full h-auto rounded-lg"
            />
            <p className="text-center text-xs text-gray-400 mt-3 font-medium">
              Scan to open on mobile
            </p>
          </div>
        </div>
      )}
    </>
  );
}
