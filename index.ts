import { existsSync, readFileSync, writeFileSync } from 'fs';

interface ServerEntry {
    addr: string;
    ws: WebSocket | null;
}

interface ServerData {
    addr: string;
}

let servers = new Map<string, ServerEntry>();

const save = () => {
    let list = Array.from(servers.values()).map(s => ({ addr: s.addr }));
    writeFileSync('./servers.json', JSON.stringify(list, null, 2));
};

if (existsSync('./servers.json')) {
    try {
        let list = JSON.parse(readFileSync('./servers.json', 'utf8')) as { addr: string }[];
        for (let s of list) servers.set(s.addr, { addr: s.addr, ws: null });
    } catch (e) { }
}

async function check(url: string): Promise<boolean> {
    try {
        return await new Promise(r => {
            let s = new WebSocket(url);
            let d = false;
            let to = setTimeout(() => { if (!d) { d = true; s.close(); r(false); } }, 10000);

            s.onopen = () => { s.send('Accept: MOTD'); };
            s.onmessage = (msg) => {
                if (!d) {
                    try {
                        let json = JSON.parse(msg.data as string);
                        if (json.motd || json.name || json.max || json.online) {
                            d = true; s.close(); clearTimeout(to); r(true);
                        }
                    } catch (e) { }
                }
            };
            s.onerror = s.onclose = () => { if (!d) { d = true; clearTimeout(to); r(false); } };
        });
    } catch { return false; }
}

const server = Bun.serve({
    port: 3000,
    fetch(req, server) {
        let url = new URL(req.url);

        if (url.pathname === '/ws') {
            if (server.upgrade(req)) return;
            return new Response('upgrade failed', { status: 500 });
        }

        if (url.pathname === '/api/servers') {
            let list = Array.from(servers.values()).filter(s => s.ws !== null).map(s => ({ server: s.addr }));
            return Response.json(list);
        }

        return new Response('not found', { status: 404 });
    },
    websocket: {
        open(ws) { },
        async message(ws, msg) {
            try {
                let data = JSON.parse(msg.toString());
                if (data.type === 'register' && data.server) {
                    let addr: string = data.server.endsWith('/') ? data.server.slice(0, -1) : data.server;

                    let existing = servers.get(addr);
                    if (existing && existing.ws && existing.ws !== ws) {
                        ws.send(JSON.stringify({ type: 'error', msg: 'already registered' }));
                        ws.close();
                        return;
                    }

                    let valid = await check(addr);
                    if (!valid) {
                        ws.send(JSON.stringify({ type: 'error', msg: 'not an eagler server' }));
                        ws.close();
                        return;
                    }

                    servers.set(addr, { addr, ws: ws as unknown as WebSocket });
                    ws.data = { addr };
                    ws.send(JSON.stringify({ type: 'ok' }));
                    save();
                }
            } catch (e) { }
        },
        close(ws) {
            let data = ws.data as ServerData | undefined;
            if (data && data.addr) {
                servers.delete(data.addr);
                save();
            }
        },
    },
});

console.log('registry running on ' + server.port);
