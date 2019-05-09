import { net, app } from 'electron';
import os from 'os';
import { promises as fs, createWriteStream, createReadStream, existsSync } from 'fs';
import { Utils } from 'ts-minecraft';
import path from 'path';
import Task from 'treelike-task';
import { createExtractStream } from 'yauzlw';
import { createDecompressor } from 'lzma-native';
import { createHash } from 'crypto';
import { ensureDir, ensureFile } from './fs-utils';

/**
 * @param {Task.Context} context 
 */
export default async function officialEndpoint(context) {
    const root = app.getPath('userData');
    function resolveArch() {
        switch (os.arch()) {
            case 'x86':
            case 'x32': return '32';
            case 'x64': return '64';
            default: return '32';
        }
    }
    function resolveSystem() {
        switch (os.platform()) {
            case 'darwin': return 'osx';
            case 'win32': return 'windows';
            case 'linux': return 'linux';
            default: return '';
        }
    }
    const info = await context.execute('fetchInfo', () => new Promise((resolve, reject) => {
        const req = net.request('https://launchermeta.mojang.com/mc/launcher.json');
        req.on('response', (response) => {
            let str = '';
            response.on('data', (buf) => { str += buf.toString(); });
            response.on('end', (buf) => { resolve(JSON.parse(str)); });
        });
        req.end();
    }));
    const system = resolveSystem();
    const arch = resolveArch();
    if (system === '' || system === 'linux') {
        return '';
    }
    const { sha1, url, version } = info[system][arch].jre;

    const filename = path.basename(url);
    const dest = path.resolve(root, 'temp', filename);

    let needDownload = true;
    if (existsSync(dest)) {
        needDownload = await new Promise((resolve, reject) => {
            const hash = createHash('sha1');
            createReadStream(dest)
                .pipe(hash)
                .on('finish', () => { resolve(hash.digest('hex') !== sha1); });
        });
    }
    if (needDownload) {
        await ensureFile(dest);
        await context.execute('download', Utils.createDownloadWork({
            url,
            checksum: {
                algorithm: 'sha1',
                hash: sha1,
            },
        }, createWriteStream(dest)));
    }

    const javaRoot = path.resolve(root, 'jre');
    await context.execute('decompress', async () => {
        await ensureDir(javaRoot);

        await createReadStream(dest)
            .pipe(createDecompressor())
            .pipe(createExtractStream(javaRoot))
            .promise();
    });
    await context.execute('cleanup', async () => {
        await fs.unlink(dest);
    });
    return version;
}
