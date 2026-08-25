"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BinjAiLogo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { ShieldAlert, UserCheck, Sparkles, ArrowRight, Lock } from "lucide-react"

export default function UnifiedLoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"USER" | "ADMIN" | "SUPER_ADMIN">("USER")

  const handleRoleLogin = (role: "USER" | "ADMIN" | "SUPER_ADMIN") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("role", role)
    }
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient gradient-primary opacity-20" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        <Link href="/" className="flex items-center justify-center mb-8">
          <BinjAiLogo className="text-3xl" />
        </Link>

        <div className="w-full rounded-3xl bg-card border border-border/60 shadow-2xl p-8 backdrop-blur-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-foreground-muted">
              Choose your authentication method to access Binjwa SSM
            </p>
          </div>

          {/* Option 1: Clerk Authentication (Default Creator Login) */}
          <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Creator & Business Login</h3>
                <p className="text-xs text-foreground-muted">Standard account via email / social</p>
              </div>
            </div>
            <Button
              className="w-full btn-gradient rounded-xl font-semibold mt-2"
              onClick={() => router.push("/sign-in")}
            >
              Sign In with Clerk
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Option 2: Role-Based Admin Portal */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Role-Based Access (Demo / Admin)</h3>
                <p className="text-xs text-foreground-muted">Switch hierarchy privileges</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedRole("USER")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  selectedRole === "USER"
                    ? "bg-primary text-white border-primary"
                    : "bg-white/5 text-foreground-muted border-border hover:border-white/30"
                }`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("ADMIN")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  selectedRole === "ADMIN"
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white/5 text-foreground-muted border-border hover:border-white/30"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("SUPER_ADMIN")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  selectedRole === "SUPER_ADMIN"
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white/5 text-foreground-muted border-border hover:border-white/30"
                }`}
              >
                Super Admin
              </button>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl border-white/20 hover:bg-white/10 text-white"
              onClick={() => handleRoleLogin(selectedRole)}
            >
              <Lock className="w-4 h-4 mr-2 text-foreground-muted" />
              Enter as {selectedRole.replace("_", " ")}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-foreground-muted">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-primary hover:underline font-medium">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
