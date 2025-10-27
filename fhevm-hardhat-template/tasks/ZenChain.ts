import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("zenchain:submit", "Submit a diary entry")
  .addParam("mood", "Mood score (1-10)")
  .addParam("stress", "Stress score (1-10)")
  .addParam("sleep", "Sleep quality (1-10)")
  .addOptionalParam("tags", "Mood tags (hex bitmask)", "0x00")
  .addOptionalParam("public", "Include in global stats", "true")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contract = await hre.ethers.getContract("ZenChainDiary");
    const [signer] = await hre.ethers.getSigners();
    const contractAddress = await contract.getAddress();

    console.log("Submitting diary entry...");
    console.log(`  Mood: ${taskArgs.mood}/10`);
    console.log(`  Stress: ${taskArgs.stress}/10`);
    console.log(`  Sleep: ${taskArgs.sleep}/10`);
    console.log(`  Tags: ${taskArgs.tags}`);
    console.log(`  Public: ${taskArgs.public}`);

    // Create encrypted input
    const { createInstance } = await import("@fhevm/mock-utils");
    const instance = await createInstance(signer, hre.ethers, contract);

    const input = instance.createEncryptedInput(contractAddress, signer.address);
    input.add8(parseInt(taskArgs.mood));
    input.add8(parseInt(taskArgs.stress));
    input.add8(parseInt(taskArgs.sleep));
    input.add32(parseInt(taskArgs.tags));
    
    const encrypted = await input.encrypt();

    // Submit entry
    const tx = await contract.submitEntry(
      encrypted.handles[0],
      encrypted.inputProof,
      encrypted.handles[1],
      encrypted.inputProof,
      encrypted.handles[2],
      encrypted.inputProof,
      encrypted.handles[3],
      encrypted.inputProof,
      taskArgs.public === "true"
    );

    const receipt = await tx.wait();
    console.log(`✅ Entry submitted! Tx: ${receipt?.hash}`);

    // Get entry count
    const count = await contract.getUserEntryCount(signer.address);
    console.log(`Total entries: ${count}`);
  });

task("zenchain:view", "View diary entries")
  .addOptionalParam("offset", "Offset", "0")
  .addOptionalParam("limit", "Limit", "10")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contract = await hre.ethers.getContract("ZenChainDiary");
    const [signer] = await hre.ethers.getSigners();
    const contractAddress = await contract.getAddress();

    console.log(`Viewing entries for ${signer.address}...`);

    const entryIds = await contract.getUserEntries(
      signer.address,
      parseInt(taskArgs.offset),
      parseInt(taskArgs.limit)
    );

    if (entryIds.length === 0) {
      console.log("No entries found.");
      return;
    }

    console.log(`Found ${entryIds.length} entries:\n`);

    // Create instance for decryption
    const { createInstance } = await import("@fhevm/mock-utils");
    const instance = await createInstance(signer, hre.ethers, contract);

    for (const id of entryIds) {
      const entry = await contract.getEntry(id);
      
      console.log(`Entry #${id}`);
      console.log(`  Timestamp: ${new Date(Number(entry.timestamp) * 1000).toLocaleString()}`);
      console.log(`  Public: ${entry.isPublic}`);
      console.log(`  Deleted: ${entry.isDeleted}`);

      // Decrypt values
      try {
        const mood = await instance.decrypt(contractAddress, entry.moodScore);
        const stress = await instance.decrypt(contractAddress, entry.stressScore);
        const sleep = await instance.decrypt(contractAddress, entry.sleepQuality);
        const tags = await instance.decrypt(contractAddress, entry.moodTags);

        console.log(`  Mood: ${mood}/10`);
        console.log(`  Stress: ${stress}/10`);
        console.log(`  Sleep: ${sleep}/10`);
        console.log(`  Tags: 0x${tags.toString(16)}`);
      } catch (e) {
        console.log(`  (Decryption failed: ${e})`);
      }
      
      console.log("");
    }
  });

task("zenchain:profile", "View user profile")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contract = await hre.ethers.getContract("ZenChainDiary");
    const [signer] = await hre.ethers.getSigners();
    const contractAddress = await contract.getAddress();

    const profile = await contract.getUserProfile(signer.address);

    if (!profile.registered) {
      console.log("User not registered yet.");
      return;
    }

    console.log(`Profile for ${signer.address}:`);
    console.log(`  Registered at: ${new Date(Number(profile.registeredAt) * 1000).toLocaleString()}`);
    console.log(`  Privacy setting: ${profile.allowPublic ? "Public" : "Private"}`);

    // Decrypt stats
    const { createInstance } = await import("@fhevm/mock-utils");
    const instance = await createInstance(signer, hre.ethers, contract);

    try {
      const totalEntries = await instance.decrypt(contractAddress, profile.totalEntries);
      const sumMood = await instance.decrypt(contractAddress, profile.sumMood);
      const sumStress = await instance.decrypt(contractAddress, profile.sumStress);
      const sumSleep = await instance.decrypt(contractAddress, profile.sumSleep);

      console.log(`  Total entries: ${totalEntries}`);
      
      if (totalEntries > 0) {
        console.log(`  Average mood: ${(Number(sumMood) / Number(totalEntries)).toFixed(2)}/10`);
        console.log(`  Average stress: ${(Number(sumStress) / Number(totalEntries)).toFixed(2)}/10`);
        console.log(`  Average sleep: ${(Number(sumSleep) / Number(totalEntries)).toFixed(2)}/10`);
      }
    } catch (e) {
      console.log(`  (Decryption failed: ${e})`);
    }
  });

task("zenchain:privacy", "Update privacy setting")
  .addParam("public", "Allow public (true/false)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const contract = await hre.ethers.getContract("ZenChainDiary");
    
    const allowPublic = taskArgs.public === "true";
    
    const tx = await contract.updatePrivacySetting(allowPublic);
    await tx.wait();
    
    console.log(`✅ Privacy setting updated: ${allowPublic ? "Public" : "Private"}`);
  });





