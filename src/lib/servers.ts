import type { ServerEntry } from './types';

export const MAX_SERVERS = 500;
export const servers = new Map<string, ServerEntry>();

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const save = () => {
    if (saveTimer) return;
    saveTimer = setTimeout(async () => {
        saveTimer = null;
        let list = Array.from(servers.values()).map(s => ({ addr: s.addr }));
        await Bun.write('./servers.json', JSON.stringify(list, null, 2)).catch(() => {});
    }, 2000);
};

export const load = async () => {
    let file = Bun.file('./servers.json');
    if (!(await file.exists())) return;
    try {
        let list = await file.json() as { addr: string }[];
        for (let s of list) {
            if (servers.size >= MAX_SERVERS) break;
            servers.set(s.addr, { addr: s.addr, ws: null });
        }
    } catch { }
};