## tuffc backend
list of eaglercraft servers using tuffx+. tuffx+ connects to the websocket and stays connected, and when the connection drops, the server is removed.

### endpoints
- /ws - WebSocket - plugin connects here
- /api/servers - GET - lists all active servers

### prerequisites
- bun