import { useMemo } from 'react';
import { useTopicStore } from '@/stores/topicStore';
import { TopicNode } from '@/types/mqtt';

function filterTree(nodes: Map<string, TopicNode>, search: string): Map<string, TopicNode> {
  if (!search) return nodes;

  const filtered = new Map<string, TopicNode>();
  nodes.forEach((node, key) => {
    if (node.fullPath.toLowerCase().includes(search.toLowerCase())) {
      filtered.set(key, node);
    } else {
      const filteredChildren = filterTree(node.children, search);
      if (filteredChildren.size > 0) {
        filtered.set(key, { ...node, children: filteredChildren });
      }
    }
  });
  return filtered;
}

export function useTopicTree() {
  const { topicTree, topicSearch } = useTopicStore();

  const filteredTree = useMemo(
    () => filterTree(topicTree, topicSearch),
    [topicTree, topicSearch]
  );

  return { filteredTree };
}
