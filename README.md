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