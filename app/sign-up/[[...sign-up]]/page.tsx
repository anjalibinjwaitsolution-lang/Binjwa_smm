import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import { BinjAiLogo } from "@/components/ui/logo"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient gradient-primary opacity-20" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <BinjAiLogo className="text-3xl" />
        </Link>
        <SignUp />
        <div className="mt-6 text-center">
          <p className="text-xs text-foreground-muted">
            Admin or Role-Based User?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Unified Portal Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
