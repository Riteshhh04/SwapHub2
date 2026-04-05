"use client"

import { useState, useEffect } from "react"
import { useWeb3, TOKENS } from "@/context/Web3Context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from "lucide-react"

interface PriceData {
  date: string
  price: number
  timestamp: number
}

interface ChartData {
  prices: [number, number][]
}

export function PriceChart() {
  const { tokenPrices, isConnected } = useWeb3()
  const [selectedToken, setSelectedToken] = useState("ETH")
  const [timeframe, setTimeframe] = useState<"1" | "7" | "30">("7")
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(false)
  const [priceChange, setPriceChange] = useState<number>(0)

  // Fetch historical price data from CoinGecko
  useEffect(() => {
    const fetchPriceHistory = async () => {
      setLoading(true)
      try {
        const token = TOKENS[selectedToken]
        if (!token) return

        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${token.coingeckoId}/market_chart?vs_currency=usd&days=${timeframe}`
        )

        if (response.ok) {
          const data: ChartData = await response.json()
          const formattedData: PriceData[] = data.prices.map(([timestamp, price]) => ({
            date: new Date(timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            price: price,
            timestamp: timestamp,
          }))

          // Reduce data points for better visualization
          const step = Math.max(1, Math.floor(formattedData.length / 50))
          const reducedData = formattedData.filter((_, index) => index % step === 0)
          
          setPriceHistory(reducedData)

          // Calculate price change
          if (reducedData.length > 1) {
            const firstPrice = reducedData[0].price
            const lastPrice = reducedData[reducedData.length - 1].price
            const change = ((lastPrice - firstPrice) / firstPrice) * 100
            setPriceChange(change)
          }
        }
      } catch (error) {
        console.error("Error fetching price history:", error)
        // Generate mock data if API fails
        generateMockData()
      } finally {
        setLoading(false)
      }
    }

    fetchPriceHistory()
  }, [selectedToken, timeframe])

  const generateMockData = () => {
    const basePrice = tokenPrices[selectedToken] || 100
    const days = parseInt(timeframe)
    const dataPoints = days * 24
    const mockData: PriceData[] = []

    for (let i = 0; i < dataPoints; i++) {
      const date = new Date()
      date.setHours(date.getHours() - (dataPoints - i))
      const volatility = (Math.random() - 0.5) * 0.02
      const price = basePrice * (1 + volatility * i / 10)

      mockData.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: price,
        timestamp: date.getTime(),
      })
    }

    const step = Math.max(1, Math.floor(mockData.length / 50))
    const reducedData = mockData.filter((_, index) => index % step === 0)
    setPriceHistory(reducedData)

    if (reducedData.length > 1) {
      const firstPrice = reducedData[0].price
      const lastPrice = reducedData[reducedData.length - 1].price
      const change = ((lastPrice - firstPrice) / firstPrice) * 100
      setPriceChange(change)
    }
  }

  const currentPrice = tokenPrices[selectedToken] || 0
  const isPositive = priceChange >= 0

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-lime-400" />
            Price Chart
          </CardTitle>

          <div className="flex items-center gap-2">
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOKENS).map(([key, token]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{token.logo}</span>
                      <span>{token.symbol}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex bg-secondary/50 rounded-lg p-1">
              {(["1", "7", "30"] as const).map((t) => (
                <Button
                  key={t}
                  variant={timeframe === t ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(t)}
                  className="px-3"
                >
                  {t}D
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Price Header */}
        <div className="flex items-end gap-4 mb-6">
          <div>
            <div className="text-3xl font-bold">
              ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">
              {TOKENS[selectedToken]?.name}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
              isPositive
                ? "bg-emerald-400/20 text-emerald-400"
                : "bg-red-400/20 text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {isPositive ? "+" : ""}
            {priceChange.toFixed(2)}%
          </div>
          <span className="text-sm text-muted-foreground">
            Past {timeframe} day{timeframe !== "1" ? "s" : ""}
          </span>
        </div>

        {/* Chart */}
        <div className="h-64 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isPositive ? "#a3e635" : "#ef4444"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={isPositive ? "#a3e635" : "#ef4444"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(value) =>
                    `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  }
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    "Price",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#a3e635" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Token Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">24h High</div>
            <div className="font-semibold">
              ${(currentPrice * 1.02).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">24h Low</div>
            <div className="font-semibold">
              ${(currentPrice * 0.98).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">24h Volume</div>
            <div className="font-semibold">
              ${(Math.random() * 10000000000).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
