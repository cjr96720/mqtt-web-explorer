import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Badge } from '@/components/ui/badge'
import { useMessageStore } from '@/stores/messageStore'
import { MqttMessage } from '@/types/mqtt'
import { cn } from '@/lib/utils'

interface MessageRowProps {
  message: MqttMessage
  isSelected: boolean
  onClick: () => void
}

function MessageRow({ message, isSelected, onClick }: MessageRowProps) {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + '...' : str

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-3 py-2 cursor-pointer border-b border-border/50 hover:bg-accent/50 transition-colors',
        isSelected && 'bg-accent'
      )}
      onClick={onClick}
    >
      {/* Time */}
      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap mt-0.5 flex-shrink-0">
        {formatTime(message.timestamp)}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-mono font-medium text-primary truncate">
            {truncate(message.topic, 60)}
          </span>
          {message.retain && (
            <Badge variant="outline" className="h-3.5 text-[9px] px-1 flex-shrink-0">R</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono block truncate">
          {truncate(message.payload, 80) || <em>(empty)</em>}
        </span>
      </div>

      {/* QoS */}
      <Badge variant="secondary" className="h-4 text-[10px] px-1 flex-shrink-0 mt-0.5">
        Q{message.qos}
      </Badge>
    </div>
  )
}

export function MessageList() {
  const { messages, selectedMessage, setSelectedMessage, filter } = useMessageStore()
  const parentRef = useRef<HTMLDivElement>(null)

  const filteredMessages = useMemo(() => {
    if (!filter) return messages
    const lowerFilter = filter.toLowerCase()
    return messages.filter(m => m.topic.toLowerCase().includes(lowerFilter))
  }, [messages, filter])

  const virtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  })

  const items = virtualizer.getVirtualItems()

  if (filteredMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No messages</p>
          {filter && (
            <p className="text-xs text-muted-foreground mt-1">
              Filtering by: <span className="font-mono text-primary">{filter}</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {items.map(virtualRow => {
          const message = filteredMessages[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageRow
                message={message}
                isSelected={selectedMessage?.id === message.id}
                onClick={() => setSelectedMessage(
                  selectedMessage?.id === message.id ? null : message
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
