import { create } from 'zustand';
import { MqttMessage } from '@/types/mqtt';

const MAX_MESSAGES = 5000;

interface MessageStore {
  messages: MqttMessage[];
  paused: boolean;
  selectedMessage: MqttMessage | null;
  filter: string;
  addMessage: (message: MqttMessage) => void;
  clearMessages: () => void;
  setPaused: (paused: boolean) => void;
  setSelectedMessage: (message: MqttMessage | null) => void;
  setFilter: (filter: string) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  paused: false,
  selectedMessage: null,
  filter: '',
  addMessage: (message) =>
    set((state) => {
      // While paused, incoming messages are discarded (not buffered).
      if (state.paused) return state;
      const messages = [message, ...state.messages];
      // Drop oldest messages once the cap is reached.
      if (messages.length > MAX_MESSAGES) {
        messages.splice(MAX_MESSAGES);
      }
      return { messages };
    }),
  clearMessages: () => set({ messages: [], selectedMessage: null }),
  setPaused: (paused) => set({ paused }),
  setSelectedMessage: (selectedMessage) => set({ selectedMessage }),
  setFilter: (filter) => set({ filter }),
}));
