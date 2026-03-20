import { X, Clock, Tag, Shield, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PayloadViewer } from './PayloadViewer'
import { useMessageStore } from '@/stores/messageStore'
import { MqttMessage } from '@/types/mqtt'

interface MessageDetailProps {
  message: MqttMessage
}

export function MessageDetail({ message }: MessageDetailProps) {
  const { setSelectedMessage } = useMessageStore()

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts)
    const base = d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const ms = String(d.getMilliseconds()).padStart(3, '0')
    return `${base}.${ms}`
  }

  return (
    <div className="flex flex-col h-full bg-card border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Message Detail
        </h3>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => setSelectedMessage(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Topic */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Topic</span>
          </div>
          <p className="text-sm font-mono break-all text-foreground bg-muted/50 rounded px-2 py-1">
            {message.topic}
          </p>
        </div>

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Time</span>
            </div>
            <p className="text-xs font-mono text-foreground">
              {formatTimestamp(message.timestamp)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">QoS</span>
            </div>
            <Badge variant="outline" className="text-xs">
              QoS {message.qos}
            </Badge>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Retain</span>
            </div>
            <Badge variant={message.retain ? 'default' : 'secondary'} className="text-xs">
              {message.retain ? 'Retained' : 'Not retained'}
            </Badge>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-medium text-muted-foreground">Size</span>
            </div>
            <p className="text-xs text-foreground">
              {new TextEncoder().encode(message.payload).byteLength} bytes
            </p>
          </div>
        </div>

        <Separator />

        {/* Payload */}
        <div>
          <span className="text-xs font-medium text-muted-foreground">Payload</span>
          <div className="mt-1">
            <PayloadViewer payload={message.payload} />
          </div>
        </div>
      </div>
    </div>
  )
}
