import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  href?: string
}

const sizeMap = {
  sm: { icon: 20, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
}

export function Logo({ className, showText = true, size = "md", href = "/" }: LogoProps) {
  const sizes = sizeMap[size]
  
  const content = (
    <div className={cn("flex items-center gap-2 transition-opacity hover:opacity-80", className)}>
      <div className="relative flex-shrink-0">
        <img
          src="/icon.svg"
          alt="Genie Logo"
          width={sizes.icon}
          height={sizes.icon}
          className="dark:invert"
        />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight", sizes.text)}>
          Genie
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="group">
        {content}
      </Link>
    )
  }

  return content
}

