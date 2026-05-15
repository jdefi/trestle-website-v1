import { api } from "./api";

type AstraContext = Record<string, string>;

export async function astraChat(message: string, context?: AstraContext) {
  const r = await api<{ response: string }>("/api/astra/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
  return r.response;
}

export async function analyzeListing(title: string, description: string, price: string) {
  return api("/api/astra/marketplace/analyze", {
    method: "POST",
    body: JSON.stringify({ title, description, price }),
  });
}

export async function resolveDispute(data: any) {
  return api("/api/astra/dispute/resolve", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTaskRecommendations(userData: any) {
  return api("/api/astra/rewards/recommend", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}