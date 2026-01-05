import type { ServerWebSocket } from 'bun';

export interface ServerData {
    addr: string;
}

export interface ServerEntry {
    addr: string;
    ws: ServerWebSocket<ServerData> | null;
}