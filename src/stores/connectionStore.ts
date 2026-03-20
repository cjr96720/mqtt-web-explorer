import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConnectionConfig, ConnectionStatus } from '@/types/mqtt';

interface ConnectionStore {
  config: ConnectionConfig;
  status: ConnectionStatus;
  error?: string;
  setConfig: (config: Partial<ConnectionConfig>) => void;
  setStatus: (status: ConnectionStatus, error?: string) => void;
}

const defaultConfig: ConnectionConfig = {
  url: 'ws://localhost:9001',
  clientId: '',
  cleanSession: true,
  keepAlive: 60,
};

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set) => ({
      config: defaultConfig,
      status: 'disconnected',
      setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
      setStatus: (status, error) => set({ status, error }),
    }),
    {
      name: 'mqtt-connection-config',
      partialize: (state) => ({
        config: {
          url: state.config.url,
          clientId: state.config.clientId,
          cleanSession: state.config.cleanSession,
          keepAlive: state.config.keepAlive,
        },
      }),
    }
  )
);
