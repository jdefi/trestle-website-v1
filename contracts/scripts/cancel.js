const { ethers } = require("ethers");
const RPC = process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

async function main() {
  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    gasPrice: ethers.parseUnits("500", "gwei"),
    gasLimit: 21000,
    nonce: 7,
  });
  console.log("Cancel sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("Canceled in block:", receipt.blockNumber);
}
main().catch(console.error);
