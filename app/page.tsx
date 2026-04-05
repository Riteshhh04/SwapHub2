"use client"

import { useState } from "react"
import { Navbar } from "@/components/dex/Navbar"
import { SwapInterface } from "@/components/dex/SwapInterface"
import { AddLiquidity } from "@/components/dex/AddLiquidity"
import { Account } from "@/components/dex/Account"
import { DeployContracts } from "@/components/dex/DeployContracts"
import { PriceChart } from "@/components/dex/PriceChart"
import { WalletAnalytics } from "@/components/dex/WalletAnalytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftRight, Wallet, Rocket, Coins, BarChart3, PieChart } from "lucide-react"

export default function Home() {
  const [activeTab, setActiveTab] = useState("swap")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/20">

      {/* Background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-lime-400/10 rounded-full blur-[150px]" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[150px]" />

      <Navbar />

      <main className="container mx-auto px-4 py-8 relative z-10">

        {/* HERO SECTION */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-400/10 border border-lime-400/20 rounded-full mb-6">
            <Coins className="w-4 h-4 text-lime-400" />
            <span className="text-sm font-medium text-lime-400">
              Next-Gen Decentralized Exchange
            </span>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-lime-200 to-emerald-300 bg-clip-text text-transparent">
            SwapHub
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            SwapHub is a secure, fast, and user-friendly decentralized exchange (DEX)
            that allows you to trade cryptocurrencies directly from your wallet without
            relying on intermediaries. Experience seamless token swaps, full ownership,
            and complete transparency powered by blockchain technology.
          </p>
        </div>

        {/* MAIN DEX */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-6 mb-10 bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="swap" className="rounded-lg text-xs sm:text-sm">
              <ArrowLeftRight className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Swap</span>
            </TabsTrigger>

            <TabsTrigger value="charts" className="rounded-lg text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>

            <TabsTrigger value="analytics" className="rounded-lg text-xs sm:text-sm">
              <PieChart className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>

            <TabsTrigger value="tokens" className="rounded-lg text-xs sm:text-sm">
              <Coins className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Tokens</span>
            </TabsTrigger>

            <TabsTrigger value="account" className="rounded-lg text-xs sm:text-sm">
              <Wallet className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>

            <TabsTrigger value="deploy" className="rounded-lg text-xs sm:text-sm">
              <Rocket className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Deploy</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swap">
            <SwapInterface />
          </TabsContent>

          <TabsContent value="charts">
            <PriceChart />
          </TabsContent>

          <TabsContent value="analytics">
            <WalletAnalytics />
          </TabsContent>

          <TabsContent value="tokens">
            <AddLiquidity />
          </TabsContent>

          <TabsContent value="account">
            <Account />
          </TabsContent>

          <TabsContent value="deploy">
            <DeployContracts />
          </TabsContent>
        </Tabs>

        {/* ABOUT BLOCKCHAIN */}
        <section className="mt-20 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">About Blockchain & Tokens</h2>
          <p className="text-muted-foreground leading-relaxed">
            Blockchain technology ensures that all transactions on SwapHub are transparent,
            immutable, and secure. Every trade is executed through smart contracts, eliminating
            the need for centralized authorities. Tokens such as ETH, USDC, and DAI operate on
            decentralized networks, giving users full control over their assets while enabling
            instant peer-to-peer transactions.
          </p>
        </section>

        {/* FEATURES */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-10">
            Why Choose SwapHub?
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-card/50 p-6 rounded-xl border border-border/50 text-center">
              ⚡
              <h3 className="font-semibold mt-3">Fast Transactions</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Lightning-fast swaps powered by optimized smart contracts.
              </p>
            </div>

            <div className="bg-card/50 p-6 rounded-xl border border-border/50 text-center">
              🔒
              <h3 className="font-semibold mt-3">Secure</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Fully decentralized with no custody of your funds.
              </p>
            </div>

            <div className="bg-card/50 p-6 rounded-xl border border-border/50 text-center">
              🌍
              <h3 className="font-semibold mt-3">No Limits</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Trade anytime, anywhere without restrictions.
              </p>
            </div>

            <div className="bg-card/50 p-6 rounded-xl border border-border/50 text-center">
              💰
              <h3 className="font-semibold mt-3">Best Rates</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Efficient pricing using automated liquidity pools.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">
            How SwapHub Works
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card/50 p-5 rounded-xl border border-border/50">
              <h3 className="font-semibold">1. Connect Wallet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Connect your MetaMask wallet securely with one click.
              </p>
            </div>

            <div className="bg-card/50 p-5 rounded-xl border border-border/50">
              <h3 className="font-semibold">2. Select Tokens</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Choose tokens you want to swap instantly.
              </p>
            </div>

            <div className="bg-card/50 p-5 rounded-xl border border-border/50">
              <h3 className="font-semibold">3. Confirm Transaction</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Approve transaction through your wallet.
              </p>
            </div>

            <div className="bg-card/50 p-5 rounded-xl border border-border/50">
              <h3 className="font-semibold">4. Receive Tokens</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Tokens are instantly transferred to your wallet.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-20 text-center text-sm text-muted-foreground">
          <p>© 2026 SwapHub. All rights reserved.</p>
          <p className="mt-1">A modern decentralized exchange built for seamless crypto trading.</p>
        </footer>
      </main>
    </div>
  )
}
