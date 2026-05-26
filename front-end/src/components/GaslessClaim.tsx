"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignMessage, useWalletClient } from "wagmi";
import { polygon } from "viem/chains";
import { http, encodeFunctionData } from "viem";
import { createSmartAccountClient } from "@biconomy/sdk";

interface GaslessClaimProps {
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export default function GaslessClaim({ onSuccess, onError }: GaslessClaimProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const { signMessageAsync } = useSignMessage();

  const handleGaslessClaim = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError("");
    setTxHash("");

    try {
      const DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_DISTRIBUTOR_ADDRESS!;
      const BICONOMY_API_KEY = process.env.NEXT_PUBLIC_BICONOMY_API_KEY!;

      const claimId = crypto.randomUUID();
      const amount = BigInt(1000000000000000000);
      const chainId = 137;

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

      const signature = await signMessageAsync({
        message,
      });

      const RELAYER_MODE = process.env.NEXT_PUBLIC_RELAYER_MODE || "self-hosted";

      if (RELAYER_MODE === "biconomy" && walletClient) {
        const anySigner = walletClient as unknown as Parameters<typeof createSmartAccountClient>[0]["signer"];

        const smartAccount = await createSmartAccountClient({
          signer: anySigner,
          chain: polygon,
          transport: http("https://polygon.llamarpc.com"),
          bundlerTransport: http("https://bundler.biconomy.io/api/v1/polygon/rpc"),
          paymaster: true,
        });

        const encodedData = encodeFunctionData({
          abi: [
            "function claimOnBehalf(address user, uint256 amount, bytes32 claimId, bytes signature) external",
          ],
          functionName: "claimOnBehalf",
          args: [address as `0x${string}`, amount, claimId, signature as `0x${string}`],
        });

        const txHash = await smartAccount.sendTransaction({
          chain: polygon,
          to: DISTRIBUTOR_ADDRESS as `0x${string}`,
          data: encodedData,
        });

        setTxHash(txHash);
        onSuccess?.(txHash);
      } else {
        const response = await fetch("/api/gasless-claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: address,
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
    } catch (err: any) {
      const errorMessage = err.message || "Transaction failed";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address, walletClient, signMessageAsync, onSuccess, onError]);

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