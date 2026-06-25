import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="text-sm text-emerald-600 hover:underline mb-8 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Version: 1.0</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <Section title="1. Data Collection">
          <p>We do <strong>not</strong> collect, store, or share any personal data. Wallet addresses and transaction data are public on the blockchain by design.</p>
        </Section>

        <Section title="2. Wallet Connection">
          <p>When you connect your wallet, your public wallet address is used only for on-chain interactions within your browser. No personal information is transmitted to or stored on our servers.</p>
        </Section>

        <Section title="3. Cookies & Tracking">
          <p>No cookies or tracking scripts are used beyond what is required for wallet connection functionality via third-party providers (e.g., WalletConnect). These providers may use local storage for session management.</p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>This Interface may link to third-party services (e.g., blockchain explorers, Discord, GitHub). We are not responsible for their privacy practices.</p>
        </Section>

        <Section title="5. Blockchain Transparency">
          <p>All transactions you submit through this Interface are broadcast to the public blockchain and are permanently visible to anyone. We have no ability to modify, delete, or obscure on-chain data.</p>
        </Section>

        <Section title="6. Changes">
          <p>We may update this privacy policy at any time. Continued use of the Interface after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="7. Contact">
          <p>For privacy-related questions: <a href="mailto:contact@trestle.website" className="text-emerald-600 hover:underline">contact@trestle.website</a></p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
