const AI_API = process.env.NEXT_PUBLIC_AI_API_URL || "https://ai.trestle.website";
const REWARD_API = process.env.NEXT_PUBLIC_REWARD_API_URL || "https://reward-api.trestle.website";

type JonahContext = Record<string, string>;

export interface AgentResponse {
  content: string;
  source: string;
  agent: string;
}

async function tryDirectAPI(message: string, context?: JonahContext): Promise<string | null> {
  try {
    const ctx = context
      ? Object.entries(context).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")
      : "";
    const prompt = ctx ? `Context:\n${ctx}\n\nUser: ${message}` : message;
    const system = "You are Jonah, a head moderator and the Trestle DeFi community assistant. You help users with questions about the platform, moderation, disputes, and community matters. Be friendly and accurate.";

    const r = await fetch(`${AI_API}/api/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, user: prompt }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.content || data.response || null;
  } catch {
    return null;
  }
}

async function tryProxyAPI(message: string, context?: JonahContext): Promise<string | null> {
  try {
    const r = await fetch(`${REWARD_API}/api/astra/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.response || null;
  } catch {
    return null;
  }
}

export async function jonahChat(message: string, context?: JonahContext): Promise<string> {
  const result = (await tryDirectAPI(message, context)) || (await tryProxyAPI(message, context));
  return result || "Jonah is offline. Try again later.";
}
