import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
};

export default function TosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="text-sm text-emerald-600 hover:underline mb-8 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Version: 1.0</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <Section title="1. Acceptance of Terms">
          By accessing trestle.website (the &ldquo;Interface&rdquo;), you agree to these Terms of
          Service. These terms govern your use of a read-only frontend for interacting with
          decentralized smart contracts.
        </Section>

        <Section title="2. Nature of the Service: No Central Authority">
          <p><strong>Decentralized Architecture:</strong> This Interface is merely a user interface connecting to public smart contracts on the blockchain. We (the developers/maintainers) do not control, own, or operate the underlying protocol, the blockchain, or the smart contracts.</p>
          <p><strong>Irreversibility:</strong> All transactions are executed on-chain and are immutable and irreversible. We cannot reverse, refund, or cancel any transaction.</p>
          <p><strong>Continuous Operation:</strong> The smart contracts operate 24/7 on the blockchain. Even if this Interface is taken offline, the protocol continues to function indefinitely.</p>
        </Section>

        <Section title="3. Critical Disclaimer: Not Trestle Protocol (Celestia Bridge)">
          <p>We are <strong>NOT</strong> affiliated with, endorsed by, or connected to &ldquo;Trestle Protocol&rdquo; or &ldquo;Celestia Bridge.&rdquo;</p>
          <p>This Interface is an independent, community-built tool. Any use of the name &ldquo;Trestle&rdquo; refers solely to this specific frontend project. Users must verify smart contract addresses on-chain. We are not responsible for user errors or interacting with incorrect contracts.</p>
        </Section>

        <Section title="4. User Responsibility & Jurisdictional Compliance">
          <p><strong>Self-Custody:</strong> You are solely responsible for your private keys, seed phrases, and digital assets.</p>
          <p><strong>Local Laws:</strong> You represent that you are in a jurisdiction where using decentralized protocols and smart contracts is legal.</p>
          <p><strong>No Liability for Local Bans:</strong> We assume no legal responsibility if your country&rsquo;s laws prohibit the use of this technology. If your jurisdiction bans DeFi or blockchain interactions, you must not use this Interface.</p>
          <p><strong>Risk Acknowledgment:</strong> You acknowledge the risks of smart contract bugs, network congestion, and potential security vulnerabilities.</p>
        </Section>

        <Section title='5. "As Is" & Limitation of Liability'>
          <p>The Interface is provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; without warranty of any kind.</p>
          <p>To the fullest extent permitted by law, we disclaim all liability for any direct, indirect, incidental, or consequential damages, including loss of funds, data, or profits. Our liability, if any, is strictly limited to the amount you paid to use the Interface (which is $0.00).</p>
        </Section>

        <Section title="6. Modifications & Termination">
          <p>We may update, suspend, or discontinue this Interface at any time without notice. Since the underlying protocol is decentralized, you may still interact with it via other frontends even if this one is offline.</p>
        </Section>

        <Section title="7. Governing Law & Dispute Resolution">
          <p><strong>Neutrality Clause:</strong> As a decentralized project with no central legal entity, no single jurisdiction claims authority over these Terms.</p>
          <p><strong>User Compliance:</strong> You agree to comply with all applicable laws in your jurisdiction.</p>
          <p><strong>Dispute Resolution:</strong> Any disputes arising from the use of this Interface shall be via on-chain governance mechanisms if applicable.</p>
        </Section>

        <Section title="8. Contact">
          <p>For questions or reports:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email: contact@trestle.website</li>
            <li>GitHub: https://github.com/Trestle-DeFi</li>
            <li>Discord/Telegram: Available on our website</li>
          </ul>
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
