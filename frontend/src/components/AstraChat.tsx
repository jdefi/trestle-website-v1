import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { astraChat } from "../lib/astra";

const AGENTS = [
  { id: "astra", label: "Astra AI", avatar: "/avatars/Astra.jpg", desc: "DevSecOps Lead" },
];

type Message = {
  role: "user" | "agent";
  text: string;
  agentId?: string;
};

export default function AstraChat() {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const currentAgent = AGENTS[0];

  const send = async () => {
    if (!input.trim() || busy) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const ctx = address ? { address: address.slice(0, 8) } : undefined;
      const response = await astraChat(msg, ctx);
      setMessages(prev => [...prev, { role: "agent", text: response, agentId: "astra" }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", text: "Astra is offline. Try again later.", agentId: "astra" }]);
    }
    setBusy(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-emerald-600 text-white
                  shadow-2xl hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105
                  flex items-center justify-center overflow-hidden"
      >
        <img src={currentAgent.avatar} alt="Astra" className="w-full h-full object-cover animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
         style={{ maxHeight: "80vh" }}>
      <div className="flex items-center justify-between px-5 py-4 bg-emerald-600 text-white">
        <div className="flex items-center gap-3">
          <img src={currentAgent.avatar} alt={currentAgent.label} className="w-10 h-10 rounded-full border-2 border-white/30 object-cover" />
          <div>
            <span className="font-semibold text-sm">{currentAgent.label}</span>
            <p className="text-xs text-white/80">{currentAgent.desc}</p>
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
            <p className="text-sm text-gray-500 mb-2">Ask me about Trestle tasks, rewards, or anything.</p>
          </div>
        )}
        {messages.map((m, i) => {
          const msgAgent = m.agentId ? AGENTS.find(a => a.id === m.agentId) : null;
          return (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow
                        ${m.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-50 text-gray-800 border border-gray-200"}`}
              >
                {m.role === "agent" && msgAgent && (
                  <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-gray-100">
                    <img src={msgAgent.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    <span className="text-xs font-medium text-gray-500">{msgAgent.label}</span>
                  </div>
                )}
                {m.text}
              </div>
            </div>
          );
        })}
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
