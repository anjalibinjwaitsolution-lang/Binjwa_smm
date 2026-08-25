"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"

export function ForgotPasswordForm() {
  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <Input id="email" type="email" placeholder="you@example.com" className="h-14 pl-12 rounded-xl" />
        </div>
      </div>

      <Button type="submit" className="w-full h-14 rounded-xl btn-gradient text-lg">
        Send Reset Link
      </Button>
    </form>
  )
}
