"use client"

import { useState, useEffect, useMemo } from "react"
import { useWeb3, TOKENS, type Transaction } from "@/context/Web3Context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts"
import {
  PieChartIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  Clock,
  DollarSign,
} from "lucide-react"

interface PortfolioData {
  symbol: string
  name: string
  balance: number
  value: number
  percentage: number
  color: string
}

interface PnLData {
  date: string
  value: number
  change: number
}

const CHART_COLORS = [
  "#a3e635", // lime-400
  "#22d3ee", // cyan-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
  "#fb923c", // orange-400
  "#4ade80", // green-400
  "#60a5fa", // blue-400
  "#fbbf24", // amber-400
]

export function WalletAnalytics() {
  const {
    isConnected,
    account,
    ethBalance,
    getSimulatedBalance,
    tokenPrices,
    transactions,
  } = useWeb3()

  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("7d")

  // Calculate portfolio distribution
  const portfolioData = useMemo((): PortfolioData[] => {
    const data: PortfolioData[] = []

    Object.entries(TOKENS).forEach(([symbol, token], index) => {
      const balance =
        symbol === "ETH" ? parseFloat(ethBalance) : getSimulatedBalance(symbol)
      const price = tokenPrices[symbol] || 0
      const value = balance * price

      if (balance > 0) {
        data.push({
          symbol,
          name: token.name,
          balance,
          value,
          percentage: 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        })
      }
    })

    const totalValue = data.reduce((sum, d) => sum + d.value, 0)
    data.forEach((d) => {
      d.percentage = totalValue > 0 ? (d.value / totalValue) * 100 : 0
    })

    return data.sort((a, b) => b.value - a.value)
  }, [ethBalance, getSimulatedBalance, tokenPrices])

  const totalPortfolioValue = useMemo(() => {
    return portfolioData.reduce((sum, d) => sum + d.value, 0)
  }, [portfolioData])

  // Calculate PnL from transaction history
  const pnlData = useMemo((): PnLData[] => {
    const data: PnLData[] = []
    const days = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 90

    // Generate historical portfolio values (simulated based on current value)
    const baseValue = totalPortfolioValue * 0.85
    const dailyVolatility = 0.03

    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      // Simulate growth with some volatility
      const growthFactor = 1 + (days - i) * 0.005
      const volatility = (Math.random() - 0.5) * dailyVolatility
      const value = baseValue * growthFactor * (1 + volatility)

      data.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value,
        change: i === days ? 0 : ((value - data[data.length - 1]?.value) / data[data.length - 1]?.value) * 100 || 0,
      })
    }

    return data
  }, [totalPortfolioValue, timeframe])

  // Calculate total PnL
  const totalPnL = useMemo(() => {
    if (pnlData.length < 2) return { value: 0, percentage: 0 }
    const startValue = pnlData[0].value
    const endValue = pnlData[pnlData.length - 1].value
    return {
      value: endValue - startValue,
      percentage: ((endValue - startValue) / startValue) * 100,
    }
  }, [pnlData])

  // Transaction statistics
  const txStats = useMemo(() => {
    const filteredTx = transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp)
      const daysAgo = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 365
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - daysAgo)
      return txDate >= cutoff
    })

    const totalSwaps = filteredTx.filter((tx) => tx.type === "swap").length
    const successfulSwaps = filteredTx.filter(
      (tx) => tx.type === "swap" && tx.status === "success"
    ).length

    // Calculate total volume
    let totalVolume = 0
    filteredTx.forEach((tx) => {
      if (tx.type === "swap" && tx.status === "success") {
        const fromPrice = tokenPrices[tx.fromToken] || 0
        const amount = parseFloat(tx.fromAmount) || 0
        totalVolume += amount * fromPrice
      }
    })

    return {
      totalSwaps,
      successfulSwaps,
      successRate: totalSwaps > 0 ? (successfulSwaps / totalSwaps) * 100 : 0,
      totalVolume,
    }
  }, [transactions, timeframe, tokenPrices])

  if (!isConnected) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-12 text-center">
          <Wallet className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Connect your wallet to view portfolio analytics and performance tracking.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isPnLPositive = totalPnL.value >= 0

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-400/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Value</div>
                <div className="text-xl font-bold">
                  ${totalPortfolioValue.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPnLPositive ? "bg-emerald-400/20" : "bg-red-400/20"
                }`}
              >
                {isPnLPositive ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">PnL ({timeframe})</div>
                <div
                  className={`text-xl font-bold ${
                    isPnLPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPnLPositive ? "+" : ""}
                  {totalPnL.percentage.toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-400/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Swaps</div>
                <div className="text-xl font-bold">{txStats.totalSwaps}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-400/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Volume Traded</div>
                <div className="text-xl font-bold">
                  ${txStats.totalVolume.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-end">
        <div className="flex bg-secondary/50 rounded-lg p-1">
          {(["7d", "30d", "all"] as const).map((t) => (
            <Button
              key={t}
              variant={timeframe === t ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(t)}
              className="px-4"
            >
              {t === "all" ? "All Time" : t.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance Chart */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-lime-400" />
              Portfolio Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pnlData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={isPnLPositive ? "#a3e635" : "#ef4444"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={isPnLPositive ? "#a3e635" : "#ef4444"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}`,
                      "Value",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isPnLPositive ? "#a3e635" : "#ef4444"}
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Distribution */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-lime-400" />
              Asset Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No assets in portfolio
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="h-48 w-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string, props) => [
                          `$${value.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}`,
                          props.payload.symbol,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {portfolioData.slice(0, 5).map((asset) => (
                    <div
                      key={asset.symbol}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: asset.color }}
                        />
                        <span className="font-medium">{asset.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${asset.value.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {asset.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Asset Performance Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Asset Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolioData.map((asset) => {
              // Simulate 24h change
              const change24h = (Math.random() - 0.5) * 10
              const isUp = change24h >= 0

              return (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${asset.color}20` }}
                    >
                      {TOKENS[asset.symbol]?.logo}
                    </div>
                    <div>
                      <div className="font-semibold">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {asset.balance.toFixed(4)} tokens
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Price</div>
                    <div className="font-medium">
                      ${(tokenPrices[asset.symbol] || 0).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">24h Change</div>
                    <div
                      className={`font-medium flex items-center gap-1 ${
                        isUp ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {isUp ? "+" : ""}
                      {change24h.toFixed(2)}%
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Value</div>
                    <div className="font-semibold">
                      ${asset.value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              )
            })}

            {portfolioData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No assets in your portfolio. Get some tokens from the faucet!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
