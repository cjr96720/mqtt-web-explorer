import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { ConnectionConfig, ConnectionStatus } from '@/types/mqtt';

type MessageCallback = (topic: string, payload: string, qos: 0 | 1 | 2, retain: boolean) => void;
type StatusCallback = (status: ConnectionStatus, error?: string) => void;

export interface PublishResult {
  ack: boolean;  // true if broker acknowledged (QoS 1/2), false for QoS 0 (fire-and-forget)
  qos: 0 | 1 | 2;
}

/**
 * Map raw MQTT/network errors to user-friendly messages.
 */
function formatConnectionError(err: Error): string {
  const msg = err.message || String(err);

  // WebSocket connection refused / unreachable
  if (msg.includes('ECONNREFUSED') || msg.includes('connect ECONNREFUSED')) {
    return `Connection refused – broker at the specified address is not reachable or not running`;
  }
  if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
    return `Host not found – check the broker hostname`;
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('ETIME')) {
    return `Connection timed out – broker did not respond`;
  }
  if (msg.includes('ECONNRESET')) {
    return `Connection reset by broker`;
  }

  // MQTT-level errors
  if (/connack.*128|not authorized|bad user|bad password/i.test(msg)) {
    return `Authentication failed – check username and password`;
  }
  if (/connack.*134|bad username or password/i.test(msg)) {
    return `Authentication failed – invalid credentials`;
  }
  if (/connack.*5/i.test(msg)) {
    return `Not authorized – broker rejected the connection`;
  }
  if (/connack.*2|identifier rejected/i.test(msg)) {
    return `Client ID rejected by broker`;
  }
  if (/connack.*3|server unavailable/i.test(msg)) {
    return `Broker unavailable – server cannot handle request`;
  }
  if (/connack.*4|bad.*username.*password/i.test(msg)) {
    return `Authentication failed – bad username or password`;
  }

  // WebSocket-specific
  if (msg.includes('WebSocket') && msg.includes('failed')) {
    return `WebSocket connection failed – check URL scheme (ws:// or wss://) and broker port`;
  }
  if (msg.includes('certificate') || msg.includes('SSL') || msg.includes('TLS')) {
    return `TLS/SSL error – check certificate configuration or use ws:// instead of wss://`;
  }

  // Protocol-level
  if (msg.includes('protocol') || msg.includes('MQTT')) {
    return `Protocol error – ${msg}`;
  }

  // Fallback: return original message but clean it up
  return msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
}

class MqttExplorerClient {
  private client: MqttClient | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];

  connect(config: ConnectionConfig): void {
    if (this.client) {
      this.disconnect();
    }

    const options: IClientOptions = {
      clientId: config.clientId || `mqtt-explorer-${Date.now()}`,
      username: config.username || undefined,
      password: config.password || undefined,
      clean: config.cleanSession,
      keepalive: config.keepAlive,
      reconnectPeriod: 5000,
    };

    this.notifyStatus('connecting');

    this.client = mqtt.connect(config.url, options);

    this.client.on('connect', () => {
      this.notifyStatus('connected');
    });

    this.client.on('error', (err) => {
      this.notifyStatus('error', formatConnectionError(err));
    });

    this.client.on('close', () => {
      this.notifyStatus('disconnected');
    });

    this.client.on('reconnect', () => {
      this.notifyStatus('connecting');
    });

    this.client.on('disconnect', (packet) => {
      const reason = packet?.reasonCode
        ? `Broker sent disconnect (code: ${packet.reasonCode})`
        : undefined;
      this.notifyStatus('disconnected', reason);
    });

    this.client.on('offline', () => {
      this.notifyStatus('disconnected', 'Client went offline');
    });

    this.client.on('message', (topic, payload, packet) => {
      const payloadStr = payload.toString();
      const qos = (packet.qos || 0) as 0 | 1 | 2;
      const retain = packet.retain || false;
      this.messageCallbacks.forEach(cb => cb(topic, payloadStr, qos, retain));
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      this.notifyStatus('disconnected');
    }
  }

  subscribe(topic: string, qos: 0 | 1 | 2 = 0): boolean {
    if (!this.client?.connected) return false;
    this.client.subscribe(topic, { qos });
    return true;
  }

  unsubscribe(topic: string): boolean {
    if (!this.client?.connected) return false;
    this.client.unsubscribe(topic);
    return true;
  }

  publish(topic: string, payload: string, qos: 0 | 1 | 2 = 0, retain: boolean = false): Promise<PublishResult> {
    return new Promise((resolve, reject) => {
      if (!this.client?.connected) {
        reject(new Error('Not connected to broker'));
        return;
      }

      this.client.publish(topic, payload, { qos, retain }, (err) => {
        if (err) {
          reject(new Error(`Publish failed: ${err.message}`));
        } else {
          resolve({ ack: qos > 0, qos });
        }
      });
    });
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyStatus(status: ConnectionStatus, error?: string): void {
    this.statusCallbacks.forEach(cb => cb(status, error));
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const mqttClient = new MqttExplorerClient();
