import { JsonRpcProvider } from "ethers";

const HARDHAT_NODE_URL = "http://localhost:8545";

async function checkHardhatNode() {
  try {
    const provider = new JsonRpcProvider(HARDHAT_NODE_URL);
    
    // Try to get network info
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    // Check if it's a Hardhat node (chainId 31337)
    if (chainId !== 31337) {
      console.error(`
❌ Connected to network with chainId ${chainId}, but expected 31337 (Hardhat Node).

Make sure you're running:
  cd ../fhevm-hardhat-template && npx hardhat node
`);
      process.exit(1);
    }
    
    // Try to get client version
    const version = await provider.send("web3_clientVersion", []);
    
    if (!version.toLowerCase().includes("hardhat")) {
      console.warn(`
⚠️  Warning: Connected node doesn't identify as Hardhat.
Client version: ${version}
`);
    }
    
    // Check for FHEVM metadata
    try {
      await provider.send("fhevm_relayer_metadata", []);
      console.log(`✅ Hardhat FHEVM node is running at ${HARDHAT_NODE_URL}`);
    } catch (e) {
      console.warn(`
⚠️  Warning: Node is running but doesn't support fhevm_relayer_metadata.
This might not be an FHEVM Hardhat node.
`);
    }
    
    provider.destroy();
  } catch (error) {
    console.error(`
❌ Cannot connect to Hardhat node at ${HARDHAT_NODE_URL}

Please start the Hardhat node first:
  1. Open a new terminal
  2. cd ../fhevm-hardhat-template
  3. npx hardhat node

Then deploy the contracts:
  4. Open another terminal
  5. cd ../fhevm-hardhat-template
  6. npx hardhat deploy --network localhost

Error: ${error.message}
`);
    process.exit(1);
  }
}

// Run the check
checkHardhatNode();





