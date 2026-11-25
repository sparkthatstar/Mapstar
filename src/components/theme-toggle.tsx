'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`h-9 px-2.5 sm:px-3 text-xs border-[#E5DAC8] dark:border-[#382618] bg-white dark:bg-[#1A120B] text-[#5C4535] dark:text-[#C5B4A5] opacity-70 ${className}`}
        aria-label="Toggle theme"
      >
        <Moon className="h-3.5 w-3.5 text-[#78350F]" />
        <span className="hidden sm:inline ml-1.5 font-medium">Theme</span>
      </Button>
    )
  }

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`h-9 px-2.5 sm:px-3 text-xs font-semibold border-[#E5DAC8] dark:border-[#382618] bg-white hover:bg-[#F5EFEB] dark:bg-[#1A120B] dark:hover:bg-[#271A12] text-[#271810] dark:text-[#FAF6F0] shadow-xs cursor-pointer transition-all duration-200 ${className}`}
      title={isDark ? 'Switch to Warm Linen Light Theme' : 'Switch to Midnight Walnut Dark Theme'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          <span className="hidden sm:inline ml-1.5">Warm Light</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-[#78350F] transition-transform duration-300 -rotate-12 hover:rotate-0" />
          <span className="hidden sm:inline ml-1.5">Walnut Dark</span>
        </>
      )}
    </Button>
  )
}
