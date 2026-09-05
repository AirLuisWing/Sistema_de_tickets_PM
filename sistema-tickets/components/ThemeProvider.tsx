"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Ignoramos el error de tipado temporal para el provider
export function ThemeProvider({ children, ...props }: any) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}