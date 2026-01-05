export interface ServerEntry {
    addr: string;
    ws: WebSocket | null;
}

export interface ServerData {
    addr: string;
}