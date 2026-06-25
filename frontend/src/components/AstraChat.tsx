import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { astraChat } from "@/lib/astra";
import { jonahChat } from "@/lib/jonah";

const AGENTS = [
  { id: "astra", label: "Astra", icon: "\uD83E\uDD16", desc: "AI Assistant" },
  { id: "jonah", label: "Jonah", icon: "\uD83D\uDC68\u200D\uD83D\uDD27", desc: "Head Moderator" },
];

export default function AstraChat() {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState<"astra" | "jonah">("astra");
  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const agentChat = agent === "astra" ? astraChat : jonahChat;

  const send = async () => {
    if (!input.trim() || busy) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const ctx = address ? `Wallet: ${address.slice(0, 8)}` : undefined;
      const response = await agentChat(msg, ctx);
      setMessages(prev => [...prev, { role: "agent", text: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", text: `${AGENTS.find(a => a.id === agent)?.label} is offline. Try again later.` }]);
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
        <span className="animate-pulse">{'\uD83E\uDD16'}</span>
      </button>
    );
  }

  const currentAgent = AGENTS.find(a => a.id === agent)!;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
         style={{ maxHeight: "80vh" }}>
      <div className="flex items-center justify-between px-5 py-4 bg-emerald-600 text-white">
        <div className="flex items-center gap-3">
          <span className="text-xl">{currentAgent.icon}</span>
          <div>
            <span className="font-semibold text-sm">{currentAgent.label}</span>
            <p className="text-xs text-white/80">{currentAgent.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-emerald-700 rounded-lg overflow-hidden text-xs">
            {AGENTS.map(a => (
              <button
                key={a.id}
                onClick={() => { setAgent(a.id as "astra" | "jonah"); setMessages([]); }}
                className={`px-2.5 py-1.5 transition ${agent === a.id ? "bg-emerald-500 text-white" : "text-white/70 hover:text-white"}`}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-white/90 hover:text-white text-xl leading-none transition-colors duration-200"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 mb-2">
              Chat with {currentAgent.label} about Trestle.
            </p>
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
              <span className="text-xs text-emerald-600 font-medium">{currentAgent.label} is thinking...</span>
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
          placeholder={`Ask ${currentAgent.label}...`}
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
