# SwapHub Smart Contracts

Production-ready Solidity smart contracts for the SwapHub decentralized exchange (DEX).

## Contracts Overview

### Core Contracts

1. **SwapHubFactory.sol** - Factory contract for creating and managing liquidity pools
2. **SwapHubPool.sol** - AMM liquidity pool implementing constant product formula (x * y = k)
3. **SwapHubRouter.sol** - Router for multi-hop swaps and liquidity operations
4. **SwapHubToken.sol** - ERC20 token with faucet functionality for testing
5. **SwapHubLP.sol** - LP (Liquidity Provider) token for tracking pool shares

## Features

- **Constant Product AMM**: Uses x * y = k formula for pricing (like Uniswap V2)
- **0.3% Swap Fee**: Standard DEX fee distributed to liquidity providers
- **Multi-hop Routing**: Swap through multiple pools in a single transaction
- **Slippage Protection**: Minimum output amounts to protect against front-running
- **Flash Loan Resistant**: ReentrancyGuard on all state-changing functions

## Installation

The Hardhat dependencies are installed separately. To set up the contracts development environment:

```bash
# Install Hardhat and dependencies globally or in a separate directory
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

## Compile Contracts

```bash
npx hardhat compile
```

## Deploy

### Local Development (Hardhat)

1. Start local node:
```bash
npx hardhat node
```

2. In another terminal, deploy:
```bash
npx hardhat run contracts/scripts/deploy.js --network localhost
```

### Testnet (Sepolia)

1. Create `.env` file in the project root:
```env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_key
```

2. Deploy:
```bash
npx hardhat run contracts/scripts/deploy.js --network sepolia
```

## Contract Architecture

```
SwapHubFactory
    |
    |-- createPool() --> SwapHubPool
    |                        |
    |                        |-- SwapHubLP (LP Token)
    |                        |-- swap()
    |                        |-- addLiquidity()
    |                        |-- removeLiquidity()
    |
SwapHubRouter
    |-- swapExactTokensForTokens()
    |-- swapTokensForExactTokens()
    |-- addLiquidity()
    |-- removeLiquidity()
```

## Usage Examples

### Swap Tokens

```solidity
// Approve tokens first
IERC20(tokenIn).approve(routerAddress, amountIn);

// Swap
router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [tokenIn, tokenOut],
    msg.sender,
    block.timestamp + 300
);
```

### Add Liquidity

```solidity
// Approve both tokens
IERC20(tokenA).approve(routerAddress, amountA);
IERC20(tokenB).approve(routerAddress, amountB);

// Add liquidity
router.addLiquidity(
    tokenA,
    tokenB,
    amountA,
    amountB,
    amountAMin,
    amountBMin,
    msg.sender,
    block.timestamp + 300
);
```

## Security Considerations

- All state-changing functions use ReentrancyGuard
- Minimum liquidity locked forever to prevent empty pool attacks
- Slippage protection on all swaps and liquidity operations
- Owner functions limited to fee recipient updates only

## License

MIT
