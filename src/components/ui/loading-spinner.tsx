import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Spinner externo */}
        <div
          className={cn(
            "animate-spin rounded-full border-4 border-gray-200",
            sizeClasses[size]
          )}
        />
        {/* Spinner interno animado */}
        <div
          className={cn(
            "absolute top-0 left-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600",
            sizeClasses[size]
          )}
          style={{ animationDuration: '0.8s' }}
        />
        {/* Ponto central pulsante */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 animate-pulse",
            size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : "h-3 w-3"
          )}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-700 animate-pulse">{text}</p>
      )}
    </div>
  )
}

// Componente de overlay para bloquear interações durante carregamento
interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
}

export function LoadingOverlay({ isLoading, text = "Carregando..." }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-lg font-semibold text-gray-900">{text}</p>
        <p className="text-sm text-gray-600">Aguarde enquanto processamos sua solicitação...</p>
      </div>
    </div>
  )
}
