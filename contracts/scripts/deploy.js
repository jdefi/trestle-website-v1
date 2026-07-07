const { ethers } = require("ethers");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const dotenv = require("dotenv");
const ep = dotenv.config({ path: path.join(__dirname, "..", ".env") }).parsed || {};
const RPC_URL = ep.POLYGON_RPC_URL || process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com";
const PRIVATE_KEY = ep.DEPLOYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;

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

  const feeData = await provider.getFeeData();
  const balance = await provider.getBalance(wallet.address);
  console.log("Network:", network.name, `(${chainId})`);
  console.log("Deployer:", wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC");
  console.log("RPC:", RPC_URL);
  console.log("Gas price:", feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "EIP-1559 auto");
  console.log("Max fee:", feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") + " gwei" : "N/A");
  console.log("Priority fee:", feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") + " gwei" : "N/A\n");

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

  async function sendTx(txReq) {
    const tx = await wallet.sendTransaction(txReq);
    console.log(`  tx: ${tx.hash}`);
    console.log("  waiting for receipt...");
    const receipt = await Promise.race([
      tx.wait(1),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout after 90s")), 90_000)),
    ]);
    return receipt;
  }

  async function deployContract(name, args) {
    const artifact = artifactPath(name);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    console.log(`\n[Deploy] ${name}...`);
    const deployTx = await factory.getDeployTransaction(...args);
    const receipt = await sendTx({ data: deployTx.data, gasLimit: 3_000_000n });
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
  const hNobtRate = 1_000_000_000n;            // 1e9
  const broilerBriRate = 1_000_000_000n;       // 1e9
  const broilerXgovRate = 1_000_000_000n;      // 1e9

  console.log("\n[Config] Setting reward rates...");

  const hNobtIface = new ethers.Interface(artifactPath("hNobtStaking").abi);
  let receipt = await sendTx({
    to: hNobtAddr,
    data: hNobtIface.encodeFunctionData("setRewardRate", [hNobtRate, 30 * DAY]),
    gasLimit: 500_000n,
  });
  console.log(`  hNobtStaking rate set (tx: ${receipt.hash}, block: ${receipt.blockNumber})`);

  const broilerIface = new ethers.Interface(artifactPath("BroilerPlusStaking").abi);
  receipt = await sendTx({
    to: broilerAddr,
    data: broilerIface.encodeFunctionData("setRewardRate", [broilerBriRate, broilerXgovRate, 30 * DAY]),
    gasLimit: 500_000n,
  });
  console.log(`  BroilerPlusStaking rates set (tx: ${receipt.hash}, block: ${receipt.blockNumber})`);

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
