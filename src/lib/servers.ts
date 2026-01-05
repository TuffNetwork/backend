import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { ServerEntry } from './types';

export const servers = new Map<string, ServerEntry>();

export const save = () => {
    let list = Array.from(servers.values()).map(s => ({ addr: s.addr }));
    writeFileSync('./servers.json', JSON.stringify(list, null, 2));
};

export const load = () => {
    if (existsSync('./servers.json')) {
        try {
            let list = JSON.parse(readFileSync('./servers.json', 'utf8')) as { addr: string }[];
            for (let s of list) servers.set(s.addr, { addr: s.addr, ws: null });
        } catch (e) { }
    }
};