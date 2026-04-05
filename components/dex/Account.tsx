"use client"

import { useWeb3, TOKENS } from "@/context/Web3Context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Plus, Wallet, ExternalLink, Copy, Check, History, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react"
import { useState } from "react"

export function Account() {
  const { 
    isConnected, 
    account, 
    chainId,
    ethBalance, 
    tokenBalances, 
    refreshBalances, 
    addTokenToWallet,
    connectWallet,
    getSimulatedBalance,
    tokenPrices,
    transactions,
    refreshPrices,
    pricesLoading,
  } = useWeb3()
  
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshBalances()
    setTimeout(() => setRefreshing(false), 500)
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 11155111:
        return "Sepolia Testnet"
      case 31337:
        return "Hardhat Local"
      default:
        return "Unknown Network"
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl" id="account">
        <CardContent className="py-12 text-center">
          <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-6">
            Connect your MetaMask wallet to view your token balances
          </p>
          <Button
            onClick={connectWallet}
            className="bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-semibold hover:from-lime-500 hover:to-emerald-600"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl" id="account">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-lime-400" />
              Your Account
            </CardTitle>
            <CardDescription>View your token balances and portfolio</CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Info */}
        <div className="bg-gradient-to-r from-lime-400/10 to-emerald-400/10 border border-lime-400/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connected Wallet</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${chainId === 31337 ? "bg-lime-400" : "bg-yellow-400"}`} />
              <span className="text-sm font-medium">{getNetworkName(chainId)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-black/20 px-3 py-2 rounded-lg font-mono overflow-hidden text-ellipsis">
              {account}
            </code>
            <Button variant="ghost" size="icon" onClick={copyAddress} className="h-9 w-9 shrink-0">
              {copied ? <Check className="w-4 h-4 text-lime-400" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 shrink-0"
            >
              <a
                href={`https://etherscan.io/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Token Balances */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Token Balances</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPrices}
              disabled={pricesLoading}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${pricesLoading ? "animate-spin" : ""}`} />
              Refresh Prices
            </Button>
          </div>
          <div className="grid gap-3 max-h-80 overflow-y-auto">
            {Object.entries(TOKENS).map(([key, token]) => {
              // Get balance - ETH from tokenBalances, others from simulated
              const balanceValue = key === "ETH" 
                ? ethBalance 
                : getSimulatedBalance(key).toFixed(4)
              // Use real prices from API
              const tokenPrice = tokenPrices[key] || 0
              const usdValue = (parseFloat(balanceValue) * tokenPrice).toFixed(2)

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                      {token.logo}
                    </div>
                    <div>
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{parseFloat(balanceValue).toFixed(4)}</div>
                    <div className="text-sm text-muted-foreground">
                      ≈ ${usdValue} 
                      <span className="text-xs ml-1 opacity-60">(${tokenPrice.toFixed(2)})</span>
                    </div>
                  </div>
                  {key !== "ETH" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addTokenToWallet(token)}
                      className="ml-2 text-lime-400 hover:text-lime-300"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-gradient-to-r from-lime-400/5 to-emerald-400/5 border border-lime-400/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Portfolio Value</span>
            <span className="text-2xl font-bold">
              ${Object.entries(TOKENS).reduce((total, [key]) => {
                const balance = key === "ETH" 
                  ? parseFloat(ethBalance) 
                  : getSimulatedBalance(key)
                const price = tokenPrices[key] || 0
                return total + (balance * price)
              }, 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-lime-400" />
            Transaction History
          </h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8 bg-secondary/30 rounded-xl">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">No transactions yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Your swap transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.hash}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === "swap"
                          ? "bg-lime-400/20"
                          : tx.type === "liquidity"
                          ? "bg-blue-400/20"
                          : "bg-purple-400/20"
                      }`}
                    >
                      {tx.type === "swap" ? (
                        <ArrowUpRight className="w-4 h-4 text-lime-400" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {tx.type === "swap"
                          ? `${tx.fromToken} → ${tx.toToken}`
                          : `Add ${tx.fromToken}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.fromAmount} {tx.fromToken}
                        {tx.toAmount && ` → ${tx.toAmount} ${tx.toToken}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-medium ${
                        tx.status === "success"
                          ? "text-emerald-400"
                          : tx.status === "pending"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.status}
                    </div>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-lime-400 flex items-center gap-1 justify-end"
                    >
                      {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="text-xs text-muted-foreground/60">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
