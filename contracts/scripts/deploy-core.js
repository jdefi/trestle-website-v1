const { ethers } = require("ethers");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const dotenv = require("dotenv");
const ep = dotenv.config({ path: path.join(__dirname, "..", ".env") }).parsed || {};
const RPC_URL = ep.POLYGON_RPC_URL || ep.POLYGON_RPC || process.env.POLYGON_RPC_URL || process.env.POLYGON_RPC || "https://polygon-bor-rpc.publicnode.com";
const PRIVATE_KEY = ep.DEPLOYER_PRIVATE_KEY || ep.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;

const HNOBT = ep.HNOBT_ADDRESS || ep.HNBT_ADDRESS || process.env.HNOBT_ADDRESS || process.env.HNBT_ADDRESS || "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD";
const BRT = ep.BRT_ADDRESS || process.env.BRT_ADDRESS || "0xeCb4cAc0C9e5cBd42a9Ed36467ce8f96072AD58b";
const BRT_LP = ep.BRT_LP_ADDRESS || ep.BRT_WPOL_LP_ADDRESS || process.env.BRT_LP_ADDRESS || process.env.BRT_WPOL_LP_ADDRESS || "0xc445b18b3ff85e0691fe416ad91e456f8697b166";

// V1 contract addresses — these are the migration sources for core contracts
const V1_HNOBT_STAKING = "0xdc2b9a63CE40A64B47f484B0843FDcBEe9447b6d";
const V1_BROILER_PLUS_STAKING = "0x214068a99c541BFD1c6267Ee69B78fAe8426F3c0";

const artifactPath = (name) => {
  const p = path.join(__dirname, "..", "artifacts", "contracts", `${name}.sol`, `${name}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
};

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
  console.log("Gas price:", feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "EIP-1559 auto");
  console.log("");

  if (balance === 0n) {
    console.error("❌ Zero balance — fund the deployer first");
    process.exit(1);
  }

  async function sendTx(txReq) {
    const tx = await wallet.sendTransaction(txReq);
    console.log(`  tx: ${tx.hash}`);
    const receipt = await Promise.race([
      tx.wait(1),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout after 90s")), 90_000)),
    ]);
    return receipt;
  }

  async function deployContract(name, args) {
    const artifact = artifactPath(name);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    console.log(`\n[Deploy] ${name} (implementation)...`);
    const deployTx = await factory.getDeployTransaction(...args);
    const receipt = await sendTx({ data: deployTx.data, gasLimit: 3_000_000n });
    if (!receipt || !receipt.contractAddress) {
      console.error(`  ❌ Deploy failed — no contract address in receipt`);
      process.exit(1);
    }
    console.log(`  ✅ implementation: ${receipt.contractAddress}`);
    return { address: receipt.contractAddress, abi: artifact.abi };
  }

  async function deployProxy(name, implAddress, initData) {
    const proxyArtifact = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "artifacts", "@openzeppelin", "contracts", "proxy", "ERC1967", "ERC1967Proxy.sol", "ERC1967Proxy.json"),
        "utf8"
      )
    );
    const factory = new ethers.ContractFactory(proxyArtifact.abi, proxyArtifact.bytecode, wallet);
    console.log(`\n[Deploy] ${name} proxy...`);
    const deployTx = await factory.getDeployTransaction(implAddress, initData);
    const receipt = await sendTx({ data: deployTx.data, gasLimit: 3_000_000n });
    if (!receipt || !receipt.contractAddress) {
      console.error(`  ❌ Proxy deploy failed`);
      process.exit(1);
    }
    console.log(`  ✅ proxy: ${receipt.contractAddress}`);
    return receipt.contractAddress;
  }

  // ── Deploy hNobtCoreStaking ──────────────────────────────────
  const hNobtImpl = await deployContract("hNobtCoreStaking", []);
  const hNobtIface = new ethers.Interface(artifactPath("hNobtCoreStaking").abi);
  const hNobtInit = hNobtIface.encodeFunctionData("initialize", [HNOBT, BRT]);
  const hNobtCore = await deployProxy("hNobtCoreStaking", hNobtImpl.address, hNobtInit);

  // ── Deploy BroilerCoreStaking ────────────────────────────────
  const broilerImpl = await deployContract("BroilerCoreStaking", []);
  const broilerIface = new ethers.Interface(artifactPath("BroilerCoreStaking").abi);
  const broilerInit = broilerIface.encodeFunctionData("initialize", [BRT_LP, BRT]);
  const broilerCore = await deployProxy("BroilerCoreStaking", broilerImpl.address, broilerInit);

  // ── Configure migration sources ──────────────────────────────
  console.log("\n[Config] Setting migration sources...");

  let receipt = await sendTx({
    to: hNobtCore,
    data: hNobtIface.encodeFunctionData("setMigrationSource", [V1_HNOBT_STAKING]),
    gasLimit: 100_000n,
  });
  console.log(`  hNobtCoreStaking migrationSource → V1 hNobtStaking (tx: ${receipt.hash})`);

  receipt = await sendTx({
    to: broilerCore,
    data: broilerIface.encodeFunctionData("setMigrationSource", [V1_BROILER_PLUS_STAKING]),
    gasLimit: 100_000n,
  });
  console.log(`  BroilerCoreStaking migrationSource → V1 BroilerPlusStaking (tx: ${receipt.hash})`);

  // ── Fund reward pools ────────────────────────────────────────
  // Owner must manually transfer BRT to these contracts before setting rates.
  // Run after funding:
  //   npx hardhat run scripts/fund-core-rewards.js --network polygon
  console.log("\n  ⚠ Reward pools are unfunded. Transfer BRT to each proxy,");
  console.log("    then run scripts/fund-core-rewards.js or call setRewardRate directly.");

  // ── Output ───────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("Core Staking Deployment Complete");
  console.log("═══════════════════════════════════════════════════════");
  const out = {
    hNobtCoreStaking: hNobtCore,
    broilerCoreStaking: broilerCore,
    hNobtImplementation: hNobtImpl.address,
    broilerImplementation: broilerImpl.address,
    tokens: { hNOBT: HNOBT, BRT, BRT_LP },
    migrationSources: { v1HnobtStaking: V1_HNOBT_STAKING, v1BroilerPlusStaking: V1_BROILER_PLUS_STAKING },
  };
  console.log(JSON.stringify(out, null, 2));

  // Save for later use
  fs.writeFileSync(path.join(__dirname, "..", "deployed-core.json"), JSON.stringify(out, null, 2));
  console.log("\n  Saved to deployed-core.json");
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err);
  process.exitCode = 1;
});
