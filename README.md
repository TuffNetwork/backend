## TuffClient Backend

This NodeJS server maintains the list of eaglercraft servers using TuffX+ with the registry enabled. TuffX+ connects to the WebSocket and stays connected, and when the connection drops, the server is removed.

### Endpoints
- /ws - WebSocket - plugin connects here
- /api/servers - GET - lists all active servers

### Prerequisites
- bun
