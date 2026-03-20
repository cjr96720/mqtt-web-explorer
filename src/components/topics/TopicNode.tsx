import { ChevronRight, ChevronDown, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useTopicStore } from '@/stores/topicStore'
import { useMessageStore } from '@/stores/messageStore'
import { TopicNode as TopicNodeType } from '@/types/mqtt'
import { cn } from '@/lib/utils'
import { useMqtt } from '@/hooks/useMqtt'

interface TopicNodeProps {
  node: TopicNodeType
  depth: number
}

export function TopicNodeComponent({ node, depth }: TopicNodeProps) {
  const { selectedTopic, expandedNodes, toggleExpanded, setSelectedTopic, subscriptions } = useTopicStore()
  const { setFilter } = useMessageStore()
  const { subscribe, unsubscribe } = useMqtt()
  const hasChildren = node.children.size > 0

  const matchingSubscriptions = subscriptions.filter(
    s => s.topic === node.fullPath || s.topic === node.fullPath + '/#'
  )
  const isExpanded = expandedNodes.has(node.fullPath)
  const isSelected = selectedTopic === node.fullPath

  const handleClick = () => {
    setSelectedTopic(node.fullPath)
    setFilter(node.fullPath)
    if (hasChildren) {
      toggleExpanded(node.fullPath)
    }
  }

  const truncatePayload = (payload: string, max = 40) => {
    if (payload.length <= max) return payload
    return payload.slice(0, max) + '...'
  }

  const lastValue = node.lastMessage?.payload
    ? truncatePayload(node.lastMessage.payload)
    : null

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 cursor-pointer rounded-sm hover:bg-accent group',
              isSelected && 'bg-accent text-accent-foreground'
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={handleClick}
          >
            {/* Expand/collapse chevron */}
            <span className="flex-shrink-0 w-4">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )
              ) : (
                <span className="h-3.5 w-3.5 block" />
              )}
            </span>

            {/* Topic segment */}
            <span className="flex-1 text-xs font-mono truncate min-w-0">
              {node.segment}
            </span>

            {/* Last value preview */}
            {lastValue && (
              <span className="text-xs text-muted-foreground truncate max-w-[80px] hidden group-hover:block">
                {lastValue}
              </span>
            )}

            {/* Message count badge */}
            <Badge
              variant="secondary"
              className="h-4 min-w-[1.5rem] text-[10px] px-1 flex-shrink-0"
            >
              {node.messageCount > 999 ? '999+' : node.messageCount}
            </Badge>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => {
              setSelectedTopic(node.fullPath)
              setFilter(node.fullPath)
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Filter messages
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>Subscribe to {node.fullPath}/#</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {([0, 1, 2] as const).map(qos => (
                <ContextMenuItem key={qos} onClick={() => subscribe(node.fullPath + '/#', qos)}>
                  QoS {qos}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Subscribe to {node.fullPath}</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {([0, 1, 2] as const).map(qos => (
                <ContextMenuItem key={qos} onClick={() => subscribe(node.fullPath, qos)}>
                  QoS {qos}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          {matchingSubscriptions.length > 0 && (
            <>
              <ContextMenuSeparator />
              {matchingSubscriptions.map(sub => (
                <ContextMenuItem key={sub.topic} onClick={() => unsubscribe(sub.topic)}>
                  Unsubscribe from {sub.topic}
                </ContextMenuItem>
              ))}
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => navigator.clipboard.writeText(node.fullPath)}
          >
            Copy topic path
          </ContextMenuItem>
          {node.lastMessage && (
            <ContextMenuItem
              onClick={() => navigator.clipboard.writeText(node.lastMessage!.payload)}
            >
              Copy last value
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {Array.from(node.children.values()).map(child => (
            <TopicNodeComponent key={child.fullPath} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
