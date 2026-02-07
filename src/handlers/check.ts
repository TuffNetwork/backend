const MAX_CONCURRENT_CHECKS = 10;
let activeChecks = 0;

export async function checkServer(url: string): Promise<boolean> {
    if (activeChecks >= MAX_CONCURRENT_CHECKS) return false;
    activeChecks++;
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
                        if ('motd' in json || 'name' in json || 'max' in json || 'online' in json) {
                            d = true; s.close(); clearTimeout(to); r(true);
                        }
                    } catch (e) { }
                }
            };
            s.onerror = s.onclose = () => { if (!d) { d = true; clearTimeout(to); r(false); } };
        });
    } catch { return false; } finally { activeChecks--; }
}