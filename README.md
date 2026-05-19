# Trestle Protocol Monorepo

![Trestle Logo](https://via.placeholder.com/150) <!-- Replace with your logo -->

**A decentralized marketplace for digital assets, freelancer services, and real-world assets (RWA).**

---
> **Disclaimer:** Not affiliated with Trestle Protocol (Celestia Bridge).

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
   - Copy `.env.example` to `.env` in each project (e.g., `apps/main/.env`).
   - Fill in the required values (e.g., API keys, RPC URLs).

---

## 🛠 Development

### Run All Projects
```bash
npm run dev
# or
yarn dev
```

### Run a Specific Project
```bash
cd apps/main
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

# trestle.website Frontend

Next.js frontend for the Trestle Protocol landing page. Built with thirdweb SDK and Tailwind CSS.

## Pages

- `/` — Landing page
- `/app` — Dashboard
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
## 📬 Contact
- **Website**: [https://trestle.website](https://trestle.website)
- **GitHub**: [Trestle Protocol](https://github.com/Trestle-DeFi)
- **Discord**: [Trestle Protocol](https://discord.gg/4dCCvnJYGT)
- **Telegram**: [Trestle Pro](https://t.me/TrestleDeFi)
- **Email**: contact@trestle.website

