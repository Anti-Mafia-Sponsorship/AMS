// scripts/execute-upgrade.js
const { ethers } = require("hardhat");

async function main() {
    console.log("✅ Executing Upgrade...\n");
    
    const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "0xYourProxyAddressHere";
    
    if (PROXY_ADDRESS === "0xYourProxyAddressHere") {
        console.error("❌ Please set PROXY_ADDRESS");
        process.exit(1);
    }
    
    const proxy = await ethers.getContractAt("AMSProxy", PROXY_ADDRESS);
    
    // Check timelock
    const timeRemaining = await proxy.upgradeTimeRemaining();
    if (timeRemaining > 0) {
        console.log("❌ Timelock not expired yet!");
        console.log("   Remaining:", Math.ceil(timeRemaining / 3600), "hours");
        return;
    }
    
    // Execute
    console.log("Executing upgrade...");
    const tx = await proxy.executeUpgrade();
    await tx.wait();
    console.log("✅ Upgrade executed!\n");
    
    // Verify
    const newImpl = await proxy.implementation();
    console.log("New Implementation:", newImpl);
    
    // Initialize V2
    console.log("\nInitializing V2 features...");
    const token = await ethers.getContractAt("AMSToken_V2", PROXY_ADDRESS);
    const initTx = await token.initializeV2();
    await initTx.wait();
    console.log("✅ V2 initialized!\n");
    
    console.log("Version:", await token.getVersion());
    console.log("\n🎉 Upgrade complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
