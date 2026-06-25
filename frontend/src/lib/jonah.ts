const AI_API = process.env.NEXT_PUBLIC_AI_API_URL || "https://ai.trestle.website";

export interface AgentResponse {
  content: string;
  source: string;
  agent: string;
}

export async function jonahChat(message: string, context?: string): Promise<string> {
  const r = await fetch(`${AI_API}/api/ai/agent/jonah/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(e.error || r.statusText);
  }
  const data: AgentResponse = await r.json();
  return data.content;
}
