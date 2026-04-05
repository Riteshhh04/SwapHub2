"use client"

import { useState } from "react"
import { useWeb3, TOKENS, parseEther } from "@/context/Web3Context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Coins, Loader2, CheckCircle2, AlertCircle, Sparkles, Wallet } from "lucide-react"

export function AddLiquidity() {
  const { isConnected, signer, mintTokens, getSimulatedBalance, refreshBalances, tokensDeployed } = useWeb3()
  const [selectedToken, setSelectedToken] = useState("USDC")
  const [amount, setAmount] = useState("1000")
  const [status, setStatus] = useState<"idle" | "minting" | "success" | "error">("idle")
  const [txHash, setTxHash] = useState("")
  const [error, setError] = useState("")

  const availableTokens = Object.entries(TOKENS).filter(([key]) => key !== "ETH")

  const handleMint = async () => {
    if (!signer) return

    const mintAmount = parseFloat(amount)
    if (isNaN(mintAmount) || mintAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setStatus("minting")
    setError("")
    setTxHash("")

    try {
      // Small ETH transaction to trigger MetaMask confirmation
      const tx = await signer.sendTransaction({
        to: "0x000000000000000000000000000000000000dEaD",
        value: parseEther("0.0001"),
        gasLimit: 21000n,
      })

      setTxHash(tx.hash)
      await tx.wait()

      // Add tokens to simulated balance
      mintTokens(selectedToken, mintAmount)
      
      setStatus("success")
      await refreshBalances()

      setTimeout(() => {
        setStatus("idle")
      }, 3000)
    } catch (err) {
      console.error("Mint error:", err)
      setStatus("error")
      setError((err as Error).message || "Transaction failed")
      setTimeout(() => setStatus("idle"), 5000)
    }
  }

  const currentBalance = getSimulatedBalance(selectedToken)

  if (!isConnected) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Connect your wallet to get tokens</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tokensDeployed) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
            <p className="text-foreground font-medium mb-2">Deploy Tokens First</p>
            <p className="text-muted-foreground text-sm">
              Go to the Deploy tab and deploy tokens before using the faucet.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-lime-400" />
          <CardTitle>Get Test Tokens (Faucet)</CardTitle>
        </div>
        <CardDescription>
          Get free test tokens to use for swapping. MetaMask will confirm a small gas fee.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Selection */}
        <div className="space-y-2">
          <Label>Select Token to Receive</Label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTokens.map(([key, token]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{token.logo}</span>
                    <span>{token.symbol}</span>
                    <span className="text-muted-foreground">- {token.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Amount to Receive</Label>
            <span className="text-sm text-muted-foreground">
              Current Balance: {currentBalance.toFixed(2)} {selectedToken}
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border pr-20"
              placeholder="1000"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {selectedToken}
            </span>
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2">
            {["100", "1000", "10000"].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => setAmount(preset)}
                className="flex-1"
              >
                {Number(preset).toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={status === "minting" || !amount}
          className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-black hover:from-lime-500 hover:to-emerald-600"
        >
          {status === "minting" ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Getting Tokens...
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Tokens Received!
            </>
          ) : (
            <>
              <Coins className="w-5 h-5 mr-2" />
              Get {amount} {selectedToken}
            </>
          )}
        </Button>

        {/* Status Messages */}
        {txHash && status === "success" && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium">Success!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {amount} {selectedToken} added to your balance
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
          <Wallet className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select a token and amount</li>
              <li>MetaMask confirms a small gas fee (0.0001 ETH)</li>
              <li>Tokens are added to your balance instantly</li>
              <li>Use these tokens to swap on the Swap tab</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
