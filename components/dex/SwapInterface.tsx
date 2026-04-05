"use client"

import { useState, useEffect } from "react"
import { useWeb3, TOKENS, parseEther, type Transaction } from "@/context/Web3Context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TokenSelector } from "./TokenSelector"
import { ArrowDownUp, Settings, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"

type SwapStatus = "idle" | "swapping" | "success" | "error"

export function SwapInterface() {
  const { 
    isConnected, 
    signer, 
    ethBalance,
    getSimulatedBalance, 
    updateSimulatedBalance,
    mintTokens,
    refreshBalances, 
    tokensDeployed,
    tokenPrices,
    getExchangeRate,
    refreshPrices,
    pricesLoading,
    addTransaction,
    updateTransactionStatus,
  } = useWeb3()
  
  const [fromToken, setFromToken] = useState("ETH")
  const [toToken, setToToken] = useState("USDC")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [status, setStatus] = useState<SwapStatus>("idle")
  const [txHash, setTxHash] = useState("")
  const [error, setError] = useState("")

  // Calculate exchange rate using real prices
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const rate = getExchangeRate(fromToken, toToken)
      const calculated = parseFloat(fromAmount) * rate
      setToAmount(calculated.toFixed(6))
    } else {
      setToAmount("")
    }
  }, [fromAmount, fromToken, toToken, getExchangeRate])

  const switchTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
  }

  const getBalance = (symbol: string) => {
    if (symbol === "ETH") {
      return parseFloat(ethBalance).toFixed(4)
    }
    return getSimulatedBalance(symbol).toFixed(4)
  }

  const handleSwap = async () => {
    if (!signer) return

    const fromAmountNum = parseFloat(fromAmount)
    const toAmountNum = parseFloat(toAmount)

    if (isNaN(fromAmountNum) || fromAmountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    // Check balance
    const currentFromBalance = fromToken === "ETH" 
      ? parseFloat(ethBalance) 
      : getSimulatedBalance(fromToken)
    
    if (fromAmountNum > currentFromBalance) {
      setError(`Insufficient ${fromToken} balance`)
      return
    }

    setStatus("swapping")
    setError("")
    setTxHash("")

    try {
      // Pool address for receiving tokens
      const poolAddress = "0x000000000000000000000000000000000000dEaD"
      let txHashResult = ""
      
      if (fromToken === "ETH") {
        // ETH -> Token swap
        // Send actual ETH (this deducts from your wallet)
        const tx = await signer.sendTransaction({
          to: poolAddress,
          value: parseEther(fromAmount),
          gasLimit: 21000n,
        })
        txHashResult = tx.hash
        setTxHash(tx.hash)
        
        // Add pending transaction
        const pendingTx: Transaction = {
          hash: tx.hash,
          type: "swap",
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          timestamp: Date.now(),
          status: "pending",
        }
        addTransaction(pendingTx)
        
        await tx.wait()
        
        // Add received tokens to simulated balance
        mintTokens(toToken, toAmountNum)
        
      } else if (toToken === "ETH") {
        // Token -> ETH swap
        // Deduct tokens from simulated balance
        const newFromBalance = getSimulatedBalance(fromToken) - fromAmountNum
        updateSimulatedBalance(fromToken, newFromBalance)
        
        // Send small ETH for gas confirmation (simulates receiving ETH)
        const tx = await signer.sendTransaction({
          to: poolAddress,
          value: parseEther("0.0001"),
          gasLimit: 21000n,
        })
        txHashResult = tx.hash
        setTxHash(tx.hash)
        
        // Add pending transaction
        const pendingTx: Transaction = {
          hash: tx.hash,
          type: "swap",
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          timestamp: Date.now(),
          status: "pending",
        }
        addTransaction(pendingTx)
        
        await tx.wait()
        
        // Note: In demo mode, ETH balance won't increase since we can't mint real ETH
        // But the token balance will decrease
        
      } else {
        // Token -> Token swap
        // Deduct "from" tokens
        const newFromBalance = getSimulatedBalance(fromToken) - fromAmountNum
        updateSimulatedBalance(fromToken, newFromBalance)
        
        // Small ETH transaction for MetaMask confirmation
        const tx = await signer.sendTransaction({
          to: poolAddress,
          value: parseEther("0.0001"),
          gasLimit: 21000n,
        })
        txHashResult = tx.hash
        setTxHash(tx.hash)
        
        // Add pending transaction
        const pendingTx: Transaction = {
          hash: tx.hash,
          type: "swap",
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          timestamp: Date.now(),
          status: "pending",
        }
        addTransaction(pendingTx)
        
        await tx.wait()
        
        // Add "to" tokens
        mintTokens(toToken, toAmountNum)
      }

      // Update transaction status to success
      updateTransactionStatus(txHashResult, "success")
      setStatus("success")
      await refreshBalances()
      
      setTimeout(() => {
        setStatus("idle")
        setFromAmount("")
        setToAmount("")
      }, 3000)
    } catch (err: unknown) {
      console.error("Swap error:", err)
      setStatus("error")
      setError((err as Error).message || "Transaction failed")
      if (txHash) {
        updateTransactionStatus(txHash, "failed")
      }
      setTimeout(() => setStatus("idle"), 5000)
    }
  }

  const isValidAmount = fromAmount && parseFloat(fromAmount) > 0
  const currentFromBalance = fromToken === "ETH" 
    ? parseFloat(ethBalance) 
    : getSimulatedBalance(fromToken)
  const hasBalance = currentFromBalance >= parseFloat(fromAmount || "0")
  
  // For non-ETH tokens, check if tokens are deployed
  const needsTokenDeploy = fromToken !== "ETH" && !tokensDeployed
  const canSwap = isConnected && isValidAmount && hasBalance && status === "idle" && !needsTokenDeploy

  return (
    <Card className="w-full max-w-md mx-auto bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl" id="swap">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Swap</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>You pay</span>
            <span>Balance: {getBalance(fromToken)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0"
            />
            <TokenSelector
              selectedToken={fromToken}
              onSelect={setFromToken}
              excludeToken={toToken}
            />
          </div>
          {isValidAmount && (
            <div className="text-sm text-muted-foreground">
              ≈ ${(parseFloat(fromAmount) * (tokenPrices[fromToken] || 0)).toFixed(2)}
            </div>
          )}
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={switchTokens}
            className="h-10 w-10 rounded-xl bg-card border-border hover:bg-lime-400/10 hover:border-lime-400/50 transition-all"
          >
            <ArrowDownUp className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="bg-secondary/50 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>You receive</span>
            <span>Balance: {getBalance(toToken)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0"
            />
            <TokenSelector
              selectedToken={toToken}
              onSelect={setToToken}
              excludeToken={fromToken}
            />
          </div>
        </div>

        {/* Exchange Rate with refresh button */}
        {isValidAmount && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <span>1 {fromToken} = {getExchangeRate(fromToken, toToken).toFixed(6)} {toToken}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshPrices}
              disabled={pricesLoading}
              className="h-6 w-6"
            >
              <RefreshCw className={`w-3 h-3 ${pricesLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        )}

        {/* Warning for non-deployed tokens */}
        {needsTokenDeploy && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Deploy tokens first in the Deploy tab to swap {fromToken}</span>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {status !== "idle" && (
          <div
            className={`p-4 rounded-xl ${
              status === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : status === "error"
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-lime-400/10 border border-lime-400/30"
            }`}
          >
            <div className="flex items-center gap-3">
              {status === "swapping" && (
                <Loader2 className="w-5 h-5 animate-spin text-lime-400" />
              )}
              {status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              <div className="flex-1">
                <div className="font-medium">
                  {status === "swapping" && "Swapping tokens..."}
                  {status === "success" && `Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}!`}
                  {status === "error" && "Swap failed"}
                </div>
                {txHash && (
                  <div className="text-sm text-lime-400 mt-1">
                    TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </div>
                )}
                {error && <div className="text-sm text-red-400 mt-1">{error}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!canSwap}
          className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-black hover:from-lime-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isConnected
            ? "Connect Wallet"
            : needsTokenDeploy
            ? "Deploy tokens first"
            : !isValidAmount
            ? "Enter an amount"
            : !hasBalance
            ? "Insufficient balance"
            : status === "swapping"
            ? "Swapping..."
            : "Swap"}
        </Button>

        {/* Info text */}
        <p className="text-xs text-muted-foreground text-center">
          {fromToken === "ETH" 
            ? "ETH will be sent from your wallet. Tokens will be added to your balance."
            : toToken === "ETH"
            ? "Tokens will be deducted from your balance."
            : "Tokens will be swapped in your balance."}
        </p>
      </CardContent>
    </Card>
  )
}
