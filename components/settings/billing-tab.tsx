"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Check, ShieldAlert } from "lucide-react"

const invoices = [
  { id: "INV-2026-004", date: "Jun 15, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-003", date: "May 15, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-002", date: "Apr 15, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-001", date: "Mar 15, 2026", amount: "$49.00", status: "Paid" },
]

export function BillingTab() {
  const [activePlan, setActivePlan] = useState("Pro Plan")
  const [activeTier, setActiveTier] = useState("Gold")

  const handleUpgrade = (planName: string, tierName: string) => {
    setActivePlan(planName)
    setActiveTier(tierName)
    alert(`Success! Upgraded to ${planName} (${tierName})!`)
  }

  return (
    <div className="bg-background-card border border-border/50 rounded-2xl p-6 lg:p-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Billing & Subscription</h2>
        <p className="text-sm text-foreground-muted">Manage your subscription, billing details, and view payment invoices</p>
      </div>

      {/* Plan Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              Current Plan
            </span>
            <h3 className="text-2xl font-heading font-bold text-white pt-2">{activePlan}</h3>
            <p className="text-sm text-foreground-muted">
              Tier Level: <span className="text-warning font-semibold">{activeTier}</span>
            </p>
          </div>
          <div className="pt-6">
            <p className="text-xs text-foreground-muted">Renews on Jul 15, 2026</p>
          </div>
        </div>

        {/* Card Details */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-foreground-muted" />
            Payment Method
          </h4>
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-background border border-border/60 rounded flex items-center justify-center text-[10px] font-bold text-white">
              VISA
            </div>
            <div>
              <p className="text-sm font-medium text-white">Visa ending in 4242</p>
              <p className="text-xs text-foreground-muted">Expires 12/28</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => alert("Simulated update card payment method!")}
            className="bg-transparent border-border hover:bg-background-subtle rounded-xl text-xs h-9"
          >
            Update Card
          </Button>
        </div>
      </div>

      {/* Upgrade Tier Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Available Subscriptions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Business tier */}
          <div className="p-5 border border-border rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors">
            <div>
              <h4 className="text-sm font-bold text-white">Enterprise Tier</h4>
              <p className="text-xs text-foreground-muted">For larger businesses and custom workflows</p>
            </div>
            <Button
              onClick={() => handleUpgrade("Enterprise Plan", "Platinum")}
              disabled={activeTier === "Platinum"}
              className="bg-white text-black hover:bg-[#f5f5f5] transition-colors rounded-xl text-xs h-10 font-semibold"
            >
              {activeTier === "Platinum" ? "Current Tier" : "Upgrade - $149/mo"}
            </Button>
          </div>

          {/* Pro tier */}
          <div className="p-5 border border-border rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors">
            <div>
              <h4 className="text-sm font-bold text-white">Pro Tier (Gold)</h4>
              <p className="text-xs text-foreground-muted">Ideal for active creators and developers</p>
            </div>
            <Button
              onClick={() => handleUpgrade("Pro Plan", "Gold")}
              disabled={activeTier === "Gold"}
              className="bg-transparent border-border text-foreground hover:bg-background-subtle rounded-xl text-xs h-10 font-semibold"
            >
              {activeTier === "Gold" ? "Current Tier" : "Downgrade - $49/mo"}
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Invoice History</h3>
        <div className="border border-border/50 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-background-subtle border-b border-border/50 text-foreground-muted font-semibold">
                <th className="p-3">Invoice</th>
                <th className="p-3">Billing Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium text-white">{inv.id}</td>
                  <td className="p-3 text-foreground-muted">{inv.date}</td>
                  <td className="p-3 text-foreground-muted">{inv.amount}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
