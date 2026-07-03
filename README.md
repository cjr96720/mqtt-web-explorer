# mqtt-web-explorer
Self-hosted MQTT explorer — connect, subscribe, and publish via WebSocket in the browser

## Features

### Connection Management
- Configure MQTT broker URL (`ws://` or `wss://`)
- Auto-generated or custom Client ID
- Optional username/password authentication
- Configurable Keep Alive interval and Clean Session toggle
- Connection status indicator with color-coded states (connecting / connected / disconnected / error)
- Automatic reconnection on disconnect (5 s interval)

### Topic Management
- Hierarchical topic tree view (split by `/` segments)
- Case-insensitive topic search and filter
- Subscribe with QoS selection (0, 1, 2)
- MQTT wildcard support (`#` and `+`)
- Expand / collapse all nodes
- Context menu per topic: subscribe, unsubscribe, filter messages, copy topic path, copy last value
- Message count badge and last payload preview on hover

### Message Viewing
- Real-time message list with virtual scrolling (up to 5 000 messages)
- Message metadata: timestamp, topic, QoS, retain flag
- Filter messages by topic
- Pause / resume message capture
- Clear all messages
- Detailed view with full metadata and payload size

### Payload Viewer
- JSON mode with syntax highlighting (strings, numbers, booleans, null)
- Raw text mode preserving whitespace
- Protobuf decoding mode — automatically decodes binary payloads using a user-provided `.proto` schema mapped to the message's topic
- Hex dump mode (manual toggle, or automatic fallback when protobuf decoding fails)
- One-click copy to clipboard

### Protobuf Schema Manager
- Upload / paste `.proto` schema content, validated live with a list of detected message types
- Map topic patterns (supports `+` / `#` wildcards) to a schema + message type; first matching rule wins
- Per-mapping **Offset** / **Trailer** byte counts to strip firmware frame headers/footers (e.g. sync bytes, length fields, CRC checksums) before decoding
- Schemas and mappings persist in the browser (localStorage)

### Message Publishing
- Non-modal side panel — stays open next to the message list so you can keep watching incoming messages while publishing
- Topic input with autocomplete from known topics
- Payload editor with JSON formatter
- QoS (0, 1, 2) and Retain flag selection
- Keyboard shortcut: `Ctrl+Enter` to publish
- Continuous publish mode (interval + duration) that keeps running even if the panel is closed
- Publish history (last 50 messages) — click to reload
- Visual feedback on successful publish

### User Interface
- Dark / light theme toggle
- Georgia / Monaco font styling (body text / monospace fields)
- Resizable sidebar and main panel (drag to resize)
- Status bar: connection state, broker URL, error messages, topic count, message count
- Settings dialog for connection configuration

### Deployment
- Multi-stage Docker build (Node 22 → nginx Alpine)
- docker-compose with single-command startup
- nginx SPA routing with gzip compression

## Run Application

```bash
docker compose up -d --build
```

Open [http://localhost:8085](http://localhost:8085) in your browser.

## Usage Guide

### 1. Connect to a Broker
1. Click the settings icon (top-right) to open the connection dialog.
2. Enter the broker WebSocket URL, e.g. `ws://localhost:9001`.
3. (Optional) Fill in Client ID, username, password, Keep Alive, and Clean Session.
4. Click **Connect**.

The status bar at the bottom shows the current connection state (connecting / connected / disconnected / error).

### 2. Subscribe to Topics
1. Type a topic or wildcard (e.g. `sensors/#`, `home/+/temperature`) in the subscribe input.
2. Select the desired QoS (0, 1, or 2).
3. Click **Subscribe** or press Enter.

Subscribed topics appear in the left-side topic tree. Each node shows the message count and a preview of the last payload on hover.

### 3. Browse Topics
- The topic tree groups messages by `/`-separated path segments.
- Use the search bar above the tree to filter topics by keyword (case-insensitive).
- Right-click any topic node for a context menu: subscribe, unsubscribe, filter messages, copy topic path, or copy last value.
- Use **Expand All** / **Collapse All** buttons to control tree depth.

### 4. View Messages
- Incoming messages are listed in real time in the centre panel (up to 5 000 messages with virtual scrolling).
- Each row shows timestamp, topic, QoS, and retain flag.
- Click a message to open the detail view with full metadata, payload size, and formatted payload.
- Use the **Pause** button to stop capturing new messages without disconnecting; click again to resume.
- Use **Clear** to discard all buffered messages.
- Use the topic filter (funnel icon or context menu) to show messages for a single topic only.

### 5. Inspect Payload
The payload viewer (in the message detail panel) supports several modes:

| Mode     | Description |
|----------|-------------|
| JSON     | Syntax-highlighted view for valid JSON payloads |
| Raw      | Plain-text view preserving original whitespace |
| Protobuf | Decoded view when the topic has a matching schema mapping (see below) |
| Hex      | Raw byte dump — toggle manually, or shown automatically if protobuf decoding fails |

Click the copy icon to copy the payload (or decoded protobuf as JSON) to clipboard.

### 6. Decode Protobuf Payloads
If your devices publish binary [Protocol Buffers](https://protobuf.dev/) payloads instead of JSON/text, you can set up automatic decoding:

1. Click the schema icon (`</>`) in the top toolbar to open the **Protobuf Schema Manager**.
2. Under **Schemas**, click **Add Schema**, name it, and paste your `.proto` file content. It's validated live and lists the detected message types.
3. Under **Topic Mappings**, click **Add Rule** and configure:
   - **Topic pattern** — the topic (or wildcard, e.g. `sensors/+/data`) this rule applies to
   - **Schema** / **Message type** — which schema and message type to decode with
   - **Offset** — number of leading bytes to skip before decoding (e.g. sync bytes + length field in a custom frame header)
   - **Trailer** — number of trailing bytes to strip before decoding (e.g. a CRC checksum footer)
4. Open any matching message's detail view — the payload viewer will now show the decoded fields instead of raw bytes. If decoding fails, it falls back to a hex dump with the error shown.

Schemas and mappings are saved in the browser and persist across reloads. Note: only the detail view decodes protobuf; the message list and topic tree previews still show raw text for these topics.

### 7. Publish Messages
The Publish panel is a non-modal side panel — it stays open alongside the message list so you can keep an eye on incoming messages while you work.

1. Click **Publish** in the top toolbar to open the panel.
2. Enter a topic (autocomplete suggests known topics).
3. Write the payload; click **Format JSON** to pretty-print.
4. Select QoS and toggle Retain if needed.
5. Click **Publish** or press `Ctrl+Enter`.

For repeated sends, enable **Continuous Publish** and set an interval/duration — it keeps running in the background even if you close the panel, and only stops when you click **Stop**, the duration elapses, or the broker disconnects.

Published messages are saved in the publish history (last 50). Click any history entry to reload it into the form.
