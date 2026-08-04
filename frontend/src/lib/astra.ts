const AI_API = process.env.NEXT_PUBLIC_AI_API_URL || "https://ai.trestle.website";
const REWARD_API = process.env.NEXT_PUBLIC_REWARD_API_URL || "https://reward-api.trestle.website";

type AstraContext = Record<string, string>;

export interface AgentResponse {
  content: string;
  source: string;
  agent: string;
}

async function tryDirectAPI(message: string, context?: AstraContext): Promise<string | null> {
  try {
    const ctx = context
      ? Object.entries(context).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")
      : "";
    const prompt = ctx ? `Context:\n${ctx}\n\nUser: ${message}` : message;
    const system = "You are Astra, the Trestle DeFi AI assistant. You help users with staking, rewards, marketplace, disputes, and platform questions. Be concise and helpful.";

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

async function tryProxyAPI(message: string, context?: AstraContext): Promise<string | null> {
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

export async function astraChat(message: string, context?: AstraContext): Promise<string> {
  const result = (await tryDirectAPI(message, context)) || (await tryProxyAPI(message, context));
  return result || "Astra is offline. Check ASTRA_API_URL.";
}

export async function astraAsk(system: string, user: string): Promise<string> {
  const r = await fetch(`${AI_API}/api/ai/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(e.error || r.statusText);
  }
  const data = await r.json();
  return data.content;
}

export async function analyzeListing(title: string, description: string, price: string) {
  return fetch(`${REWARD_API}/api/astra/marketplace/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, price }),
  });
}

export async function resolveDispute(data: any) {
  return fetch(`${REWARD_API}/api/astra/dispute/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getTaskRecommendations(userData: any) {
  return fetch(`${REWARD_API}/api/astra/rewards/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
}

export async function getAstraProviders() {
  return fetch(`${REWARD_API}/api/astra/providers`);
}
