// SwapHub Deployment Script
// Run with: npx hardhat run scripts/deploy.js --network <network>

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const deployedAddresses = {};

  // 1. Deploy Test Tokens (for testnet/local only)
  console.log("\n--- Deploying Test Tokens ---");
  
  const SwapHubToken = await hre.ethers.getContractFactory("SwapHubToken");
  
  // Deploy WETH
  const weth = await SwapHubToken.deploy("Wrapped Ether", "WETH", 18, 1000000);
  await weth.waitForDeployment();
  deployedAddresses.WETH = await weth.getAddress();
  console.log("WETH deployed to:", deployedAddresses.WETH);

  // Deploy USDC (6 decimals)
  const usdc = await SwapHubToken.deploy("USD Coin", "USDC", 6, 10000000);
  await usdc.waitForDeployment();
  deployedAddresses.USDC = await usdc.getAddress();
  console.log("USDC deployed to:", deployedAddresses.USDC);

  // Deploy DAI
  const dai = await SwapHubToken.deploy("Dai Stablecoin", "DAI", 18, 10000000);
  await dai.waitForDeployment();
  deployedAddresses.DAI = await dai.getAddress();
  console.log("DAI deployed to:", deployedAddresses.DAI);

  // Deploy LINK
  const link = await SwapHubToken.deploy("Chainlink", "LINK", 18, 1000000);
  await link.waitForDeployment();
  deployedAddresses.LINK = await link.getAddress();
  console.log("LINK deployed to:", deployedAddresses.LINK);

  // Deploy UNI
  const uni = await SwapHubToken.deploy("Uniswap", "UNI", 18, 1000000);
  await uni.waitForDeployment();
  deployedAddresses.UNI = await uni.getAddress();
  console.log("UNI deployed to:", deployedAddresses.UNI);

  // 2. Deploy Factory
  console.log("\n--- Deploying Factory ---");
  const SwapHubFactory = await hre.ethers.getContractFactory("SwapHubFactory");
  const factory = await SwapHubFactory.deploy();
  await factory.waitForDeployment();
  deployedAddresses.factory = await factory.getAddress();
  console.log("Factory deployed to:", deployedAddresses.factory);

  // 3. Deploy Router
  console.log("\n--- Deploying Router ---");
  const SwapHubRouter = await hre.ethers.getContractFactory("SwapHubRouter");
  const router = await SwapHubRouter.deploy(deployedAddresses.factory, deployedAddresses.WETH);
  await router.waitForDeployment();
  deployedAddresses.router = await router.getAddress();
  console.log("Router deployed to:", deployedAddresses.router);

  // 4. Create Initial Pools
  console.log("\n--- Creating Initial Pools ---");
  
  // Create WETH-USDC pool
  const tx1 = await factory.createPool(deployedAddresses.WETH, deployedAddresses.USDC);
  await tx1.wait();
  const wethUsdcPool = await factory.getPool(deployedAddresses.WETH, deployedAddresses.USDC);
  deployedAddresses.pools = deployedAddresses.pools || {};
  deployedAddresses.pools["WETH-USDC"] = wethUsdcPool;
  console.log("WETH-USDC Pool deployed to:", wethUsdcPool);

  // Create WETH-DAI pool
  const tx2 = await factory.createPool(deployedAddresses.WETH, deployedAddresses.DAI);
  await tx2.wait();
  const wethDaiPool = await factory.getPool(deployedAddresses.WETH, deployedAddresses.DAI);
  deployedAddresses.pools["WETH-DAI"] = wethDaiPool;
  console.log("WETH-DAI Pool deployed to:", wethDaiPool);

  // Create USDC-DAI pool
  const tx3 = await factory.createPool(deployedAddresses.USDC, deployedAddresses.DAI);
  await tx3.wait();
  const usdcDaiPool = await factory.getPool(deployedAddresses.USDC, deployedAddresses.DAI);
  deployedAddresses.pools["USDC-DAI"] = usdcDaiPool;
  console.log("USDC-DAI Pool deployed to:", usdcDaiPool);

  // 5. Add Initial Liquidity (for testing)
  console.log("\n--- Adding Initial Liquidity ---");

  // Approve tokens for pools
  const wethContract = await hre.ethers.getContractAt("SwapHubToken", deployedAddresses.WETH);
  const usdcContract = await hre.ethers.getContractAt("SwapHubToken", deployedAddresses.USDC);
  const daiContract = await hre.ethers.getContractAt("SwapHubToken", deployedAddresses.DAI);

  // WETH-USDC: 100 WETH + 350,000 USDC (1 WETH = 3500 USDC)
  await wethContract.approve(wethUsdcPool, hre.ethers.parseEther("100"));
  await usdcContract.approve(wethUsdcPool, hre.ethers.parseUnits("350000", 6));
  
  const pool1 = await hre.ethers.getContractAt("SwapHubPool", wethUsdcPool);
  await pool1.addLiquidity(
    hre.ethers.parseEther("100"),
    hre.ethers.parseUnits("350000", 6),
    0,
    0
  );
  console.log("Added liquidity to WETH-USDC pool");

  // WETH-DAI: 100 WETH + 350,000 DAI
  await wethContract.approve(wethDaiPool, hre.ethers.parseEther("100"));
  await daiContract.approve(wethDaiPool, hre.ethers.parseEther("350000"));
  
  const pool2 = await hre.ethers.getContractAt("SwapHubPool", wethDaiPool);
  await pool2.addLiquidity(
    hre.ethers.parseEther("100"),
    hre.ethers.parseEther("350000"),
    0,
    0
  );
  console.log("Added liquidity to WETH-DAI pool");

  // USDC-DAI: 100,000 USDC + 100,000 DAI (1:1)
  await usdcContract.approve(usdcDaiPool, hre.ethers.parseUnits("100000", 6));
  await daiContract.approve(usdcDaiPool, hre.ethers.parseEther("100000"));
  
  const pool3 = await hre.ethers.getContractAt("SwapHubPool", usdcDaiPool);
  await pool3.addLiquidity(
    hre.ethers.parseUnits("100000", 6),
    hre.ethers.parseEther("100000"),
    0,
    0
  );
  console.log("Added liquidity to USDC-DAI pool");

  // Save deployed addresses
  console.log("\n--- Deployment Complete ---");
  console.log("\nDeployed Addresses:");
  console.log(JSON.stringify(deployedAddresses, null, 2));

  // Write addresses to file
  const addressesPath = path.join(__dirname, "..", "..", "lib", "contracts", "deployed-addresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(deployedAddresses, null, 2));
  console.log(`\nAddresses saved to: ${addressesPath}`);

  // Verification instructions
  console.log("\n--- Verification Instructions ---");
  console.log("To verify contracts on Etherscan, run:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${deployedAddresses.factory}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${deployedAddresses.router} ${deployedAddresses.factory} ${deployedAddresses.WETH}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
