import { servers, save, load, MAX_SERVERS, validateServerURL, type ServerData } from './lib';
import { checkServer } from './handlers';

load();

const MSG_LIMIT = 5;
const MSG_WINDOW = 10_000;
const msgCounts = new WeakMap<object, { count: number; reset: number }>();

function ratelimited(ws: object) {
    let now = Date.now();
    let entry = msgCounts.get(ws);
    if (!entry || now > entry.reset) {
        msgCounts.set(ws, { count: 1, reset: now + MSG_WINDOW });
        return false;
    }
    return ++entry.count > MSG_LIMIT;
}

function err(ws: any, msg: string) {
    ws.send(JSON.stringify({ type: 'error', msg }));
    ws.close();
}

const server = Bun.serve<ServerData>({
    port: 6700,
    fetch(req, server) {
        let url = new URL(req.url);

        if (url.pathname === '/ws') {
            if (server.upgrade(req, { data: { addr: '' } })) return;
            return new Response('upgrade failed', { status: 500 });
        }

        if (url.pathname === '/api/servers') {
            let list = Array.from(servers.values()).filter(s => s.ws !== null).map(s => ({ server: s.addr }));
            return Response.json(list);
        }

        return new Response('not found', { status: 404 });
    },
    websocket: {
        maxPayloadLength: 4096,
        open(ws) { },
        async message(ws, msg) {
            if (ratelimited(ws)) return err(ws, 'rate limited');

            try {
                let data = JSON.parse(msg.toString());
                if (data.type === 'register' && typeof data.server === 'string') {
                    let addr = await validateServerURL(data.server);
                    if (!addr) return err(ws, 'invalid server url');

                    if (servers.size >= MAX_SERVERS && !servers.has(addr))
                        return err(ws, 'registry full');

                    let existing = servers.get(addr);
                    if (existing && existing.ws && existing.ws !== ws)
                        return err(ws, 'already registered');

                    let valid = await checkServer(addr);
                    if (!valid) return err(ws, 'not an eagler server');

                    servers.set(addr, { addr, ws });
                    ws.data = { addr };
                    ws.send(JSON.stringify({ type: 'ok' }));
                    save();
                }
            } catch { }
        },
        close(ws) {
            if (ws.data?.addr) {
                servers.delete(ws.data.addr);
                save();
            }
        },
    },
});

console.log('registry running on ' + server.port);