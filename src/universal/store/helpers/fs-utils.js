import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';

export function ensureFile(file) {
    return fs.mkdir(dirname(file), { recursive: true }).catch(() => { });
}
export function ensureDir(dir) {
    return fs.mkdir(dir, { recursive: true }).catch(() => { });
}

export function missing(file) {
    return fs.access(file).then(() => false, () => true);
}
export async function remove(file) {
    const s = await fs.stat(file).catch((_) => { });
    if (!s) return;
    if (s.isDirectory()) {
        const childs = await fs.readdir(s);
        await Promise.all(childs.map(p => resolve(file, p)).map(p => remove(p)));
        await fs.rmdir(file);
    } else {
        await fs.unlink(file);
    }
}
export async function copy(src, dest) {
    const s = await fs.stat(src).catch((_) => { });
    if (!s) return;
    if (s.isDirectory()) {
        await ensureDir(dest);
        const childs = await fs.readdir(s);
        await Promise.all(childs.map(p => copy(resolve(src, p), resolve(dest, p))));
    } else {
        await fs.copyFile(src, dest);
    }
}
