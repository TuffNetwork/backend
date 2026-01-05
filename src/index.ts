import { servers, save, load, type ServerData } from './lib';
import { checkServer } from './handlers';

load();

const server = Bun.serve({
    port: 6700,
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

                    let valid = await checkServer(addr);
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