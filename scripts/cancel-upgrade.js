// scripts/cancel-upgrade.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🚫 Cancelling Upgrade...\n");
    
    const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "0xYourProxyAddressHere";
    
    const proxy = await ethers.getContractAt("AMSProxy", PROXY_ADDRESS);
    
    const pendingImpl = await proxy.pendingImplementation();
    if (pendingImpl === ethers.constants.AddressZero) {
        console.log("ℹ️  No pending upgrade to cancel");
        return;
    }
    
    console.log("Pending Implementation:", pendingImpl);
    console.log("Cancelling...");
    
    const tx = await proxy.cancelUpgrade();
    await tx.wait();
    
    console.log("✅ Upgrade cancelled!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
