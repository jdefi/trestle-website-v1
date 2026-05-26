import { API_BASE } from "@/config/contracts";

const ASTRA_BASE = (process.env.NEXT_PUBLIC_ASTRA_API_URL as string) || API_BASE;

async function astraApi<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${ASTRA_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(e.error || r.statusText);
  }
  return r.json();
}

type AstraContext = Record<string, string>;

export async function astraChat(message: string, context?: AstraContext) {
  const r = await astraApi<{ response: string }>("/api/astra/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
  return r.response;
}

export async function analyzeListing(title: string, description: string, price: string) {
  return astraApi("/api/astra/marketplace/analyze", {
    method: "POST",
    body: JSON.stringify({ title, description, price }),
  });
}

export async function resolveDispute(data: any) {
  return astraApi("/api/astra/dispute/resolve", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTaskRecommendations(userData: any) {
  return astraApi("/api/astra/rewards/recommend", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}