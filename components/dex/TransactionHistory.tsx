"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/context/Web3Context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react"

interface Transaction {
  hash: string
  type: "swap" | "liquidity" | "transfer"
  fromToken: string
  toToken?: string
  amount: string
  timestamp: number
  status: "pending" | "success" | "failed"
}

export function TransactionHistory() {
  const { isConnected, account } = useWeb3()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // Load transactions from localStorage
  useEffect(() => {
    if (account) {
      const saved = localStorage.getItem(`tx_${account}`)
      if (saved) {
        setTransactions(JSON.parse(saved))
      }
    }
  }, [account])

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  if (!isConnected) {
    return null
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl mt-8">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-lime-400" />
            Recent Transactions
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setLoading(!loading)}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Your swap and liquidity transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "swap"
                        ? "bg-lime-400/20"
                        : tx.type === "liquidity"
                        ? "bg-blue-400/20"
                        : "bg-purple-400/20"
                    }`}
                  >
                    {tx.type === "swap" ? (
                      <ArrowUpRight className="w-5 h-5 text-lime-400" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {tx.type === "swap"
                        ? `Swap ${tx.fromToken} → ${tx.toToken}`
                        : `Add ${tx.fromToken}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tx.amount} {tx.fromToken}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${
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
                    className="text-xs text-muted-foreground hover:text-lime-400 flex items-center gap-1"
                  >
                    {formatHash(tx.hash)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
