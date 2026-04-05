"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { BrowserProvider, JsonRpcSigner, formatEther, parseEther } from "ethers"

// Token configuration with CoinGecko IDs for real price fetching
export const TOKENS: Record<string, TokenInfo> = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logo: "⟠",
    coingeckoId: "ethereum",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "💵",
    coingeckoId: "usd-coin",
  },
  DAI: {
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    logo: "◈",
    coingeckoId: "dai",
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    logo: "Ξ",
    coingeckoId: "weth",
  },
  LINK: {
    symbol: "LINK",
    name: "Chainlink",
    decimals: 18,
    logo: "⬡",
    coingeckoId: "chainlink",
  },
  UNI: {
    symbol: "UNI",
    name: "Uniswap",
    decimals: 18,
    logo: "🦄",
    coingeckoId: "uniswap",
  },
  AAVE: {
    symbol: "AAVE",
    name: "Aave",
    decimals: 18,
    logo: "👻",
    coingeckoId: "aave",
  },
  MATIC: {
    symbol: "MATIC",
    name: "Polygon",
    decimals: 18,
    logo: "⬟",
    coingeckoId: "matic-network",
  },
}

export interface TokenInfo {
  symbol: string
  name: string
  decimals: number
  logo: string
  coingeckoId: string
}

export interface Transaction {
  hash: string
  type: "swap" | "liquidity" | "transfer"
  fromToken: string
  toToken?: string
  fromAmount: string
  toAmount?: string
  timestamp: number
  status: "pending" | "success" | "failed"
}

// Token prices in USD (will be updated with real prices)
export const DEFAULT_TOKEN_PRICES: Record<string, number> = {
  ETH: 3500,
  USDC: 1,
  DAI: 1,
  WETH: 3500,
  LINK: 15,
  UNI: 8,
  AAVE: 90,
  MATIC: 0.5,
}

interface TokenBalance {
  symbol: string
  balance: string
}

interface SimulatedBalances {
  [account: string]: {
    [token: string]: number
  }
}

interface Web3ContextType {
  account: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  ethBalance: string
  tokenBalances: TokenBalance[]
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToHardhat: () => Promise<void>
  refreshBalances: () => Promise<void>
  addTokenToWallet: (token: TokenInfo) => Promise<void>
  // Simulated token functions
  mintTokens: (token: string, amount: number) => void
  getSimulatedBalance: (token: string) => number
  updateSimulatedBalance: (token: string, newBalance: number) => void
  tokensDeployed: boolean
  setTokensDeployed: (deployed: boolean) => void
  // Token prices
  tokenPrices: Record<string, number>
  getExchangeRate: (fromToken: string, toToken: string) => number
  refreshPrices: () => Promise<void>
  pricesLoading: boolean
  // Transaction history
  transactions: Transaction[]
  addTransaction: (tx: Transaction) => void
  updateTransactionStatus: (hash: string, status: Transaction["status"]) => void
}

const Web3Context = createContext<Web3ContextType | null>(null)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [ethBalance, setEthBalance] = useState("0")
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [simulatedBalances, setSimulatedBalances] = useState<SimulatedBalances>({})
  const [tokensDeployed, setTokensDeployed] = useState(false)
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>(DEFAULT_TOKEN_PRICES)
  const [pricesLoading, setPricesLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Fetch real token prices from CoinGecko
  const refreshPrices = useCallback(async () => {
    setPricesLoading(true)
    try {
      const ids = Object.values(TOKENS).map(t => t.coingeckoId).join(',')
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      )
      
      if (response.ok) {
        const data = await response.json()
        const newPrices: Record<string, number> = {}
        
        for (const [symbol, token] of Object.entries(TOKENS)) {
          const price = data[token.coingeckoId]?.usd
          newPrices[symbol] = price || DEFAULT_TOKEN_PRICES[symbol] || 0
        }
        
        setTokenPrices(newPrices)
        localStorage.setItem("tokenPrices", JSON.stringify(newPrices))
        localStorage.setItem("tokenPricesTimestamp", Date.now().toString())
      }
    } catch (error) {
      console.error("Error fetching token prices:", error)
      // Use cached prices or defaults
      const cached = localStorage.getItem("tokenPrices")
      if (cached) {
        setTokenPrices(JSON.parse(cached))
      }
    } finally {
      setPricesLoading(false)
    }
  }, [])

  // Calculate exchange rate between two tokens
  const getExchangeRate = useCallback((fromToken: string, toToken: string): number => {
    const fromPrice = tokenPrices[fromToken] || DEFAULT_TOKEN_PRICES[fromToken] || 0
    const toPrice = tokenPrices[toToken] || DEFAULT_TOKEN_PRICES[toToken] || 0
    if (toPrice === 0) return 0
    return fromPrice / toPrice
  }, [tokenPrices])

  // Add transaction to history
  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions(prev => {
      const updated = [tx, ...prev].slice(0, 50) // Keep last 50 transactions
      if (account) {
        localStorage.setItem(`transactions_${account}`, JSON.stringify(updated))
      }
      return updated
    })
  }, [account])

  // Update transaction status
  const updateTransactionStatus = useCallback((hash: string, status: Transaction["status"]) => {
    setTransactions(prev => {
      const updated = prev.map(tx => 
        tx.hash === hash ? { ...tx, status } : tx
      )
      if (account) {
        localStorage.setItem(`transactions_${account}`, JSON.stringify(updated))
      }
      return updated
    })
  }, [account])

  // Load simulated balances and transactions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("simulatedBalances")
    if (saved) {
      setSimulatedBalances(JSON.parse(saved))
    }
    const deployed = localStorage.getItem("tokensDeployed")
    if (deployed === "true") {
      setTokensDeployed(true)
    }
    // Load cached prices
    const cachedPrices = localStorage.getItem("tokenPrices")
    const pricesTimestamp = localStorage.getItem("tokenPricesTimestamp")
    if (cachedPrices) {
      setTokenPrices(JSON.parse(cachedPrices))
    }
    // Refresh prices if cache is older than 5 minutes
    const fiveMinutes = 5 * 60 * 1000
    if (!pricesTimestamp || Date.now() - parseInt(pricesTimestamp) > fiveMinutes) {
      refreshPrices()
    }
  }, [refreshPrices])

  // Load transactions for current account
  useEffect(() => {
    if (account) {
      const savedTx = localStorage.getItem(`transactions_${account}`)
      if (savedTx) {
        setTransactions(JSON.parse(savedTx))
      } else {
        setTransactions([])
      }
    }
  }, [account])

  // Save simulated balances to localStorage
  useEffect(() => {
    if (Object.keys(simulatedBalances).length > 0) {
      localStorage.setItem("simulatedBalances", JSON.stringify(simulatedBalances))
    }
  }, [simulatedBalances])

  // Save tokensDeployed to localStorage
  useEffect(() => {
    localStorage.setItem("tokensDeployed", tokensDeployed.toString())
  }, [tokensDeployed])

  const getSimulatedBalance = useCallback((token: string): number => {
    if (!account) return 0
    return simulatedBalances[account]?.[token] || 0
  }, [account, simulatedBalances])

  const updateSimulatedBalance = useCallback((token: string, newBalance: number) => {
    if (!account) return
    setSimulatedBalances(prev => ({
      ...prev,
      [account]: {
        ...(prev[account] || {}),
        [token]: Math.max(0, newBalance)
      }
    }))
  }, [account])

  const mintTokens = useCallback((token: string, amount: number) => {
    if (!account) return
    const currentBalance = getSimulatedBalance(token)
    updateSimulatedBalance(token, currentBalance + amount)
  }, [account, getSimulatedBalance, updateSimulatedBalance])

  const refreshBalances = useCallback(async () => {
    if (!provider || !account) return

    try {
      // Get real ETH balance from blockchain
      const balance = await provider.getBalance(account)
      setEthBalance(formatEther(balance))

      // Build token balances array (ETH from blockchain, others from simulated state)
      const balances: TokenBalance[] = []
      
      for (const [key, token] of Object.entries(TOKENS)) {
        if (key === "ETH") {
          balances.push({
            symbol: token.symbol,
            balance: formatEther(balance),
          })
        } else {
          const simBalance = getSimulatedBalance(key)
          balances.push({
            symbol: token.symbol,
            balance: simBalance.toFixed(4),
          })
        }
      }
      
      setTokenBalances(balances)
    } catch (error) {
      console.error("Error refreshing balances:", error)
    }
  }, [provider, account, getSimulatedBalance])

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask to use this dApp!")
      return
    }

    setIsConnecting(true)
    try {
      const browserProvider = new BrowserProvider(window.ethereum)
      const accounts = await browserProvider.send("eth_requestAccounts", [])
      const network = await browserProvider.getNetwork()
      const walletSigner = await browserProvider.getSigner()

      setProvider(browserProvider)
      setSigner(walletSigner)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))

      localStorage.setItem("walletConnected", "true")
    } catch (error) {
      console.error("Error connecting wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
    setEthBalance("0")
    setTokenBalances([])
    localStorage.removeItem("walletConnected")
  }

  const switchToHardhat = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7A69" }],
      })
    } catch (error: unknown) {
      if ((error as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x7A69",
              chainName: "Hardhat Local",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["http://127.0.0.1:8545"],
            },
          ],
        })
      }
    }
  }

  const addTokenToWallet = async (token: typeof TOKENS.ETH) => {
    if (!window.ethereum || token.symbol === "ETH") return
    alert(`${token.symbol} is a simulated token. Your balance: ${getSimulatedBalance(token.symbol)} ${token.symbol}`)
  }

  // Auto-connect on mount
  useEffect(() => {
    if (localStorage.getItem("walletConnected") === "true") {
      connectWallet()
    }
  }, [])

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[]
      if (accounts.length === 0) {
        disconnectWallet()
      } else {
        setAccount(accounts[0])
      }
    }

    const handleChainChanged = (...args: unknown[]) => {
      const chainIdHex = args[0] as string
      setChainId(parseInt(chainIdHex, 16))
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum?.removeListener("chainChanged", handleChainChanged)
    }
  }, [])

  // Refresh balances when account or simulated balances change
  useEffect(() => {
    if (account && provider) {
      refreshBalances()
    }
  }, [account, provider, refreshBalances, simulatedBalances])

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnected: !!account,
        isConnecting,
        ethBalance,
        tokenBalances,
        provider,
        signer,
        connectWallet,
        disconnectWallet,
        switchToHardhat,
        refreshBalances,
        addTokenToWallet,
        mintTokens,
        getSimulatedBalance,
        updateSimulatedBalance,
        tokensDeployed,
        setTokensDeployed,
        tokenPrices,
        getExchangeRate,
        refreshPrices,
        pricesLoading,
        transactions,
        addTransaction,
        updateTransactionStatus,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

// Export utilities
export { formatEther, parseEther }
