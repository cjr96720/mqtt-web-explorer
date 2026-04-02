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
- One-click copy to clipboard

### Message Publishing
- Topic input with autocomplete from known topics
- Payload editor with JSON formatter
- QoS (0, 1, 2) and Retain flag selection
- Keyboard shortcut: `Ctrl+Enter` to publish
- Publish history (last 50 messages) — click to reload
- Visual feedback on successful publish

### User Interface
- Dark / light theme toggle
- Resizable sidebar and main panel (drag to resize)
- Status bar: connection state, broker URL, error messages, topic count, message count
- Settings dialog for connection configuration

### Deployment
- Multi-stage Docker build (Node 20 → nginx Alpine)
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
The payload viewer supports two modes:

| Mode | Description |
|------|-------------|
| JSON | Syntax-highlighted view for valid JSON payloads |
| Raw  | Plain-text view preserving original whitespace |

Click the copy icon to copy the payload to clipboard.

### 6. Publish Messages
1. Open the **Publish** panel.
2. Enter a topic (autocomplete suggests known topics).
3. Write the payload; click **Format JSON** to pretty-print.
4. Select QoS and toggle Retain if needed.
5. Click **Publish** or press `Ctrl+Enter`.

Published messages are saved in the publish history (last 50). Click any history entry to reload it into the form.
