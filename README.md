# Trestle DeFi Monorepo

![Trestle Logo](https://via.placeholder.com/150) <!-- Replace with your logo -->

**A decentralized marketplace for digital assets, freelancer services, and real-world assets (RWA).**

---
<<<<<<< HEAD
> **Disclaimer:** Not affiliated with Trestle Protocol (Celestia Bridge).
=======
> **Disclaimer:** Not affiliated with Trestle DeFi (Celestia Bridge).
>>>>>>> d9be4df68db168e6f1a3f7e4e92b6fd2c486586e

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended).
- **npm** or **Yarn** (v1.22+).
- **Git**.

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Trestle-DeFi/trestle.git
   cd trestle
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env` in each project (e.g., `front-end/.env.local`).
   - Fill in the required values (e.g., API keys, RPC URLs).

---

## 🛠 Development

### Run Frontend
```bash
cd front-end
npm run dev
# or
yarn dev
```

---

## 🌐 Deployment

### `trestle.website` (Vercel)
1. Push code to the `main` branch.
2. Vercel will automatically deploy.
3. Configure environment variables in Vercel.

---

## 📁 Directory Structure

```
trestle-website-v1/
├── front-end/                # Next.js frontend
│   ├── src/
│   │   ├── app/              # App router (Next.js 13+)
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   └── config/           # Configuration files
│   ├── public/               # Static assets
│   └── package.json
└── README.md
```

---

## Pages

- `/` — Landing page
- `/app` — Dashboard (Portfolio display)
- `/app/stake/tier1` — Stake Tier 1
- `/app/stake/tier2` — Stake Tier 2
- `/app/stake/tier3` — Stake Tier 3
- `/app/marketplace` — Digital goods marketplace
- `/app/withdraw` — Withdraw interface

## Commands

```bash
npm run dev    # http://localhost:3000
npm run build
npm start
```

## Environment Variables

Required environment variables (create `front-end/.env.local`):
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BICONOMY_API_KEY=your_biconomy_key
NEXT_PUBLIC_BICONOMY_API_URL=https://api.biconomy.io
```

## Chain Support
- Polygon Mainnet (chainId: 137)
- Polygon Amoy Testnet (chainId: 80002)

## 📬 Contact
- **Website**: [https://trestle.website](https://trestle.website)
- **GitHub**: [Trestle Protocol](https://github.com/Trestle-DeFi)
- **Discord**: [Trestle Protocol](https://discord.gg/4dCCvnJYGT)
- **Telegram**: [Trestle Pro](https://t.me/TrestleDeFi)
- **Email**: contact@trestle.website

