import { ChevronsUpDown, FoldVertical, UnfoldVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TopicNodeComponent } from './TopicNode'
import { useTopicStore } from '@/stores/topicStore'
import { useTopicTree } from '@/hooks/useTopicTree'

export function TopicTree() {
  const { expandAll, collapseAll, clearTopics } = useTopicStore()
  const { filteredTree } = useTopicTree()

  const topicCount = filteredTree.size

  return (
    <div className="flex flex-col h-full">
      {/* Tree controls */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border">
        <span className="text-xs text-muted-foreground flex-1">
          {topicCount} root topic{topicCount !== 1 ? 's' : ''}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={expandAll}
          title="Expand all"
        >
          <UnfoldVertical className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={collapseAll}
          title="Collapse all"
        >
          <FoldVertical className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={clearTopics}
          title="Clear topics"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tree content */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredTree.size === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-muted-foreground">No topics yet</p>
              <p className="text-xs text-muted-foreground mt-1">Connect and subscribe to see topics</p>
            </div>
          ) : (
            Array.from(filteredTree.values()).map(node => (
              <TopicNodeComponent key={node.fullPath} node={node} depth={0} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
