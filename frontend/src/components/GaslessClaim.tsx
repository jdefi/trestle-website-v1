"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { encodeFunctionData } from "viem";

interface GaslessClaimProps {
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export default function GaslessClaim({ onSuccess, onError }: GaslessClaimProps) {
  const { address, connector } = useAccount();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const { signMessageAsync } = useSignMessage();

  /**
   * Sign a claim message off-chain (no gas!)
   * The backend/relayer will submit this on-chain
   */
  const handleGaslessClaim = useCallback(async () => {
    if (!address || !connector) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");
    setTxHash("");

    try {
      const RELAYER_MODE = process.env.NEXT_PUBLIC_RELAYER_MODE || "self-hosted";
      const DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_DISTRIBUTOR_ADDRESS!;

      // 1. User signs a message (FREE - no gas!)
      const claimId = crypto.randomUUID();
      const amount = BigInt(1000000000000000000); // 1 token in wei
      const chainId = 137; // Polygon mainnet

      // Create the message to sign
      const message = JSON.stringify({
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          Claim: [
            { name: "user", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "claimId", type: "bytes32" },
          ],
        },
        domain: {
          name: "RewardDistributor",
          version: "1",
          chainId,
          verifyingContract: DISTRIBUTOR_ADDRESS,
        },
        message: {
          user: address,
          amount: amount.toString(),
          claimId,
        },
        primaryType: "Claim",
      });

      // 2. Get signature from user's wallet
      const signature = await signMessageAsync({
        message: JSON.stringify(JSON.parse(message)),
      });

      if (RELAYER_MODE === "biconomy") {
        // Option A: Use Biconomy for gasless transactions
        await handleBiconomyClaim(address, amount, claimId, signature, DISTRIBUTOR_ADDRESS);
      } else {
        // Option B: Use self-hosted relayer (your backend)
        await handleSelfHostedClaim(address, amount, claimId, signature);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Transaction failed";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address, connector, signMessageAsync, onSuccess, onError]);

  /**
   * Handle claim via self-hosted relayer
   */
  async function handleSelfHostedClaim(
    user: string,
    amount: bigint,
    claimId: string,
    signature: string
  ) {
    const response = await fetch("/api/gasless-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user,
        amount: amount.toString(),
        claimId,
        signature,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Claim failed");
    }

    const data = await response.json();
    setTxHash(data.txHash);
    onSuccess?.(data.txHash);
  }

  /**
   * Handle claim via Biconomy
   */
  async function handleBiconomyClaim(
    user: string,
    amount: bigint,
    claimId: string,
    signature: string,
    contractAddress: string
  ) {
    // Initialize Biconomy
    const provider = await connector?.getProvider();
    const signer = await connector?.getSigner();

    const { createSmartAccountClient, ENTRYPOINT_ADDRESS_V07 } = await import(
      "@biconomy/sdk"
    );

    const biconomyPaymasterUrl = `https://paymaster.biconomy.io/api/v1/paymaster/${process.env.NEXT_PUBLIC_BICONOMY_API_KEY}`;

    const smartAccount = await createSmartAccountClient({
      signer,
      paymasterUrl: biconomyPaymasterUrl,
      entryPointAddress: ENTRYPOINT_ADDRESS_V07,
      bundlerUrl: "https://bundler.biconomy.io/api/v1/polygon/rpc",
    });

    // Encode the function call
    const encodedData = encodeFunctionData({
      abi: [
        "function claimOnBehalf(address user, uint256 amount, bytes32 claimId, bytes signature) external",
      ],
      functionName: "claimOnBehalf",
      args: [user, amount, claimId, signature as `0x${string}`],
    });

    // Execute gasless transaction
    const tx = await smartAccount.sendTransaction({
      to: contractAddress as `0x${string}`,
      data: encodedData as `0x${string}`,
    });

    const receipt = await tx.wait();
    setTxHash(receipt.transactionHash);
    onSuccess?.(receipt.transactionHash);
  }

  return (
    <div className="gasless-claim-container">
      <button
        onClick={handleGaslessClaim}
        disabled={loading || !address}
        className="gasless-btn"
      >
        {loading ? "Processing..." : "🎁 Claim Reward (Gasless)"}
      </button>

      {txHash && (
        <div className="success-msg">
          <p>✅ Claim submitted successfully!</p>
          <a
            href={`https://polygonscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Polygonscan →
          </a>
        </div>
      )}

      {error && (
        <div className="error-msg">
          <p>❌ {error}</p>
        </div>
      )}

      <style jsx>{`
        .gasless-claim-container {
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }
        .gasless-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          width: 100%;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }
        .gasless-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }
        .gasless-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .success-msg {
          margin-top: 16px;
          padding: 16px;
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 12px;
        }
        .success-msg a {
          color: #6366f1;
          text-decoration: underline;
          font-weight: 500;
        }
        .error-msg {
          margin-top: 16px;
          padding: 16px;
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 12px;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}