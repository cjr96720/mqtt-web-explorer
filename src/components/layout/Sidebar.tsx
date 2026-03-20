import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TopicTree } from '@/components/topics/TopicTree'
import { useTopicStore } from '@/stores/topicStore'

export function Sidebar() {
  const { topicSearch, setTopicSearch } = useTopicStore()

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Sidebar header */}
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Topics
        </h2>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            placeholder="Filter topics..."
            className="h-7 pl-7 pr-7 text-xs"
          />
          {topicSearch && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
              onClick={() => setTopicSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Topic tree */}
      <div className="flex-1 overflow-hidden">
        <TopicTree />
      </div>
    </div>
  )
}
