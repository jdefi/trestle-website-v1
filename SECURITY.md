# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately via **contact@trestle.website**. Do not open public GitHub issues for security bugs.

## Bug Bounty

We run a bug bounty program with tiered rewards. All hNOBT rewards are 10× the base rate.

**To claim rewards:** Join [reward.trestle.website](https://reward.trestle.website), submit your vulnerability report, and complete verification.

### Submission Format

1. **Vulnerability Title**
2. **Steps to Reproduce**
3. **Proof of Concept** (Amoy Testnet tx hash or code)

### Response Timeline

- Acknowledgement: 48 hours
- Triage: 7 days
- Reward: 14 days after validation

### Reward Tiers

| Severity | Target Systems & Scope | hNOBT Reward | xGov Reward | Payout Release |
|----------|------------------------|--------------|-------------|----------------|
| 🔴 **Critical (S1)** | • Escrow protocol bypassing vectors.<br>• Dutch Auction pricing or clearing logic exploits.<br>• Wallet-draining smart contract flaws. | 100,000 hNOBT | 2,500 xGov | **Instant Release** *(Within 48 hours of patch)* |
| 🔥 **High (S2)** | • Deadlocked contract states.<br>• Transaction verification loop failures.<br>• Telegram Mini-App backend API manipulation. | 50,000 hNOBT | 1,000 xGov | **7-Day Security Hold** |
| ⚡ **Medium (S3)** | • RPC node desynchronization errors.<br>• App state integration dropping inside Telegram.<br>• Incorrect event emission configurations. | 20,000 hNOBT | 250 xGov | **14-Day Processing Cycle** |
| 🟡 **Low (S4)** | • Text typos in documentation.<br>• Layout shifting/cropping inside webviews.<br>• UI styling/cosmetic discrepancies. | 2,500 hNOBT | 0 xGov | **End of Testnet Phase** |

### Sybil-Defense Rules

1. **Proof-of-Concept Requirement:** No S1, S2, or S3 bug bounty points will be logged without an accompanying active **Polygon Amoy Testnet Transaction Hash** or a valid, reproducible local code fork.

2. **Retention Rule:** Growth referrals are only counted if the incoming users pass Trestle Telegram/Discord captcha gate and stay active for at least 72 hours.

3. **Multi-Account Rule:** If two different profiles (e.g., Joe and Cress) submit identical bugs or referral lists, the payout is split 50/50 or canceled entirely pending identity verification.

### Payout Options

Join [reward.trestle.website](https://reward.trestle.website) to validate and claim rewards. Two options:

| Option | Requirements | Bug Bounty Payout |
|--------|-------------|-------------------|
| **A: Full Reward** | Stage 1 (Gitcoin Passport + Accounts) + Stage 2 (Biometric) | **100% hNOBT + 100% xGov** |
| **B: Early Withdrawal** | Stage 1 (Gitcoin Passport + Accounts) only | **50% hNOBT + 0 xGov** |

## Scope

**In:** Smart contracts, frontend, verification logic, public APIs

**Out:** UI/UX, missing features, third-party integrations, social engineering, private/internal code

## Contract Addresses (Polygon Mainnet)

| Contract | Address |
|----------|---------|
| BRT LP Staking | `0xF68A17c7e15174D55AFDb2EF7669Ad04F561AD48` |
| hNOBT | `0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD` | Community growth token (airdrops, referrals) |
| BroilerPlus | `0xeCb4cAc0C9e5cBd42a9Ed36467ce8f96072AD58b` | Liquidity anchor token (staking, LP mining) |
| BRT/WPOL Pair | `0xc445b18b3ff85e0691fe416ad91e456f8697b166` | Liquidity pair |
hNobtCoreStaking (proxy) | `0x1d7d8a7B24Be9ecc692f36c7C01486EfF6c689d7` | hNOBT staking contract |
| BroilerCoreStaking (proxy) | `0xF68A17c7e15174D55AFDb2EF7669Ad04F561AD48` | BRT/WPOL LP mining contract |
| hNobtCoreStaking (impl) | `0x6C7679B3E1967A00eA3BF0cDA61D8bcCDF117965` | Implementation (verified) |
| BroilerCoreStaking (impl) | `0x5355528995CAfC401997f30B98078f3101661b28` | Implementation (verified) |

Always verify addresses on Polygonscan before interacting.
