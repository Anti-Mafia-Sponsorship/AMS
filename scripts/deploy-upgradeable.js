// scripts/deploy-upgradeable.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Upgradeable AMS Token...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB\n");
    
    // 1. Deploy Implementation V1
    console.log("1️⃣  Deploying Implementation V1...");
    const AMSToken_V1 = await ethers.getContractFactory("AMSToken_V1");
    const implementation_v1 = await AMSToken_V1.deploy();
    await implementation_v1.deployed();
    console.log("✅ Implementation V1:", implementation_v1.address, "\n");
    
    // 2. Deploy Proxy
    console.log("2️⃣  Deploying Proxy...");
    const AMSProxy = await ethers.getContractFactory("AMSProxy");
    const proxy = await AMSProxy.deploy(
        implementation_v1.address,
        deployer.address
    );
    await proxy.deployed();
    console.log("✅ Proxy (TOKEN ADDRESS):", proxy.address, "\n");
    
    // 3. Initialize Token
    console.log("3️⃣  Initializing Token...");
    const token = await ethers.getContractAt("AMSToken_V1", proxy.address);
    await token.initialize();
    console.log("✅ Token initialized!\n");
    
    // 4. Verify
    console.log("4️⃣  Verification:");
    console.log("   Name:", await token.name());
    console.log("   Symbol:", await token.symbol());
    console.log("   Decimals:", await token.decimals());
    console.log("   Total Supply:", ethers.utils.formatEther(await token.totalSupply()));
    console.log("   Owner:", await token.owner());
    console.log("   Owner Balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("\n");
    
    // 5. Summary
    console.log("✅ DEPLOYMENT COMPLETE!\n");
    console.log("📋 Save these addresses:");
    console.log("┌─────────────────────────────────────────────┐");
    console.log("│ Token Address (Proxy):", proxy.address);
    console.log("│ Implementation V1:", implementation_v1.address);
    console.log("│ Admin:", deployer.address);
    console.log("└─────────────────────────────────────────────┘");
    console.log("\n");
    console.log("⚠️  IMPORTANT:");
    console.log("   - Use PROXY address for everything");
    console.log("   - Keep admin private key secure");
    console.log("   - Test thoroughly before mainnet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
