import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAMES = ["ZenChainDiary"];

// Path to fhevm-hardhat-template
const rel = "../fhevm-hardhat-template";

// Output directory for ABI files
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/${dirname}${line}`
  );
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Go to '${dirname}' directory\n2. Run 'npm install' if needed\n3. Run 'npx hardhat node' in terminal 1\n4. Run 'npx hardhat deploy --network localhost' in terminal 2.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const jsonPath = path.join(chainDeploymentDir, `${contractName}.json`);
  
  if (!fs.existsSync(jsonPath)) {
    if (!optional) {
      console.error(
        `${line}Contract ${contractName} not deployed on ${chainName}.\n\nRun: npx hardhat deploy --network ${chainName}${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(jsonPath, "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;
  obj.chainName = chainName;

  return obj;
}

// Generate ABI and addresses for each contract
for (const CONTRACT_NAME of CONTRACT_NAMES) {
  console.log(`\n📝 Generating ABI for ${CONTRACT_NAME}...\n`);

  // Read localhost deployment (required)
  const deployLocalhost = readDeployment(
    "localhost",
    31337,
    CONTRACT_NAME,
    false
  );

  // Read Sepolia deployment (optional)
  let deploySepolia = readDeployment(
    "sepolia",
    11155111,
    CONTRACT_NAME,
    true
  );
  
  if (!deploySepolia) {
    // Use localhost ABI with zero address for Sepolia
    deploySepolia = {
      abi: deployLocalhost.abi,
      address: "0x0000000000000000000000000000000000000000",
      chainId: 11155111,
      chainName: "sepolia",
    };
  }

  // Verify ABIs match if both exist
  if (
    deployLocalhost &&
    deploySepolia &&
    deploySepolia.address !== "0x0000000000000000000000000000000000000000"
  ) {
    if (
      JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
    ) {
      console.error(
        `${line}ABIs differ between localhost and Sepolia for ${CONTRACT_NAME}. Consider redeploying.${line}`
      );
      process.exit(1);
    }
  }

  // Generate TypeScript ABI file
  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify(
    { abi: deployLocalhost.abi },
    null,
    2
  )} as const;
`;

  // Generate TypeScript addresses file
  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
} as const;
`;

  // Write files
  const abiPath = path.join(outdir, `${CONTRACT_NAME}ABI.ts`);
  const addressesPath = path.join(outdir, `${CONTRACT_NAME}Addresses.ts`);

  fs.writeFileSync(abiPath, tsCode, "utf-8");
  fs.writeFileSync(addressesPath, tsAddresses, "utf-8");

  console.log(`✅ Generated ${abiPath}`);
  console.log(`✅ Generated ${addressesPath}`);
  console.log(`   Localhost: ${deployLocalhost.address}`);
  console.log(`   Sepolia: ${deploySepolia.address}`);
}

console.log("\n✅ ABI generation complete!\n");





