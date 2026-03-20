import { useToast } from "@/hooks/use-toast"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-12 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon =
          t.variant === "success" ? CheckCircle2 :
          t.variant === "destructive" ? AlertCircle :
          Info

        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-2.5 rounded-md border px-3 py-2.5 shadow-lg text-xs animate-in slide-in-from-right-full fade-in duration-200",
              t.variant === "destructive" && "border-red-500/30 bg-red-950/80 text-red-200",
              t.variant === "success" && "border-green-500/30 bg-green-950/80 text-green-200",
              (!t.variant || t.variant === "default") && "border-border bg-card text-foreground",
            )}
          >
            <Icon className={cn(
              "h-4 w-4 flex-shrink-0 mt-0.5",
              t.variant === "destructive" && "text-red-400",
              t.variant === "success" && "text-green-400",
              (!t.variant || t.variant === "default") && "text-blue-400",
            )} />
            <div className="flex-1 min-w-0">
              {t.title && <p className="font-medium leading-tight">{t.title}</p>}
              {t.description && (
                <p className={cn("leading-tight", t.title && "mt-0.5 opacity-80")}>{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
