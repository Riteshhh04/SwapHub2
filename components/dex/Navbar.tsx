"use client"

import { useWeb3 } from "@/context/Web3Context"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, RefreshCw, Coins } from "lucide-react"

export function Navbar() {
  const { 
    account, 
    isConnected, 
    isConnecting, 
    ethBalance, 
    chainId,
    connectWallet, 
    disconnectWallet,
    switchToHardhat,
    refreshBalances
  } = useWeb3()

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1:
        return "Ethereum"
      case 11155111:
        return "Sepolia"
      case 31337:
        return "Hardhat"
      default:
        return "Unknown"
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
              <Coins className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
              SwapHub
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#swap" className="text-sm font-medium text-foreground hover:text-lime-400 transition-colors">
              Swap
            </a>
            <a href="#liquidity" className="text-sm font-medium text-muted-foreground hover:text-lime-400 transition-colors">
              Add Tokens
            </a>
            <a href="#account" className="text-sm font-medium text-muted-foreground hover:text-lime-400 transition-colors">
              Account
            </a>
          </nav>

          {/* Wallet Section */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                {/* Network Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${chainId === 31337 ? "bg-lime-400" : "bg-yellow-400"}`} />
                  <span className="text-xs font-medium">{getNetworkName(chainId)}</span>
                </div>

                {/* Balance */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
                  <span className="text-xs font-medium">{parseFloat(ethBalance).toFixed(4)} ETH</span>
                </div>

                {/* Address & Actions */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-lime-400/10 to-emerald-400/10 border border-lime-400/20 rounded-lg">
                  <Wallet className="w-4 h-4 text-lime-400" />
                  <span className="text-sm font-medium">{formatAddress(account!)}</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshBalances}
                  className="h-9 w-9"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>

                {chainId !== 31337 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchToHardhat}
                    className="text-xs"
                  >
                    Switch to Hardhat
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={disconnectWallet}
                  className="h-9 w-9 text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-semibold hover:from-lime-500 hover:to-emerald-600"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
