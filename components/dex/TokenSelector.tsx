"use client"

import { useState } from "react"
import { TOKENS, useWeb3 } from "@/context/Web3Context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, Plus } from "lucide-react"

interface TokenSelectorProps {
  selectedToken: string
  onSelect: (token: string) => void
  excludeToken?: string
}

export function TokenSelector({ selectedToken, onSelect, excludeToken }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { ethBalance, getSimulatedBalance, addTokenToWallet } = useWeb3()

  const token = TOKENS[selectedToken as keyof typeof TOKENS]

  const filteredTokens = Object.entries(TOKENS).filter(
    ([key, t]) =>
      key !== excludeToken &&
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.symbol.toLowerCase().includes(search.toLowerCase()))
  )

  const getBalance = (symbol: string) => {
    if (symbol === "ETH") {
      return parseFloat(ethBalance).toFixed(4)
    }
    return getSimulatedBalance(symbol).toFixed(4)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 px-3 bg-secondary/50 hover:bg-secondary rounded-xl gap-2"
        >
          <span className="text-xl">{token?.logo}</span>
          <span className="font-semibold">{selectedToken}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Select a Token</DialogTitle>
          <DialogDescription>
            Choose a token from the list below to use for your transaction.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or symbol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        <div className="mt-4 space-y-1 max-h-80 overflow-y-auto">
          {filteredTokens.map(([key, t]) => (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelect(key)
                  setOpen(false)
                }
              }}
              onClick={() => {
                onSelect(key)
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                selectedToken === key
                  ? "bg-lime-400/10 border border-lime-400/30"
                  : "hover:bg-secondary"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                  {t.logo}
                </div>
                <div className="text-left">
                  <div className="font-semibold">{t.symbol}</div>
                  <div className="text-sm text-muted-foreground">{t.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{getBalance(t.symbol)}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addTokenToWallet(t)
                  }}
                  className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add to Wallet
                </button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
