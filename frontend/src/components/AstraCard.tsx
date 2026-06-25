"use client";

import { useState } from "react";
import { astraChat } from "@/lib/astra";

const QUICK_PROMPTS = [
  "What is Trestle DeFi?",
  "How does staking work?",
  "What is hNOBT?",
];

export default function AstraCard() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (msg?: string) => {
    const text = (msg || input).trim();
    if (!text || busy) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setBusy(true);
    try {
      const response = await astraChat(text);
      setMessages(prev => [...prev, { role: "astra", text: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "astra", text: "Astra is offline. Try again later." }]);
    }
    setBusy(false);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Chat with Astra AI</h2>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto">
            Your Web3 assistant — ask about staking, rewards, disputes, or anything Trestle.
          </p>
        </div>

        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-emerald-600 text-white px-5 py-3 flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-semibold text-sm">Astra AI</span>
            <span className="ml-auto text-[10px] text-white/70">gpt-4o-mini</span>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">Ask me anything about Trestle</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => send(p)}
                      className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  m.role === "user" ? "bg-emerald-600 text-white" : "bg-gray-50 text-gray-800 border border-gray-200"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 justify-center py-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-600 font-medium">Astra is thinking...</span>
              </div>
            )}
          </div>

          <div className="border-t px-4 py-3 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask Astra..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
            <button onClick={() => send()} disabled={busy || !input.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
