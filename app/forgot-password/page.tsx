import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import Link from "next/link"
import { Lock } from "lucide-react"
import { BinjAiLogo } from "@/components/ui/logo"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient gradient-primary opacity-20" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-background rounded-3xl shadow-2xl p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center mb-8">
            <BinjAiLogo className="text-3xl" />
          </Link>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-2">Reset your password</h1>
            <p className="text-foreground-muted">Enter your email and we'll send a reset link</p>
          </div>

          <ForgotPasswordForm />

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link href="/sign-in" className="text-sm text-primary hover:underline font-medium">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
