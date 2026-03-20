import { create } from 'zustand';
import { TopicNode, MqttMessage, Subscription } from '@/types/mqtt';

interface TopicStore {
  topicTree: Map<string, TopicNode>;
  selectedTopic: string | null;
  topicSearch: string;
  subscriptions: Subscription[];
  expandedNodes: Set<string>;
  addMessage: (message: MqttMessage) => void;
  setSelectedTopic: (topic: string | null) => void;
  setTopicSearch: (search: string) => void;
  addSubscription: (sub: Subscription) => void;
  removeSubscription: (topic: string) => void;
  toggleExpanded: (fullPath: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  clearTopics: () => void;
}

export const useTopicStore = create<TopicStore>((set) => ({
  topicTree: new Map(),
  selectedTopic: null,
  topicSearch: '',
  subscriptions: [{ topic: '#', qos: 0 }],
  expandedNodes: new Set(),
  addMessage: (message) =>
    set((state) => {
      const newTree = new Map(state.topicTree);
      const segments = message.topic.split('/');

      let current = newTree;
      let fullPath = '';
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        fullPath = fullPath ? `${fullPath}/${segment}` : segment;

        if (!current.has(segment)) {
          current.set(segment, {
            segment,
            fullPath,
            children: new Map(),
            messageCount: 0,
          });
        }

        const node = current.get(segment)!;
        const updatedNode: TopicNode = {
          ...node,
          messageCount: node.messageCount + 1,
          lastMessage: i === segments.length - 1 ? message : node.lastMessage,
          children: new Map(node.children),
        };
        current.set(segment, updatedNode);
        current = updatedNode.children;
      }

      return { topicTree: newTree };
    }),
  setSelectedTopic: (selectedTopic) => set({ selectedTopic }),
  setTopicSearch: (topicSearch) => set({ topicSearch }),
  addSubscription: (sub) =>
    set((state) => ({
      subscriptions: state.subscriptions.some(s => s.topic === sub.topic)
        ? state.subscriptions
        : [...state.subscriptions, sub],
    })),
  removeSubscription: (topic) =>
    set((state) => ({
      subscriptions: state.subscriptions.filter(s => s.topic !== topic),
    })),
  toggleExpanded: (fullPath) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      if (newExpanded.has(fullPath)) {
        newExpanded.delete(fullPath);
      } else {
        newExpanded.add(fullPath);
      }
      return { expandedNodes: newExpanded };
    }),
  expandAll: () =>
    set((state) => {
      const allPaths = new Set<string>();
      const traverse = (nodes: Map<string, TopicNode>) => {
        nodes.forEach(node => {
          allPaths.add(node.fullPath);
          traverse(node.children);
        });
      };
      traverse(state.topicTree);
      return { expandedNodes: allPaths };
    }),
  collapseAll: () => set({ expandedNodes: new Set() }),
  clearTopics: () => set({ topicTree: new Map(), selectedTopic: null }),
}));
