// SwapHub Contract Addresses
// These addresses should be updated after deploying the contracts to your network

export interface NetworkAddresses {
  factory: string;
  router: string;
  weth: string;
  tokens: {
    [symbol: string]: string;
  };
  pools: {
    [pair: string]: string;
  };
}

// Supported chain IDs
export const SUPPORTED_CHAINS = {
  MAINNET: 1,
  GOERLI: 5,
  SEPOLIA: 11155111,
  POLYGON: 137,
  MUMBAI: 80001,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  HARDHAT: 31337,
  LOCALHOST: 1337,
} as const;

// Contract addresses per network
// NOTE: Update these addresses after deploying to each network
export const CONTRACT_ADDRESSES: Record<number, NetworkAddresses> = {
  // Hardhat Local Network
  [SUPPORTED_CHAINS.HARDHAT]: {
    factory: "0x0000000000000000000000000000000000000000", // Deploy and update
    router: "0x0000000000000000000000000000000000000000", // Deploy and update
    weth: "0x0000000000000000000000000000000000000000", // Deploy and update
    tokens: {
      USDC: "0x0000000000000000000000000000000000000000",
      DAI: "0x0000000000000000000000000000000000000000",
      WETH: "0x0000000000000000000000000000000000000000",
      LINK: "0x0000000000000000000000000000000000000000",
      UNI: "0x0000000000000000000000000000000000000000",
    },
    pools: {},
  },

  // Ethereum Sepolia Testnet
  [SUPPORTED_CHAINS.SEPOLIA]: {
    factory: "0x0000000000000000000000000000000000000000", // Deploy and update
    router: "0x0000000000000000000000000000000000000000", // Deploy and update
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Sepolia WETH
    tokens: {
      USDC: "0x0000000000000000000000000000000000000000",
      DAI: "0x0000000000000000000000000000000000000000",
    },
    pools: {},
  },

  // Polygon Mumbai Testnet
  [SUPPORTED_CHAINS.MUMBAI]: {
    factory: "0x0000000000000000000000000000000000000000",
    router: "0x0000000000000000000000000000000000000000",
    weth: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889", // Mumbai WMATIC
    tokens: {},
    pools: {},
  },

  // Base Mainnet
  [SUPPORTED_CHAINS.BASE]: {
    factory: "0x0000000000000000000000000000000000000000",
    router: "0x0000000000000000000000000000000000000000",
    weth: "0x4200000000000000000000000000000000000006", // Base WETH
    tokens: {},
    pools: {},
  },
};

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): NetworkAddresses | null {
  return CONTRACT_ADDRESSES[chainId] || null;
}

/**
 * Check if a chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}

/**
 * Get human readable chain name
 */
export function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    [SUPPORTED_CHAINS.MAINNET]: "Ethereum Mainnet",
    [SUPPORTED_CHAINS.GOERLI]: "Goerli Testnet",
    [SUPPORTED_CHAINS.SEPOLIA]: "Sepolia Testnet",
    [SUPPORTED_CHAINS.POLYGON]: "Polygon",
    [SUPPORTED_CHAINS.MUMBAI]: "Mumbai Testnet",
    [SUPPORTED_CHAINS.ARBITRUM]: "Arbitrum One",
    [SUPPORTED_CHAINS.OPTIMISM]: "Optimism",
    [SUPPORTED_CHAINS.BASE]: "Base",
    [SUPPORTED_CHAINS.HARDHAT]: "Hardhat Local",
    [SUPPORTED_CHAINS.LOCALHOST]: "Localhost",
  };
  return names[chainId] || `Chain ${chainId}`;
}

/**
 * Get block explorer URL for a chain
 */
export function getExplorerUrl(chainId: number): string {
  const explorers: Record<number, string> = {
    [SUPPORTED_CHAINS.MAINNET]: "https://etherscan.io",
    [SUPPORTED_CHAINS.GOERLI]: "https://goerli.etherscan.io",
    [SUPPORTED_CHAINS.SEPOLIA]: "https://sepolia.etherscan.io",
    [SUPPORTED_CHAINS.POLYGON]: "https://polygonscan.com",
    [SUPPORTED_CHAINS.MUMBAI]: "https://mumbai.polygonscan.com",
    [SUPPORTED_CHAINS.ARBITRUM]: "https://arbiscan.io",
    [SUPPORTED_CHAINS.OPTIMISM]: "https://optimistic.etherscan.io",
    [SUPPORTED_CHAINS.BASE]: "https://basescan.org",
  };
  return explorers[chainId] || "";
}

/**
 * Get transaction URL on block explorer
 */
export function getTxUrl(chainId: number, txHash: string): string {
  const baseUrl = getExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/tx/${txHash}` : "";
}

/**
 * Get address URL on block explorer
 */
export function getAddressUrl(chainId: number, address: string): string {
  const baseUrl = getExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/address/${address}` : "";
}
