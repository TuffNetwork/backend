import { existsSync, readFileSync } from 'fs';
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

export const load = () => {
    if (!existsSync('./servers.json')) return;
    try {
        let list = JSON.parse(readFileSync('./servers.json', 'utf8')) as { addr: string }[];
        for (let s of list) {
            if (servers.size >= MAX_SERVERS) break;
            servers.set(s.addr, { addr: s.addr, ws: null });
        }
    } catch { }
};