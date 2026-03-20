import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PayloadViewerProps {
  payload: string
  className?: string
}

function tryParseJson(str: string): { parsed: unknown; isJson: boolean } {
  try {
    const parsed = JSON.parse(str)
    return { parsed, isJson: true }
  } catch {
    return { parsed: null, isJson: false }
  }
}

function JsonRenderer({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const indent = depth * 16

  if (value === null) {
    return <span className="text-red-400">null</span>
  }
  if (typeof value === 'boolean') {
    return <span className="text-blue-400">{value.toString()}</span>
  }
  if (typeof value === 'number') {
    return <span className="text-yellow-400">{value}</span>
  }
  if (typeof value === 'string') {
    return <span className="text-green-400">"{value}"</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-foreground">{'[]'}</span>
    return (
      <span>
        <span className="text-foreground">{'['}</span>
        <div style={{ marginLeft: indent + 16 }}>
          {value.map((item, i) => (
            <div key={i}>
              <JsonRenderer value={item} depth={depth + 1} />
              {i < value.length - 1 && <span className="text-foreground">,</span>}
            </div>
          ))}
        </div>
        <span className="text-foreground" style={{ marginLeft: indent }}>{']'}</span>
      </span>
    )
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return <span className="text-foreground">{'{}'}</span>
    return (
      <span>
        <span className="text-foreground">{'{'}</span>
        <div style={{ marginLeft: indent + 16 }}>
          {entries.map(([key, val], i) => (
            <div key={key}>
              <span className="text-purple-400">"{key}"</span>
              <span className="text-foreground">: </span>
              <JsonRenderer value={val} depth={depth + 1} />
              {i < entries.length - 1 && <span className="text-foreground">,</span>}
            </div>
          ))}
        </div>
        <span className="text-foreground" style={{ marginLeft: indent }}>{'}'}</span>
      </span>
    )
  }
  return <span>{String(value)}</span>
}

export function PayloadViewer({ payload, className }: PayloadViewerProps) {
  const [copied, setCopied] = useState(false)
  const { parsed, isJson } = tryParseJson(payload)

  const handleCopy = () => {
    navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative group', className)}>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>

      <div className="rounded-md bg-muted/50 border border-border p-3 font-mono text-xs overflow-auto max-h-[400px]">
        {isJson ? (
          <div className="leading-5">
            <JsonRenderer value={parsed} />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words text-foreground leading-5">
            {payload || <span className="text-muted-foreground italic">(empty payload)</span>}
          </pre>
        )}
      </div>

      {isJson && (
        <div className="mt-1 flex items-center gap-1">
          <span className="text-xs text-muted-foreground">JSON</span>
        </div>
      )}
    </div>
  )
}
