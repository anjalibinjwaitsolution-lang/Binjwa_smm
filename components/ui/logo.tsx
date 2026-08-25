import React from "react"
import Image from "next/image"

interface BinjAiLogoProps {
  className?: string
}

export function BinjAiLogo({ className = "" }: BinjAiLogoProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Image 
        src="/binjwa-logo.png" 
        alt="Binjwa IT Solutions"
        width={250}
        height={83}
        className="object-contain w-auto h-8 sm:h-10 md:h-12"
        priority
      />
    </div>
  )
}
