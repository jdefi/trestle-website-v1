export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const CONTRACTS = {
  polygon: {
    marketplaceCore: process.env.NEXT_PUBLIC_CONTRACT_MARKETPLACE_CORE ?? "0x...",
    digitalGoods: process.env.NEXT_PUBLIC_CONTRACT_DIGITAL_GOODS ?? "0x...",
    freelancerEscrow: process.env.NEXT_PUBLIC_CONTRACT_FREELANCER_ESCROW ?? "0x...",
    tier1Staking: process.env.NEXT_PUBLIC_CONTRACT_TIER1_STAKING ?? "0x...",
    tier2Staking: process.env.NEXT_PUBLIC_CONTRACT_TIER2_STAKING ?? "0x...",
    tier3Vault: process.env.NEXT_PUBLIC_CONTRACT_TIER3_VAULT ?? "0x...",
    governanceToken: process.env.NEXT_PUBLIC_CONTRACT_GOVERNANCE_TOKEN ?? "0x...",
    feeDistributor: process.env.NEXT_PUBLIC_CONTRACT_FEE_DISTRIBUTOR ?? "0x...",
    hNOBT: "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD",
    broilerPlus: "0xeCb4cAc0C9e5cBd42a9Ed36467ce8f96072AD58b",
  },
};

export const LINKS = {
  telegram: "https://t.me/TrestleDeFi",
  discord: "https://discord.gg/4dCCvnJYGT",
  github: "https://github.com/Trestle-DeFi",
  docs: "https://github.com/Trestle-DeFi/wiki",
  telegramApp: "https://t.me/trestle_bot/app",
};
