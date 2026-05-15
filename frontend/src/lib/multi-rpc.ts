type RpcConfig = {
  url: string;
  label: string;
  chainId?: number;
  weight?: number;
};

type HealthStatus = {
  healthy: boolean;
  latency: number;
  lastCheck: number;
  blockNumber?: bigint;
};

type Strategy = "latency" | "healthy" | "round-robin";

const DEFAULT_STRATEGY: Strategy = "latency";
const HEALTH_CHECK_INTERVAL = 30_000;
const TIMEOUT_MS = 5_000;

const RPCS: Record<number, RpcConfig[]> = {
  // Polygon Mainnet
  137: [
    { url: "https://polygon-rpc.com", label: "Public Polygon RPC", weight: 1 },
    { url: "https://polygon.llamarpc.com", label: "Llama RPC", weight: 1 },
    { url: "https://rpc.ankr.com/polygon", label: "Ankr", weight: 1 },
    { url: "https://polygon.blockpi.network/v1/rpc/public", label: "BlockPI", weight: 1 },
    { url: "https://polygon-mainnet.g.alchemy.com/v2/demo", label: "Alchemy Demo", weight: 2 },
    { url: "https://1rpc.io/matic", label: "1RPC", weight: 1 },
    { url: "https://polygon.drpc.org", label: "dRPC", weight: 1 },
  ],
  // Polygon Amoy Testnet
  80002: [
    { url: "https://rpc-amoy.polygon.technology", label: "Official Amoy", weight: 1 },
    { url: "https://polygon-amoy.g.alchemy.com/v2/demo", label: "Alchemy Amoy", weight: 2 },
    { url: "https://rpc.ankr.com/polygon_amoy", label: "Ankr Amoy", weight: 1 },
  ],
};

function buildBlockscoutRpc(chainId: number): RpcConfig {
  const key = (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_BLOCKSCOUT_API_KEY || process.env.BLOCKSCOUT_API_KEY)) || "";
  const qs = key ? `?apikey=${key}` : "";
  return { url: `https://api.blockscout.com/${chainId}/json-rpc${qs}`, label: "Blockscout", weight: 3 };
}

function getRpcs(chainId: number): RpcConfig[] {
  const custom = RPCS[chainId] ?? [];
  const blockscout = buildBlockscoutRpc(chainId);
  const deduped = custom.filter(r => r.url !== blockscout.url);
  return [...deduped, blockscout];
}

async function rpcCall(url: string, method: string, params: any[] = [], timeout = TIMEOUT_MS): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
      signal: controller.signal,
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.result;
  } finally {
    clearTimeout(id);
  }
}

class MultiRpcProvider {
  private health: Map<string, HealthStatus> = new Map();
  private rrIndex = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private chainId: number, private strategy: Strategy = DEFAULT_STRATEGY) {
    this.checkHealth();
    this.timer = setInterval(() => this.checkHealth(), HEALTH_CHECK_INTERVAL);
  }

  private checkHealth = async () => {
    const rpcs = getRpcs(this.chainId);
    await Promise.allSettled(
      rpcs.map(async (rpc) => {
        const start = performance.now();
        try {
          const block = await rpcCall(rpc.url, "eth_blockNumber", [], 3_000);
          this.health.set(rpc.url, {
            healthy: true,
            latency: performance.now() - start,
            lastCheck: Date.now(),
            blockNumber: BigInt(block),
          });
        } catch {
          this.health.set(rpc.url, {
            healthy: false,
            latency: Infinity,
            lastCheck: Date.now(),
          });
        }
      })
    );
  };

  getProviders(): (RpcConfig & { health: HealthStatus | undefined })[] {
    return getRpcs(this.chainId).map(r => ({ ...r, health: this.health.get(r.url) }));
  }

  best(): RpcConfig | null {
    const healthy = this.getProviders().filter(p => p.health?.healthy);
    if (healthy.length === 0) return null;

    switch (this.strategy) {
      case "latency":
        return healthy.sort((a, b) => (a.health!.latency) - (b.health!.latency))[0];
      case "healthy":
        return healthy.sort((a, b) => (b.health!.blockNumber ?? 0n) > (a.health!.blockNumber ?? 0n) ? 1 : -1)[0];
      case "round-robin":
        this.rrIndex = (this.rrIndex + 1) % healthy.length;
        return healthy[this.rrIndex];
      default:
        return healthy[0];
    }
  }

  async request(method: string, params: any[] = []): Promise<any> {
    const byPriority = [...getRpcs(this.chainId)].sort((a, b) => {
      if (a.url === this.best()?.url) return -1;
      if (b.url === this.best()?.url) return 1;
      const ha = this.health.get(a.url);
      const hb = this.health.get(b.url);
      if (ha?.healthy && !hb?.healthy) return -1;
      if (!ha?.healthy && hb?.healthy) return 1;
      return (ha?.latency ?? Infinity) - (hb?.latency ?? Infinity);
    });
    for (const rpc of byPriority) {
      try {
        return await rpcCall(rpc.url, method, params);
      } catch {
        this.health.set(rpc.url, { healthy: false, latency: Infinity, lastCheck: Date.now() });
      }
    }
    throw new Error(`All RPCs failed for chain ${this.chainId}`);
  }

  setStrategy(s: Strategy) { this.strategy = s; }
  destroy() { if (this.timer) clearInterval(this.timer); }
}

const instances = new Map<number, MultiRpcProvider>();

export function getRpcProvider(chainId: number, strategy?: Strategy): MultiRpcProvider {
  const key = chainId;
  if (!instances.has(key) || strategy) {
    instances.get(key)?.destroy();
    instances.set(key, new MultiRpcProvider(chainId, strategy ?? DEFAULT_STRATEGY));
  }
  return instances.get(key)!;
}

export { getRpcs, rpcCall };
export type { RpcConfig, HealthStatus, Strategy };
