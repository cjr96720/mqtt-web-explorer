import { useState, useMemo } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProtobufStore } from '@/stores/protobufStore'
import { decode } from '@/lib/protobufDecoder'

interface PayloadViewerProps {
  payload: string
  payloadRaw?: Uint8Array
  topic?: string
  className?: string
}

type DisplayMode = 'auto' | 'hex'

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

function HexDump({ bytes }: { bytes: Uint8Array }) {
  const lines: string[] = []
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16)
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
    const ascii = Array.from(chunk)
      .map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.'))
      .join('')
    const offset = i.toString(16).padStart(8, '0')
    lines.push(`${offset}  ${hex.padEnd(47)}  ${ascii}`)
  }

  return (
    <pre className="whitespace-pre font-mono text-[11px] leading-5 text-muted-foreground overflow-x-auto">
      {lines.join('\n') || <span className="italic">(empty)</span>}
    </pre>
  )
}

export function PayloadViewer({ payload, payloadRaw, topic, className }: PayloadViewerProps) {
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<DisplayMode>('auto')

  const { resolveMapping, getParsedSchema } = useProtobufStore()

  // Attempt protobuf decode if we have raw bytes and a topic mapping
  const protobufResult = useMemo(() => {
    if (!payloadRaw || !topic) return null
    const mapping = resolveMapping(topic)
    if (!mapping || !mapping.messageType) return null
    const parsed = getParsedSchema(mapping.schemaId)
    if (!parsed) return null
    const byteOffset = mapping.byteOffset ?? 0
    const trailerBytes = mapping.trailerBytes ?? 0
    try {
      const bytes = payloadRaw.subarray(byteOffset, payloadRaw.length - trailerBytes)
      const obj = decode(parsed.root, mapping.messageType, bytes)
      return { ok: true as const, obj, messageType: mapping.messageType }
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : String(err), byteOffset, trailerBytes }
    }
  }, [payloadRaw, topic, resolveMapping, getParsedSchema])

  const { parsed: jsonParsed, isJson } = tryParseJson(payload)

  const handleCopy = () => {
    const text = protobufResult?.ok
      ? JSON.stringify(protobufResult.obj, null, 2)
      : payload
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showHex = mode === 'hex' || (protobufResult && !protobufResult.ok)

  return (
    <div className={cn('relative group', className)}>
      {/* Toolbar row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {protobufResult?.ok && (
            <span className="text-xs text-purple-400 font-mono">
              Protobuf: {protobufResult.messageType}
            </span>
          )}
          {!protobufResult && isJson && (
            <span className="text-xs text-muted-foreground">JSON</span>
          )}
          {payloadRaw && (
            <button
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded hover:bg-muted transition-colors',
                mode === 'hex' ? 'text-foreground bg-muted' : 'text-muted-foreground'
              )}
              onClick={() => setMode((m) => (m === 'hex' ? 'auto' : 'hex'))}
            >
              Hex
            </button>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="rounded-md bg-muted/50 border border-border p-3 font-mono text-xs overflow-auto max-h-[400px]">
        {showHex && payloadRaw ? (
          <>
            {protobufResult && !protobufResult.ok && (
              <div className="flex items-start gap-1.5 text-xs text-red-400 mb-2 pb-2 border-b border-border">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Protobuf decode failed
                  {(protobufResult.byteOffset || protobufResult.trailerBytes)
                    ? ` (offset ${protobufResult.byteOffset}, trailer ${protobufResult.trailerBytes})`
                    : ''}
                  : {protobufResult.error}
                </span>
              </div>
            )}
            <HexDump bytes={payloadRaw} />
          </>
        ) : protobufResult?.ok ? (
          <div className="leading-5">
            <JsonRenderer value={protobufResult.obj} />
          </div>
        ) : isJson ? (
          <div className="leading-5">
            <JsonRenderer value={jsonParsed} />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words text-foreground leading-5">
            {payload || <span className="text-muted-foreground italic">(empty payload)</span>}
          </pre>
        )}
      </div>
    </div>
  )
}
