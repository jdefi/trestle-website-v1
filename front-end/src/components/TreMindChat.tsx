import { useState, useRef, useEffect } from "react";
import { treMindChat } from "../lib/treMind";
import { useActiveAccount } from "thirdweb/react";

export default function TreMindChat() {
  const account = useActiveAccount();
  const address = account?.address;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "treMind"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const response = await treMindChat(msg, address ? { address: address.slice(0, 8) } : {});
      setMessages(prev => [...prev, { role: "treMind", text: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "treMind", text: "TreMind is offline. Check TREMIND_API_URL." }]);
    }
    setBusy(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 text-white text-2xl shadow-lg hover:bg-emerald-600 transition flex items-center justify-center">
        <span>🧠</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: "70vh" }}>
      <div className="flex items-center justify-between px-4 py-3 bg-emerald-500 text-white">
        <span className="font-semibold text-sm">🧠 TreMind AI</span>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">Ask TreMind about Trestle Protocol, staking, rewards, or disputes.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-800"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-gray-400 animate-pulse pl-1">TreMind is thinking...</div>}
        <div ref={bottom} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask TreMind..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
        <button onClick={send} disabled={busy || !input.trim()}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition">Send</button>
      </div>
    </div>
  );
}
