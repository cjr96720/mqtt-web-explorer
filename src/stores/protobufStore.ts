import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseSchema, type ParsedSchema } from '@/lib/protobufDecoder';

export interface ProtoSchema {
  id: string;
  name: string;
  protoContent: string;
}

export interface TopicMapping {
  id: string;
  topicPattern: string;
  schemaId: string;
  messageType: string;
  /** Number of leading bytes to skip before decoding (e.g. for firmware frame headers). Defaults to 0. */
  byteOffset?: number;
  /** Number of trailing bytes to strip before decoding (e.g. for a CRC footer). Defaults to 0. */
  trailerBytes?: number;
}

interface ProtobufStore {
  schemas: ProtoSchema[];
  mappings: TopicMapping[];

  addSchema: (schema: ProtoSchema) => void;
  removeSchema: (id: string) => void;
  updateSchema: (id: string, updates: Partial<Omit<ProtoSchema, 'id'>>) => void;

  addMapping: (mapping: TopicMapping) => void;
  removeMapping: (id: string) => void;
  updateMapping: (id: string, updates: Partial<Omit<TopicMapping, 'id'>>) => void;

  resolveMapping: (topic: string) => TopicMapping | null;
  getParsedSchema: (schemaId: string) => ParsedSchema | null;
}

/**
 * Match a concrete MQTT topic against a pattern that may contain wildcards.
 * '+' matches a single segment, '#' matches the rest (must be last segment).
 */
export function matchTopic(pattern: string, topic: string): boolean {
  const patternSegments = pattern.split('/');
  const topicSegments = topic.split('/');

  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    if (p === '#') {
      return true;
    }
    if (i >= topicSegments.length) {
      return false;
    }
    if (p !== '+' && p !== topicSegments[i]) {
      return false;
    }
  }

  return patternSegments.length === topicSegments.length;
}

// Cache parsed schemas to avoid re-parsing on every message
const parsedSchemaCache = new Map<string, { content: string; parsed: ParsedSchema }>();

export const useProtobufStore = create<ProtobufStore>()(
  persist(
    (set, get) => ({
      schemas: [],
      mappings: [],

      addSchema: (schema) =>
        set((state) => ({ schemas: [...state.schemas, schema] })),

      removeSchema: (id) =>
        set((state) => ({
          schemas: state.schemas.filter((s) => s.id !== id),
          mappings: state.mappings.filter((m) => m.schemaId !== id),
        })),

      updateSchema: (id, updates) =>
        set((state) => ({
          schemas: state.schemas.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      addMapping: (mapping) =>
        set((state) => ({ mappings: [...state.mappings, mapping] })),

      removeMapping: (id) =>
        set((state) => ({ mappings: state.mappings.filter((m) => m.id !== id) })),

      updateMapping: (id, updates) =>
        set((state) => ({
          mappings: state.mappings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      resolveMapping: (topic) => {
        const { mappings } = get();
        return mappings.find((m) => matchTopic(m.topicPattern, topic)) ?? null;
      },

      getParsedSchema: (schemaId) => {
        const { schemas } = get();
        const schema = schemas.find((s) => s.id === schemaId);
        if (!schema) return null;

        const cached = parsedSchemaCache.get(schemaId);
        if (cached && cached.content === schema.protoContent) {
          return cached.parsed;
        }

        try {
          const parsed = parseSchema(schema.protoContent);
          parsedSchemaCache.set(schemaId, { content: schema.protoContent, parsed });
          return parsed;
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'mqtt-protobuf-config',
    }
  )
);
