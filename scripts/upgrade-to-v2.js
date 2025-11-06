// scripts/upgrade-to-v2.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Upgrading AMS Token to V2...\n");
    
    // ⚠️ CHANGE THIS TO YOUR PROXY ADDRESS
    const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "0xYourProxyAddressHere";
    
    if (PROXY_ADDRESS === "0xYourProxyAddressHere") {
        console.error("❌ Please set PROXY_ADDRESS in .env or as environment variable");
        process.exit(1);
    }
    
    // 1. Deploy V2
    console.log("1️⃣  Deploying Implementation V2...");
    const AMSToken_V2 = await ethers.getContractFactory("AMSToken_V2");
    const implementation_v2 = await AMSToken_V2.deploy();
    await implementation_v2.deployed();
    console.log("✅ Implementation V2:", implementation_v2.address, "\n");
    
    // 2. Propose Upgrade
    console.log("2️⃣  Proposing upgrade...");
    const proxy = await ethers.getContractAt("AMSProxy", PROXY_ADDRESS);
    const tx = await proxy.proposeUpgrade(implementation_v2.address);
    await tx.wait();
    console.log("✅ Upgrade proposed!\n");
    
    const upgradeTime = await proxy.pendingUpgradeTime();
    const now = Math.floor(Date.now() / 1000);
    const hoursRemaining = Math.ceil((upgradeTime - now) / 3600);
    
    console.log("📋 Upgrade Details:");
    console.log("   Pending Implementation:", implementation_v2.address);
    console.log("   Can execute after:", new Date(upgradeTime * 1000).toLocaleString());
    console.log("   Time remaining:", hoursRemaining, "hours\n");
    
    console.log("⏰ Wait 48 hours, then run:");
    console.log("   PROXY_ADDRESS=" + PROXY_ADDRESS, "npx hardhat run scripts/execute-upgrade.js --network bsc");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
