import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { treMindChat } from "../lib/treMind";

export default function TreMindChat() {
  const { address } = useAccount();
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
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-emerald-600 text-white text-2xl 
                  shadow-2xl hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 
                  flex items-center justify-center"
      >
        <span className="animate-pulse">🧠</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" 
         style={{ maxHeight: "80vh" }}>
      <div className="flex items-center justify-between px-5 py-4 bg-emerald-600 text-white">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧠</span>
          <div>
            <span className="font-semibold text-sm">TreMind AI</span>
            <p className="text-xs text-white/80">Your Web3 Assistant</p>
          </div>
        </div>
        <button 
          onClick={() => setOpen(false)} 
          className="text-white/90 hover:text-white text-xl leading-none transition-colors duration-200"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 mb-2">
              Ask TreMind about Trestle Protocol, staking, rewards, or disputes.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button 
                onClick={() => {
                  setInput("How do I connect my wallet?");
                  send();
                }}
                className="px-3 py-1 text-xs bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
              >
                Wallet Help
              </button>
              <button 
                onClick={() => {
                  setInput("What is hNOBT?");
                  send();
                }}
                className="px-3 py-1 text-xs bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
              >
                hNOBT Info
              </button>
              <button 
                onClick={() => {
                  setInput("How does staking work?");
                  send();
                }}
                className="px-3 py-1 text-xs bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
              >
                Staking Guide
              </button>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow 
                      ${m.role === "user" 
                        ? "bg-emerald-600 text-white" 
                        : "bg-gray-50 text-gray-800 border border-gray-200"}`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">TreMind is thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div className="border-t px-4 py-3 flex gap-3">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask TreMind..." 
          className="flex-1 min-h-[44px] border border-gray-300 rounded-lg px-4 py-2 text-sm 
                    focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 
                    transition-all duration-200"
        />
        <button 
          onClick={send} 
          disabled={busy || !input.trim()}
          className="flex-shrink-0 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium 
                    hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 
                    disabled:opacity-50 disabled:cursor-not-allowed shadow hover:shadow-md"
        >
          Send
        </button>
      </div>
    </div>
  );
}
