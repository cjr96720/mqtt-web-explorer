import protobuf from 'protobufjs';

export interface ParsedSchema {
  root: protobuf.Root;
  messageTypes: string[];
}

/**
 * Parse a .proto file content string and return the root + list of all message type names.
 */
export function parseSchema(protoContent: string): ParsedSchema {
  let root: protobuf.Root;
  try {
    root = protobuf.parse(protoContent, { keepCase: true }).root;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse .proto schema: ${msg}`);
  }

  const messageTypes: string[] = [];
  collectMessageTypes(root, '', messageTypes);

  return { root, messageTypes };
}

function collectMessageTypes(ns: protobuf.NamespaceBase, prefix: string, result: string[]) {
  ns.nestedArray.forEach((nested) => {
    const fullName = prefix ? `${prefix}.${nested.name}` : nested.name;
    if (nested instanceof protobuf.Type) {
      result.push(fullName);
      collectMessageTypes(nested, fullName, result);
    } else if (nested instanceof protobuf.Namespace) {
      collectMessageTypes(nested, fullName, result);
    }
  });
}

/**
 * Decode a Uint8Array using the given message type name from the parsed root.
 * Returns a plain JS object.
 */
export function decode(root: protobuf.Root, messageTypeName: string, bytes: Uint8Array): Record<string, unknown> {
  let type: protobuf.Type;
  try {
    type = root.lookupType(messageTypeName);
  } catch {
    throw new Error(`Message type "${messageTypeName}" not found in schema`);
  }

  const decoded = type.decode(bytes);
  const obj = type.toObject(decoded, {
    longs: String,
    enums: String,
    bytes: String,
    defaults: true,
    arrays: true,
    objects: true,
    oneofs: true,
  });

  return obj as Record<string, unknown>;
}
