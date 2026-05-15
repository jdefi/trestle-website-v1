"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { API_BASE } from "@/config/contracts";

interface GaslessClaimProps {
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export default function GaslessClaim({ onSuccess, onError }: GaslessClaimProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const { signMessageAsync } = useSignMessage();

  /**
   * Sign a claim message off-chain (no gas!)
   * The backend/relayer will submit this on-chain
   */
  const handleGaslessClaim = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");
    setTxHash("");

    try {
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
          verifyingContract: process.env.NEXT_PUBLIC_DISTRIBUTOR_ADDRESS!,
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

      // Use self-hosted relayer (backend submits on-chain)
      await handleSelfHostedClaim(address, amount, claimId, signature);
    } catch (err: any) {
      const errorMessage = err.message || "Transaction failed";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address, signMessageAsync, onSuccess, onError]);

/**
 * Handle claim via self-hosted relayer
 */
   async function handleSelfHostedClaim(
     user: string,
     amount: bigint,
     claimId: string,
     signature: string
   ) {
     const response = await fetch(`${API_BASE}/api/gasless-claim`, {
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