export async function checkServer(url: string): Promise<boolean> {
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