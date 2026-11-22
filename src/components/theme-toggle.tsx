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
        className={`h-9 px-2.5 sm:px-3 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070A12] text-slate-700 dark:text-slate-300 opacity-70 ${className}`}
        aria-label="Toggle theme"
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline ml-1.5 font-medium">Theme</span>
      </Button>
    )
  }

  const isDark = (theme === 'system' ? resolvedTheme : theme) !== 'light'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`h-9 px-2.5 sm:px-3 text-xs font-semibold border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-[#070A12] dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer transition-all duration-200 ${className}`}
      title={isDark ? 'Switch to Bright Light Theme' : 'Switch to Midnight Dark Theme'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          <span className="hidden sm:inline ml-1.5">Bright</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-blue-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
          <span className="hidden sm:inline ml-1.5">Dark</span>
        </>
      )}
    </Button>
  )
}
