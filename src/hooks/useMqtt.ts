import { useEffect, useCallback, useRef } from 'react';
import { mqttClient, PublishResult } from '@/lib/mqttClient';
import { useConnectionStore } from '@/stores/connectionStore';
import { useMessageStore } from '@/stores/messageStore';
import { useTopicStore } from '@/stores/topicStore';
import { toast } from '@/hooks/use-toast';
import { MqttMessage } from '@/types/mqtt';

let messageIdCounter = 0;

// Wire up mqttClient listeners to stores. Must be called exactly once at app root.
export function useMqttListeners() {
  const { setStatus } = useConnectionStore();
  const { addMessage } = useMessageStore();
  const { addMessage: addToTopic, subscriptions } = useTopicStore();
  const subscriptionsRef = useRef(subscriptions);

  const setStatusRef = useRef(setStatus);
  const addMessageRef = useRef(addMessage);
  const addToTopicRef = useRef(addToTopic);

  useEffect(() => { subscriptionsRef.current = subscriptions; }, [subscriptions]);
  useEffect(() => { setStatusRef.current = setStatus; }, [setStatus]);
  useEffect(() => { addMessageRef.current = addMessage; }, [addMessage]);
  useEffect(() => { addToTopicRef.current = addToTopic; }, [addToTopic]);

  useEffect(() => {
    let prevStatus: string = 'disconnected';

    const unsubStatus = mqttClient.onStatus((status, error) => {
      setStatusRef.current(status, error);

      if (status === 'connected') {
        subscriptionsRef.current.forEach(sub => {
          mqttClient.subscribe(sub.topic, sub.qos);
        });
        // Only toast on initial connect or reconnect, not on every status update
        if (prevStatus !== 'connected') {
          toast({
            title: 'Connected',
            description: `Connected to broker`,
            variant: 'success',
            duration: 3000,
          });
        }
      }

      if (status === 'error' && error) {
        toast({
          title: 'Connection Error',
          description: error,
          variant: 'destructive',
          duration: 6000,
        });
      }

      if (status === 'disconnected' && prevStatus === 'connected') {
        toast({
          title: 'Disconnected',
          description: error || 'Disconnected from broker',
          duration: 4000,
        });
      }

      prevStatus = status;
    });

    const unsubMessage = mqttClient.onMessage((topic, payload, qos, retain) => {
      const message: MqttMessage = {
        id: `msg-${++messageIdCounter}`,
        topic,
        payload,
        qos,
        retain,
        timestamp: Date.now(),
      };
      addMessageRef.current(message);
      addToTopicRef.current(message);
    });

    return () => {
      unsubStatus();
      unsubMessage();
    };
  }, []);
}

export function useMqtt() {
  const { config } = useConnectionStore();

  const connect = useCallback(() => {
    const clientId = config.clientId || `mqtt-explorer-${Math.random().toString(36).slice(2, 8)}`;
    mqttClient.connect({ ...config, clientId });
  }, [config]);

  const disconnect = useCallback(() => {
    mqttClient.disconnect();
  }, []);

  const subscribe = useCallback((topic: string, qos: 0 | 1 | 2 = 0) => {
    if (mqttClient.isConnected()) {
      mqttClient.subscribe(topic, qos);
    }
  }, []);

  const unsubscribe = useCallback((topic: string) => {
    if (mqttClient.isConnected()) {
      mqttClient.unsubscribe(topic);
    }
  }, []);

  const publish = useCallback((topic: string, payload: string, qos: 0 | 1 | 2 = 0, retain: boolean = false): Promise<PublishResult> => {
    return mqttClient.publish(topic, payload, qos, retain);
  }, []);

  return { connect, disconnect, subscribe, unsubscribe, publish };
}
