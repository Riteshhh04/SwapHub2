"use client"

import { useState } from "react"
import { useWeb3, TOKENS, parseEther } from "@/context/Web3Context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Rocket, CheckCircle, Loader2, Coins, AlertCircle } from "lucide-react"

export function DeployContracts() {
  const { isConnected, signer, mintTokens, refreshBalances, tokensDeployed, setTokensDeployed } = useWeb3()
  const [deployStatus, setDeployStatus] = useState<Record<string, "idle" | "deploying" | "deployed" | "error">>({})
  const [mintAmounts, setMintAmounts] = useState<Record<string, string>>({
    USDC: "10000",
    DAI: "10000",
    WETH: "5",
    LINK: "500",
    UNI: "1000",
    AAVE: "100",
    MATIC: "5000",
  })
  const [txHash, setTxHash] = useState("")
  const [isDeployingAll, setIsDeployingAll] = useState(false)

  const tokens = Object.entries(TOKENS)
    .filter(([key]) => key !== "ETH")
    .map(([key, token]) => ({
      symbol: key,
      name: token.name,
      logo: token.logo,
      deployed: deployStatus[key] === "deployed" || tokensDeployed,
      initialMint: parseFloat(mintAmounts[key] || "10000"),
    }))

  const deployToken = async (tokenSymbol: string) => {
    if (!signer) return

    setDeployStatus(prev => ({ ...prev, [tokenSymbol]: "deploying" }))

    try {
      const tx = await signer.sendTransaction({
        to: "0x000000000000000000000000000000000000dEaD",
        value: parseEther("0.001"),
        gasLimit: 21000n,
      })
      
      setTxHash(tx.hash)
      await tx.wait()

      const amount = parseFloat(mintAmounts[tokenSymbol] || "10000")
      mintTokens(tokenSymbol, amount)

      setDeployStatus(prev => ({ ...prev, [tokenSymbol]: "deployed" }))
      await refreshBalances()
    } catch (error) {
      console.error(`Error deploying ${tokenSymbol}:`, error)
      setDeployStatus(prev => ({ ...prev, [tokenSymbol]: "error" }))
    }
  }

  const deployAllTokens = async () => {
    if (!signer) return

    setIsDeployingAll(true)

    try {
      const tx = await signer.sendTransaction({
        to: "0x000000000000000000000000000000000000dEaD",
        value: parseEther("0.01"),
        gasLimit: 21000n,
      })
      
      setTxHash(tx.hash)
      await tx.wait()

      for (const token of tokens) {
        mintTokens(token.symbol, token.initialMint)
        setDeployStatus(prev => ({ ...prev, [token.symbol]: "deployed" }))
      }

      setTokensDeployed(true)
      await refreshBalances()
    } catch (error) {
      console.error("Error deploying all tokens:", error)
    } finally {
      setIsDeployingAll(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Connect your wallet to deploy tokens</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-lime-400" />
          <CardTitle>Deploy Test Tokens</CardTitle>
        </div>
        <CardDescription>
          Deploy ERC20 tokens to your wallet. MetaMask will confirm each deployment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deploy All Button */}
        <div className="bg-gradient-to-r from-lime-400/10 to-emerald-400/10 border border-lime-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-lime-400" />
                Quick Deploy All Tokens
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Deploy all tokens with one transaction (0.01 ETH)
              </p>
            </div>
            <Button
              onClick={deployAllTokens}
              disabled={isDeployingAll || tokensDeployed}
              className="bg-gradient-to-r from-lime-400 to-emerald-400 text-black hover:from-lime-500 hover:to-emerald-500"
            >
              {isDeployingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : tokensDeployed ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  All Deployed
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Individual Token Deploy */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Or deploy individually:</h3>
          {tokens.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl">
                  {token.logo}
                </div>
                <div>
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-sm text-muted-foreground">{token.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Initial Amount</div>
                  <Input
                    type="number"
                    value={mintAmounts[token.symbol]}
                    onChange={(e) =>
                      setMintAmounts((prev) => ({ ...prev, [token.symbol]: e.target.value }))
                    }
                    className="w-24 h-8 text-right bg-background"
                    disabled={token.deployed}
                  />
                </div>

                <Button
                  onClick={() => deployToken(token.symbol)}
                  disabled={deployStatus[token.symbol] === "deploying" || token.deployed}
                  variant={token.deployed ? "outline" : "default"}
                  size="sm"
                  className={
                    token.deployed
                      ? "border-lime-400/50 text-lime-400"
                      : "bg-gradient-to-r from-lime-400 to-emerald-400 text-black hover:from-lime-500 hover:to-emerald-500"
                  }
                >
                  {deployStatus[token.symbol] === "deploying" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : token.deployed ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Done
                    </>
                  ) : (
                    "Deploy"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {txHash && (
          <div className="p-3 rounded-lg bg-lime-400/10 border border-lime-400/30">
            <div className="text-sm">
              <span className="text-muted-foreground">Last TX: </span>
              <code className="text-lime-400 text-xs break-all">{txHash}</code>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>MetaMask confirms a small ETH transaction</li>
              <li>Tokens are added to your balance after confirmation</li>
              <li>You can then swap these tokens for other tokens</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
