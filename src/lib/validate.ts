const PRIVATE_RANGES = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^0\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fd00:/i,
    /^fe80:/i,
    /^::$/,
];

let isPrivate = (h: string) => PRIVATE_RANGES.some(r => r.test(h));

export async function validateServerURL(raw: string): Promise<string | null> {
    let url: URL;
    try { url = new URL(raw); } catch { return null; }

    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') return null;
    if (!url.hostname) return null;
    if (isPrivate(url.hostname)) return null;

    try {
        let { resolve } = await import('dns/promises');
        let addrs = await resolve(url.hostname);
        if (addrs.some(isPrivate)) return null;
    } catch { }

    let clean = url.toString();
    return clean.endsWith('/') ? clean.slice(0, -1) : clean;
}
