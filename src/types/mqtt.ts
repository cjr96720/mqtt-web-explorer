export interface ConnectionConfig {
  url: string;
  clientId: string;
  username?: string;
  password?: string;
  cleanSession: boolean;
  keepAlive: number;
}

export interface MqttMessage {
  id: string;
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
  retain: boolean;
  timestamp: number;
}

export interface TopicNode {
  segment: string;
  fullPath: string;
  children: Map<string, TopicNode>;
  messageCount: number;
  lastMessage?: MqttMessage;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  error?: string;
}

export interface Subscription {
  topic: string;
  qos: 0 | 1 | 2;
}

export interface PublishRecord {
  id: string;
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
  retain: boolean;
  timestamp: number;
}
