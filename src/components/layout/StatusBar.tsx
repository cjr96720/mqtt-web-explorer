import { Wifi, WifiOff, Hash, MessageSquare, AlertCircle } from 'lucide-react'
import { useConnectionStore } from '@/stores/connectionStore'
import { useMessageStore } from '@/stores/messageStore'
import { useTopicStore } from '@/stores/topicStore'
import { cn } from '@/lib/utils'

function countAllTopics(tree: Map<string, { children: Map<string, unknown> }>): number {
  let count = 0
  const traverse = (nodes: Map<string, { children: Map<string, unknown> }>) => {
    nodes.forEach(node => {
      count++
      traverse(node.children as Map<string, { children: Map<string, unknown> }>)
    })
  }
  traverse(tree)
  return count
}

export function StatusBar() {
  const { status, config, error } = useConnectionStore()
  const { messages } = useMessageStore()
  const { topicTree } = useTopicStore()

  const totalTopics = countAllTopics(topicTree as Map<string, { children: Map<string, unknown> }>)

  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-green-400',
      dotColor: 'bg-green-400',
      label: 'Connected',
    },
    connecting: {
      icon: Wifi,
      color: 'text-yellow-400',
      dotColor: 'bg-yellow-400 animate-pulse',
      label: 'Connecting',
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-muted-foreground',
      dotColor: 'bg-gray-500',
      label: 'Disconnected',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      dotColor: 'bg-red-400',
      label: 'Error',
    },
  }[status]

  const StatusIcon = statusConfig.icon

  return (
    <div className="flex items-center gap-4 px-3 py-1 border-t border-border bg-card text-xs">
      {/* Connection status */}
      <div className={cn('flex items-center gap-1.5', statusConfig.color)}>
        <div className={cn('h-2 w-2 rounded-full flex-shrink-0', statusConfig.dotColor)} />
        <StatusIcon className="h-3 w-3" />
        <span>{statusConfig.label}</span>
      </div>

      {/* Broker URL */}
      {status !== 'disconnected' && (
        <span className="font-mono text-muted-foreground truncate max-w-[200px]">
          {config.url}
        </span>
      )}

      {/* Error / disconnect reason */}
      {error && (
        <span
          className={cn(
            'truncate max-w-[300px]',
            status === 'error' ? 'text-red-400' : 'text-yellow-400'
          )}
          title={error}
        >
          {error}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Topics count */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Hash className="h-3 w-3" />
        <span>{totalTopics} topic{totalTopics !== 1 ? 's' : ''}</span>
      </div>

      {/* Messages count */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        <span>{messages.length.toLocaleString()} msg{messages.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
