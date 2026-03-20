import { useState, useMemo } from 'react'
import { X, Pause, Play, Trash2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageList } from '@/components/messages/MessageList'
import { MessageDetail } from '@/components/messages/MessageDetail'
import { useMessageStore } from '@/stores/messageStore'
import { useTopicStore } from '@/stores/topicStore'
import { useMqtt } from '@/hooks/useMqtt'
import { useConnectionStore } from '@/stores/connectionStore'
import { cn } from '@/lib/utils'

export function MainPanel() {
  const { messages, paused, filter, setPaused, clearMessages, setFilter, selectedMessage } = useMessageStore()
  const { subscriptions, addSubscription, removeSubscription } = useTopicStore()
  const { subscribe, unsubscribe } = useMqtt()
  const { status } = useConnectionStore()
  const [newTopic, setNewTopic] = useState('')
  const [newQos, setNewQos] = useState<'0' | '1' | '2'>('0')
  const [showAddTopic, setShowAddTopic] = useState(false)
  const isConnected = status === 'connected'

  const handleAddSubscription = () => {
    const topic = newTopic.trim()
    if (!topic) return
    const qos = Number(newQos) as 0 | 1 | 2
    addSubscription({ topic, qos })
    if (isConnected) {
      subscribe(topic, qos)
    }
    setNewTopic('')
    setNewQos('0')
    setShowAddTopic(false)
  }

  const handleRemoveSubscription = (topic: string) => {
    removeSubscription(topic)
    if (isConnected) {
      unsubscribe(topic)
    }
  }

  const filteredCount = useMemo(() => {
    if (!filter) return messages.length
    const lowerFilter = filter.toLowerCase()
    return messages.reduce((count, m) => m.topic.toLowerCase().includes(lowerFilter) ? count + 1 : count, 0)
  }, [messages, filter])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Subscriptions section */}
      <div className="px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Subscriptions
          </h2>
          <Button
            size="sm"
            className="h-5 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowAddTopic(!showAddTopic)}
          >
            Add
          </Button>
        </div>

        {/* Subscription chips */}
        <div className="flex flex-wrap gap-1.5">
          {subscriptions.map(sub => (
            <div
              key={sub.topic}
              className="flex items-center gap-1 bg-secondary rounded-full px-2.5 py-0.5 text-xs"
            >
              <span className="font-mono">{sub.topic}</span>
              <Badge variant="outline" className="h-3.5 text-[9px] px-1">Q{sub.qos}</Badge>
              <button
                className="text-muted-foreground hover:text-foreground ml-0.5"
                onClick={() => handleRemoveSubscription(sub.topic)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add subscription input */}
        {showAddTopic && (
          <div className="flex gap-1.5 mt-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="topic/# or sensor/+"
              className="h-7 text-xs font-mono flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubscription()
                if (e.key === 'Escape') setShowAddTopic(false)
              }}
              autoFocus
            />
            <Select value={newQos} onValueChange={(v) => setNewQos(v as '0' | '1' | '2')}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">QoS 0</SelectItem>
                <SelectItem value="1">QoS 1</SelectItem>
                <SelectItem value="2">QoS 2</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddSubscription}
            >
              Subscribe
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setShowAddTopic(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Message controls */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card">
        {/* Filter input */}
        <div className="relative flex-1">
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by topic..."
            className="h-7 pl-6 text-xs font-mono"
          />
          {filter && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setFilter('')}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Message count */}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filteredCount.toLocaleString()} msg{filteredCount !== 1 ? 's' : ''}
        </span>

        {/* Pause/Resume */}
        <Button
          size="icon"
          variant={paused ? 'default' : 'ghost'}
          className={cn('h-7 w-7', paused && 'bg-yellow-600 hover:bg-yellow-700')}
          onClick={() => setPaused(!paused)}
          title={paused ? 'Resume' : 'Pause'}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </Button>

        {/* Clear */}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={clearMessages}
          title="Clear messages"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedMessage ? (
          <>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <MessageList />
            </div>
            <div className="h-80 min-h-0 overflow-hidden flex flex-col border-t border-border">
              <MessageDetail message={selectedMessage} />
            </div>
          </>
        ) : (
          <MessageList />
        )}
      </div>
    </div>
  )
}
