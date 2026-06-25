const { ethers } = require("ethers");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const dotenv = require("dotenv");
const ep = dotenv.config({ path: path.join(__dirname, "..", ".env") }).parsed || {};
const RPC_URL = ep.POLYGON_RPC_URL || process.env.POLYGON_RPC_URL || "https://polygon-mainnet.g.alchemy.com/v2/ygU97uLK7F_1K_4ivkJMM";
const PRIVATE_KEY = ep.DEPLOYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
const GAS_PRICE = ethers.parseUnits("500", "gwei");

async function main() {
  if (!PRIVATE_KEY) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, 137, { staticNetwork: true });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== 137) {
    console.error(`❌ Wrong network: chain ID ${chainId} (expected 137 = Polygon mainnet)`);
    process.exit(1);
  }

  const balance = await provider.getBalance(wallet.address);
  console.log("Network:", network.name, `(${chainId})`);
  console.log("Deployer:", wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC");
  console.log("RPC:", RPC_URL);
  console.log("Gas price:", ethers.formatUnits(GAS_PRICE, "gwei"), "gwei\n");

  if (balance === 0n) {
    console.error("❌ Zero balance — fund the deployer first");
    process.exit(1);
  }

  const hNOBT = process.env.HNBT_ADDRESS || "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD";
  const BRT = process.env.BRT_ADDRESS || "0xeCb4cAc0C9e5cBd42a9Ed36467ce8f96072AD58b";
  const BRT_LP = process.env.BRT_LP_ADDRESS || "0xc445b18b3ff85e0691fe416ad91e456f8697b166";

  const artifactPath = (name) => {
    const p = path.join(__dirname, "..", "artifacts", "contracts", `${name}.sol`, `${name}.json`);
    return JSON.parse(fs.readFileSync(p, "utf8"));
  };

  async function deployContract(name, args) {
    const artifact = artifactPath(name);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    console.log(`\n[Deploy] ${name}...`);
    const nonce = await provider.getTransactionCount(wallet.address, "pending");
    const deployTx = await factory.getDeployTransaction(...args);
    const tx = await wallet.sendTransaction({
      data: deployTx.data,
      gasLimit: 3_000_000n,
      gasPrice: GAS_PRICE,
      nonce,
    });
    console.log(`  tx: ${tx.hash} (nonce: ${nonce})`);
    console.log("  waiting for receipt...");
    const receipt = await Promise.race([
      tx.wait(1),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout after 90s")), 90_000)),
    ]);
    if (!receipt || !receipt.contractAddress) {
      console.error(`  ❌ Deploy failed — no contract address in receipt`);
      console.error(`  Status: ${receipt?.status}`);
      process.exit(1);
    }
    console.log(`  ✅ deployed to: ${receipt.contractAddress}`);
    return receipt.contractAddress;
  }

  const hNobtAddr = await deployContract("hNobtStaking", [hNOBT, BRT]);
  const broilerAddr = await deployContract("BroilerPlusStaking", [BRT_LP, BRT]);

  const DAY = 86400;
  const rate = ethers.parseEther("1");

  console.log("\n[Config] Setting reward rates...");

  const hNobtIface = new ethers.Interface(artifactPath("hNobtStaking").abi);
  let tx = await wallet.sendTransaction({
    to: hNobtAddr,
    data: hNobtIface.encodeFunctionData("setRewardRate", [rate, 30 * DAY]),
    gasLimit: 500_000n,
    gasPrice: GAS_PRICE,
    nonce: await provider.getTransactionCount(wallet.address, "pending"),
  });
  let receipt = await tx.wait(1);
  console.log(`  hNobtStaking rate set (tx: ${tx.hash}, block: ${receipt.blockNumber})`);

  const broilerIface = new ethers.Interface(artifactPath("BroilerPlusStaking").abi);
  tx = await wallet.sendTransaction({
    to: broilerAddr,
    data: broilerIface.encodeFunctionData("setRewardRate", [rate, rate, 30 * DAY]),
    gasLimit: 500_000n,
    gasPrice: GAS_PRICE,
    nonce: await provider.getTransactionCount(wallet.address, "pending"),
  });
  receipt = await tx.wait(1);
  console.log(`  BroilerPlusStaking rates set (tx: ${tx.hash}, block: ${receipt.blockNumber})`);

  console.log("\n[Verify] Running Etherscan verification...");
  if (process.env.ETHERSCAN_API_KEY) {
    const { execSync } = require("child_process");
    for (const [addr, name, ...ctorArgs] of [
      [hNobtAddr, "hNobtStaking", hNOBT, BRT],
      [broilerAddr, "BroilerPlusStaking", BRT_LP, BRT],
    ]) {
      const cmd = `npx hardhat verify --network polygon ${addr} ${ctorArgs.join(" ")}`;
      console.log(`  ${name}: verifying...`);
      try {
        execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
        console.log(`  ✅ ${name} verified`);
      } catch (e) {
        console.log(`  ⚠ ${name} verify failed (${e.message})`);
      }
    }
  } else {
    console.log("  ⚠ ETHERSCAN_API_KEY not set — skipping verification");
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("Polygon mainnet deployment complete");
  console.log("═══════════════════════════════════════════");
  console.log({ hNobtStaking: hNobtAddr, broilerPlusStaking: broilerAddr });
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err);
  process.exitCode = 1;
});
