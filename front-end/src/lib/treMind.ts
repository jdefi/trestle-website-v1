import { api } from "./api";

type TreMindContext = Record<string, string>;

export async function treMindChat(message: string, context?: TreMindContext) {
  const r = await api<{ response: string }>("/api/treMind/chat", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
  return r.response;
}

export async function analyzeListing(title: string, description: string, price: string) {
  return api("/api/treMind/marketplace/analyze", {
    method: "POST",
    body: JSON.stringify({ title, description, price }),
  });
}

export async function resolveDispute(data: any) {
  return api("/api/treMind/dispute/resolve", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTaskRecommendations(userData: any) {
  return api("/api/treMind/rewards/recommend", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}
